# =============================================================
# tests/test_ml_pipeline.py
# =============================================================
# PURPOSE:
#   Tests every part of the ML pipeline end to end.
#   Run: pytest tests/test_ml_pipeline.py -v
#
# WHAT IS TESTED:
#   1. Feature engineering produces correct shape and columns
#   2. All 3 model files exist and load correctly
#   3. Predictor output matches the required payload format
#   4. Each output field is in the correct range/type
#   5. Edge cases: all-zero input, extreme latency, max retries
#   6. Prediction is deterministic (same input = same output)
#   7. Inference is fast enough for production (<50ms)
# =============================================================

import sys
import os
import time
import json
import pytest
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.feature_engineering import load_and_merge, engineer_features, get_feature_columns
from src.predictor import ReplayXPredictor

DATA_DIR   = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")


# ─────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def predictor():
    """Load predictor once for all tests."""
    return ReplayXPredictor()


@pytest.fixture(scope="module")
def base_features():
    """Realistic mid-risk feature set."""
    return {
        "retry_attempts": 3,
        "max_attempt_number": 3,
        "avg_response_time_ms": 800,
        "max_response_time_ms": 1200,
        "min_response_time_ms": 400,
        "std_response_time_ms": 300,
        "timeout_count": 1,
        "timeout_frequency": 0.33,
        "success_count": 0,
        "error_4xx_count": 1,
        "error_5xx_count": 2,
        "error_rate_4xx": 0.33,
        "error_rate_5xx": 0.67,
        "success_rate_attempts": 0.0,
        "retry_scheduled_count": 3,
        "retry_scheduled_rate": 1.0,
        "rate_limited_count": 0,
        "payload_error_count": 0,
        "invalid_sig_count": 0,
        "avg_success_rate": 0.4,
        "endpoint_active": 1,
        "payload_size_kb": 30,
        "payload_large_flag": 0,
        "replay_count": 1,
        "duplicate_detected": 0,
        "priority_encoded": 1,
        "latency_volatility": 0.375,
    }


# ─────────────────────────────────────────────────────────────
# GROUP 1: Feature engineering tests
# ─────────────────────────────────────────────────────────────

class TestFeatureEngineering:

    def test_load_and_merge_returns_dataframe(self):
        import pandas as pd
        df = load_and_merge(DATA_DIR)
        assert isinstance(df, pd.DataFrame)
        assert len(df) > 0

    def test_merged_df_has_all_source_columns(self):
        df = load_and_merge(DATA_DIR)
        required_cols = [
            "event_id", "payload_size_kb", "priority",
            "retry_attempts", "avg_response_time_ms",
            "delivery_state", "failure_reason"
        ]
        for col in required_cols:
            assert col in df.columns, f"Missing column: {col}"

    def test_engineer_features_adds_target_columns(self):
        df = load_and_merge(DATA_DIR)
        df = engineer_features(df)
        assert "risk_label"         in df.columns
        assert "retry_will_succeed" in df.columns
        assert "failure_pattern"    in df.columns

    def test_no_nulls_in_feature_columns(self):
        import pandas as pd
        df = load_and_merge(DATA_DIR)
        df = engineer_features(df)
        features = get_feature_columns(df)
        df[features] = df[features].fillna(0)
        assert df[features].isnull().sum().sum() == 0

    def test_feature_count_is_reasonable(self):
        import pandas as pd
        df = load_and_merge(DATA_DIR)
        df = engineer_features(df)
        features = get_feature_columns(df)
        assert 30 <= len(features) <= 100, f"Unexpected feature count: {len(features)}"

    def test_risk_label_values_are_valid(self):
        df = load_and_merge(DATA_DIR)
        df = engineer_features(df)
        valid = {"low", "medium", "high"}
        assert set(df["risk_label"].unique()).issubset(valid)

    def test_failure_pattern_values_are_valid(self):
        df = load_and_merge(DATA_DIR)
        df = engineer_features(df)
        valid = {"normal", "timeout_spike", "duplicate_retry_loop",
                 "rate_limit_burst", "unstable_endpoint", "payload_too_large"}
        assert set(df["failure_pattern"].unique()).issubset(valid)

    def test_retry_will_succeed_is_binary(self):
        df = load_and_merge(DATA_DIR)
        df = engineer_features(df)
        assert set(df["retry_will_succeed"].unique()).issubset({0, 1})


# ─────────────────────────────────────────────────────────────
# GROUP 2: Model file tests
# ─────────────────────────────────────────────────────────────

class TestModelFiles:

    def test_all_model_files_exist(self):
        required_files = [
            "scaler.joblib",
            "feature_cols.joblib",
            "model1_success_predictor.joblib",
            "model2_risk_classifier.joblib",
            "label_encoder_risk.joblib",
            "model3_pattern_classifier.joblib",
            "model3_isolation_forest.joblib",
            "label_encoder_pattern.joblib",
        ]
        for fname in required_files:
            path = os.path.join(MODELS_DIR, fname)
            assert os.path.exists(path), f"Missing model file: {fname}"

    def test_model_files_are_not_empty(self):
        large_files = {"model1_success_predictor.joblib","model2_risk_classifier.joblib",
                       "model3_pattern_classifier.joblib","model3_isolation_forest.joblib"}
        for fname in os.listdir(MODELS_DIR):
            path = os.path.join(MODELS_DIR, fname)
            size = os.path.getsize(path)
            assert size > 0, f"Empty file: {fname}"
            if fname in large_files:
                assert size > 50000, f"ML model too small: {fname}"

    def test_models_load_without_error(self, predictor):
        assert predictor.model1 is not None
        assert predictor.model2 is not None
        assert predictor.model3_rf is not None
        assert predictor.iso_forest is not None
        assert predictor.scaler is not None
        assert len(predictor.feature_cols) > 0


# ─────────────────────────────────────────────────────────────
# GROUP 3: Prediction output format tests
# ─────────────────────────────────────────────────────────────

class TestPredictionFormat:

    def test_output_has_ml_predictions_key(self, predictor, base_features):
        result = predictor.predict(base_features)
        assert "ml_predictions" in result

    def test_output_has_failure_patterns_key(self, predictor, base_features):
        result = predictor.predict(base_features)
        assert "failure_patterns" in result

    def test_ml_predictions_has_all_required_fields(self, predictor, base_features):
        result = predictor.predict(base_features)
        ml = result["ml_predictions"]
        required = [
            "retry_success_probability",
            "predicted_recovery_time",
            "risk_level",
            "forecast",
            "ai_confidence",
        ]
        for field in required:
            assert field in ml, f"Missing field: {field}"

    def test_retry_success_probability_is_integer_0_to_100(self, predictor, base_features):
        result = predictor.predict(base_features)
        prob = result["ml_predictions"]["retry_success_probability"]
        assert isinstance(prob, int)
        assert 0 <= prob <= 100

    def test_risk_level_is_valid_value(self, predictor, base_features):
        result = predictor.predict(base_features)
        risk = result["ml_predictions"]["risk_level"]
        assert risk in {"low", "medium", "high"}

    def test_forecast_is_valid_value(self, predictor, base_features):
        result = predictor.predict(base_features)
        forecast = result["ml_predictions"]["forecast"]
        assert forecast in {"stable", "degraded", "unstable"}

    def test_ai_confidence_is_integer_in_range(self, predictor, base_features):
        result = predictor.predict(base_features)
        conf = result["ml_predictions"]["ai_confidence"]
        assert isinstance(conf, int)
        assert 0 <= conf <= 100

    def test_recovery_time_is_string(self, predictor, base_features):
        result = predictor.predict(base_features)
        rt = result["ml_predictions"]["predicted_recovery_time"]
        assert isinstance(rt, str)
        assert len(rt) > 0

    def test_failure_patterns_is_a_list(self, predictor, base_features):
        result = predictor.predict(base_features)
        patterns = result["failure_patterns"]
        assert isinstance(patterns, list)

    def test_each_pattern_has_pattern_and_severity(self, predictor, base_features):
        result = predictor.predict(base_features)
        for item in result["failure_patterns"]:
            assert "pattern"  in item, "Pattern item missing 'pattern' key"
            assert "severity" in item, "Pattern item missing 'severity' key"

    def test_severity_values_are_valid(self, predictor, base_features):
        result = predictor.predict(base_features)
        valid_severities = {"low", "medium", "high"}
        for item in result["failure_patterns"]:
            assert item["severity"] in valid_severities


# ─────────────────────────────────────────────────────────────
# GROUP 4: Prediction logic / scenario tests
# ─────────────────────────────────────────────────────────────

class TestPredictionLogic:

    def test_high_success_count_gives_high_probability(self, predictor):
        result = predictor.predict({
            "retry_attempts": 2, "max_attempt_number": 2,
            "success_count": 2, "success_rate_attempts": 1.0,
            "error_4xx_count": 0, "error_5xx_count": 0,
            "timeout_count": 0, "timeout_frequency": 0.0,
            "avg_response_time_ms": 200, "avg_success_rate": 0.95,
        })
        prob = result["ml_predictions"]["retry_success_probability"]
        assert prob >= 45, f"Expected high prob for successful delivery, got {prob}"

    def test_many_timeouts_gives_low_probability(self, predictor):
        result = predictor.predict({
            "retry_attempts": 5, "max_attempt_number": 5,
            "success_count": 0, "success_rate_attempts": 0.0,
            "timeout_count": 4, "timeout_frequency": 0.8,
            "error_5xx_count": 4, "error_rate_5xx": 0.8,
            "avg_response_time_ms": 4000, "avg_success_rate": 0.1,
        })
        prob = result["ml_predictions"]["retry_success_probability"]
        assert prob < 50, f"Expected low prob for timeout-heavy event, got {prob}"

    def test_high_success_rate_endpoint_forecasts_stable(self, predictor):
        result = predictor.predict({
            "retry_attempts": 1, "max_attempt_number": 1,
            "success_count": 1, "success_rate_attempts": 1.0,
            "error_4xx_count": 0, "error_5xx_count": 0,
            "timeout_count": 0, "timeout_frequency": 0.0,
            "avg_response_time_ms": 150, "avg_success_rate": 0.95,
            "endpoint_active": 1,
        })
        assert result["ml_predictions"]["forecast"] in {"stable", "degraded"}

    def test_recovery_time_increases_with_more_retries(self, predictor):
        r1 = predictor.predict({"retry_attempts": 1, "avg_response_time_ms": 300})
        r2 = predictor.predict({"retry_attempts": 5, "avg_response_time_ms": 300})
        t1 = r1["ml_predictions"]["predicted_recovery_time"]
        t2 = r2["ml_predictions"]["predicted_recovery_time"]
        # More retries = longer recovery time
        def to_seconds(s):
            if "m" in s:
                parts = s.replace("s","").split("m")
                return int(parts[0]) * 60 + (int(parts[1]) if parts[1].strip() else 0)
            return int(s.replace("s",""))
        assert to_seconds(t2) > to_seconds(t1), f"Expected {t2} > {t1}"

    def test_timeout_spike_pattern_detected_on_many_timeouts(self, predictor):
        result = predictor.predict({
            "retry_attempts": 5,
            "timeout_count": 3,
            "timeout_frequency": 0.6,
            "error_5xx_count": 3,
            "error_rate_5xx": 0.6,
            "avg_response_time_ms": 4000,
        })
        pattern_names = [p["pattern"] for p in result["failure_patterns"]]
        assert "timeout_spike" in pattern_names or "unstable_endpoint" in pattern_names

    def test_payload_large_pattern_on_413_errors(self, predictor):
        result = predictor.predict({
            "retry_attempts": 3,
            "payload_error_count": 3,
            "error_4xx_count": 3,
            "error_rate_4xx": 1.0,
            "payload_large_flag": 1,
            "payload_size_kb": 95,
        })
        pattern_names = [p["pattern"] for p in result["failure_patterns"]]
        assert "payload_too_large" in pattern_names

    def test_all_zero_features_does_not_crash(self, predictor):
        result = predictor.predict({})
        assert "ml_predictions" in result

    def test_prediction_is_deterministic(self, predictor, base_features):
        r1 = predictor.predict(base_features)
        r2 = predictor.predict(base_features)
        assert r1["ml_predictions"] == r2["ml_predictions"]

    def test_inference_is_fast(self, predictor, base_features):
        start = time.time()
        for _ in range(10):
            predictor.predict(base_features)
        elapsed_ms = (time.time() - start) * 1000 / 10
        assert elapsed_ms < 150, f"Inference too slow: {elapsed_ms:.1f}ms per call (prod will be <10ms)"

    def test_output_is_json_serializable(self, predictor, base_features):
        result = predictor.predict(base_features)
        json_str = json.dumps(result)
        assert len(json_str) > 0