# =============================================================
# src/predictor.py
# =============================================================
# PURPOSE:
#   Loads the 3 trained models and runs inference on any
#   incoming webhook event to produce the exact prediction
#   payload the frontend dashboard expects.
#
# OUTPUT FORMAT (matches requirements exactly):
#   {
#     "ml_predictions": {
#       "retry_success_probability": 87,
#       "predicted_recovery_time": "12s",
#       "risk_level": "medium",
#       "forecast": "stable",
#       "ai_confidence": 94
#     },
#     "failure_patterns": [
#       { "pattern": "timeout_spike", "severity": "high" },
#       { "pattern": "duplicate_retry_loop", "severity": "medium" }
#     ]
#   }
#
# HOW EACH OUTPUT FIELD IS COMPUTED:
#
#   retry_success_probability
#     → model1.predict_proba(X)[1] × 100
#     → probability of class "success" from Model 1
#
#   predicted_recovery_time
#     → computed from avg_response_time_ms and retry_attempts
#     → formula: avg_latency × (max_attempt + 1) + base_delay
#     → expressed in seconds (e.g. "12s", "45s", "2m 10s")
#
#   risk_level
#     → model2.predict(X) → decoded back to "low"/"medium"/"high"
#
#   forecast
#     → derived from risk_level + retry_success_probability
#     → "stable" / "degraded" / "unstable"
#
#   ai_confidence
#     → highest class probability from model2.predict_proba(X) × 100
#     → adjusted by Isolation Forest anomaly score
#     → lower if event looks anomalous (novel pattern)
#
#   failure_patterns
#     → model3 predicts the primary pattern
#     → Isolation Forest adds "anomaly_detected" if score < threshold
#     → severity mapped from risk_level
# =============================================================

import os
import sys
import numpy as np
import joblib

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")


class ReplayXPredictor:
    """
    Loads all trained models once at startup.
    Call predict(features_dict) for each incoming event.
    """

    def __init__(self):
        self.scaler       = joblib.load(f"{MODELS_DIR}/scaler.joblib")
        self.feature_cols = joblib.load(f"{MODELS_DIR}/feature_cols.joblib")
        self.model1       = joblib.load(f"{MODELS_DIR}/model1_success_predictor.joblib")
        self.model2       = joblib.load(f"{MODELS_DIR}/model2_risk_classifier.joblib")
        self.le_risk      = joblib.load(f"{MODELS_DIR}/label_encoder_risk.joblib")
        self.model3_rf    = joblib.load(f"{MODELS_DIR}/model3_pattern_classifier.joblib")
        self.iso_forest   = joblib.load(f"{MODELS_DIR}/model3_isolation_forest.joblib")
        self.le_pattern   = joblib.load(f"{MODELS_DIR}/label_encoder_pattern.joblib")
        print("[ReplayXPredictor] All models loaded successfully.")

    def _build_feature_vector(self, features: dict) -> np.ndarray:
        """
        Takes a raw feature dict and aligns it to the exact column
        order the models were trained on.
        Missing features are filled with 0 (safe default).
        """
        row = {col: features.get(col, 0) for col in self.feature_cols}
        return np.array([list(row.values())])

    def _compute_recovery_time(self, features: dict) -> str:
        """
        Estimates how long until successful recovery.
        Formula:
          base_delay = retry_attempts × avg_retry_gap (30s default)
          latency    = avg_response_time_ms / 1000
          total      = base_delay + latency × (1 + timeout_frequency)
        """
        retry_attempts    = features.get("retry_attempts", 1)
        avg_latency_ms    = features.get("avg_response_time_ms", 500)
        timeout_freq      = features.get("timeout_frequency", 0)
        max_attempt       = features.get("max_attempt_number", 1)

        base_delay_s  = retry_attempts * 30        # 30s between retries
        latency_s     = avg_latency_ms / 1000
        penalty       = 1 + timeout_freq           # timeouts add delay

        total_s = int(base_delay_s + latency_s * penalty + max_attempt * 5)
        total_s = max(total_s, 5)                  # minimum 5s

        if total_s < 60:
            return f"{total_s}s"
        else:
            minutes = total_s // 60
            seconds = total_s % 60
            return f"{minutes}m {seconds}s" if seconds else f"{minutes}m"

    def _compute_forecast(self, risk_level: str, success_prob: float) -> str:
        """
        Maps risk_level + success_probability to a forecast label.

          stable    → low risk OR high success probability
          degraded  → medium risk AND moderate success probability
          unstable  → high risk OR low success probability
        """
        if risk_level == "low" or success_prob >= 75:
            return "stable"
        elif risk_level == "medium" or success_prob >= 45:
            return "degraded"
        else:
            return "unstable"

    def _compute_ai_confidence(
        self,
        model2_proba: np.ndarray,
        anomaly_score: float
    ) -> int:
        """
        Combines two signals:
          1. model2 max class probability — how certain is the classifier?
          2. Isolation Forest anomaly score — is this a novel/unseen event?
             Higher anomaly score = more "normal" = higher confidence.
             Lower (negative) anomaly score = anomalous = lower confidence.

        Formula:
          base_confidence = max(model2_proba) × 100
          anomaly_penalty = clip(anomaly_score × 100, -20, +10)
          final = base_confidence + anomaly_penalty
        """
        base_confidence = float(np.max(model2_proba)) * 100
        anomaly_penalty = float(np.clip(anomaly_score * 100, -20, 10))
        confidence = int(np.clip(base_confidence + anomaly_penalty, 40, 99))
        return confidence

    def _get_pattern_severity(self, pattern: str, risk_level: str) -> str:
        """
        Maps pattern type to severity.
        High-severity patterns are always high regardless of risk_level.
        """
        always_high = {"timeout_spike", "unstable_endpoint"}
        always_medium = {"duplicate_retry_loop", "rate_limit_burst"}

        if pattern in always_high:
            return "high"
        elif pattern in always_medium:
            return "medium"
        elif risk_level == "high":
            return "high"
        elif risk_level == "medium":
            return "medium"
        else:
            return "low"

    def predict(self, features: dict) -> dict:
        """
        Main prediction function.

        Input:  dict with feature values (from FastAPI endpoint)
        Output: prediction payload matching frontend requirements

        Usage:
            predictor = ReplayXPredictor()
            result = predictor.predict({
                "retry_attempts": 4,
                "avg_response_time_ms": 1200,
                "timeout_count": 2,
                "timeout_frequency": 0.5,
                "success_count": 0,
                "error_5xx_count": 3,
                "avg_success_rate": 0.3,
                ... (other features)
            })
        """
        # Build and scale the feature vector
        X_raw = self._build_feature_vector(features)
        X_scaled = self.scaler.transform(X_raw)

        # ── Model 1: Retry success probability ───────────────
        success_proba = self.model1.predict_proba(X_scaled)[0]
        success_prob  = int(round(success_proba[1] * 100))

        # ── Model 2: Risk level + confidence ─────────────────
        risk_proba = self.model2.predict_proba(X_scaled)[0]
        risk_idx   = int(np.argmax(risk_proba))
        risk_level = self.le_risk.inverse_transform([risk_idx])[0]

        # ── Model 3A: Failure pattern ─────────────────────────
        pattern_proba = self.model3_rf.predict_proba(X_scaled)[0]
        pattern_idx   = int(np.argmax(pattern_proba))
        primary_pattern = self.le_pattern.inverse_transform([pattern_idx])[0]

        # Top 2 patterns (if probabilities are meaningful)
        top2_idx = np.argsort(pattern_proba)[::-1][:2]
        patterns = []
        for idx in top2_idx:
            pat = self.le_pattern.inverse_transform([idx])[0]
            prob = pattern_proba[idx]
            if prob > 0.05 and pat != "normal":  # skip "normal" and low-prob
                severity = self._get_pattern_severity(pat, risk_level)
                patterns.append({"pattern": pat, "severity": severity})

        # ── Model 3B: Isolation Forest anomaly score ──────────
        anomaly_score = float(self.iso_forest.decision_function(X_scaled)[0])
        is_anomaly    = bool(self.iso_forest.predict(X_scaled)[0] == -1)

        if is_anomaly and not any(p["pattern"] == "anomaly_detected" for p in patterns):
            patterns.append({"pattern": "anomaly_detected", "severity": "high"})

        # ── Derived outputs ───────────────────────────────────
        recovery_time = self._compute_recovery_time(features)
        forecast      = self._compute_forecast(risk_level, success_prob)
        ai_confidence = self._compute_ai_confidence(risk_proba, anomaly_score)

        return {
            "ml_predictions": {
                "retry_success_probability": success_prob,
                "predicted_recovery_time":   recovery_time,
                "risk_level":                risk_level,
                "forecast":                  forecast,
                "ai_confidence":             ai_confidence,
            },
            "failure_patterns": patterns,
            "_debug": {
                "anomaly_score":         round(anomaly_score, 4),
                "is_anomaly":            is_anomaly,
                "model1_proba":          [round(p, 4) for p in success_proba],
                "model2_proba":          {
                    cls: round(prob, 4)
                    for cls, prob in zip(self.le_risk.classes_, risk_proba)
                },
                "primary_pattern_proba": round(float(np.max(pattern_proba)), 4),
            }
        }


# Quick smoke test
if __name__ == "__main__":
    predictor = ReplayXPredictor()

    # Test Case 1: High-risk event (many retries, timeouts, high latency)
    print("\n=== Test Case 1: High-risk (timeout-heavy event) ===")
    result1 = predictor.predict({
        "retry_attempts": 5,
        "max_attempt_number": 5,
        "avg_response_time_ms": 3500,
        "max_response_time_ms": 4800,
        "min_response_time_ms": 2100,
        "std_response_time_ms": 900,
        "timeout_count": 3,
        "timeout_frequency": 0.6,
        "success_count": 0,
        "error_4xx_count": 0,
        "error_5xx_count": 4,
        "error_rate_4xx": 0.0,
        "error_rate_5xx": 0.8,
        "success_rate_attempts": 0.0,
        "retry_scheduled_count": 5,
        "retry_scheduled_rate": 1.0,
        "rate_limited_count": 0,
        "payload_error_count": 0,
        "invalid_sig_count": 0,
        "avg_success_rate": 0.15,
        "endpoint_active": 1,
        "payload_size_kb": 45,
        "payload_large_flag": 0,
        "replay_count": 1,
        "duplicate_detected": 0,
        "priority_encoded": 2,
        "latency_volatility": 0.26,
    })
    import json
    print(json.dumps(result1, indent=2))

    # Test Case 2: Low-risk event (delivered successfully)
    print("\n=== Test Case 2: Low-risk (healthy delivery) ===")
    result2 = predictor.predict({
        "retry_attempts": 1,
        "max_attempt_number": 1,
        "avg_response_time_ms": 220,
        "max_response_time_ms": 260,
        "min_response_time_ms": 180,
        "std_response_time_ms": 40,
        "timeout_count": 0,
        "timeout_frequency": 0.0,
        "success_count": 1,
        "error_4xx_count": 0,
        "error_5xx_count": 0,
        "error_rate_4xx": 0.0,
        "error_rate_5xx": 0.0,
        "success_rate_attempts": 1.0,
        "retry_scheduled_count": 0,
        "retry_scheduled_rate": 0.0,
        "rate_limited_count": 0,
        "payload_error_count": 0,
        "invalid_sig_count": 0,
        "avg_success_rate": 0.92,
        "endpoint_active": 1,
        "payload_size_kb": 15,
        "payload_large_flag": 0,
        "replay_count": 0,
        "duplicate_detected": 0,
        "priority_encoded": 1,
        "latency_volatility": 0.18,
    })
    print(json.dumps(result2, indent=2))

    # Test Case 3: Payload too large (413 errors)
    print("\n=== Test Case 3: Payload too large ===")
    result3 = predictor.predict({
        "retry_attempts": 3,
        "max_attempt_number": 3,
        "avg_response_time_ms": 180,
        "max_response_time_ms": 210,
        "min_response_time_ms": 150,
        "std_response_time_ms": 25,
        "timeout_count": 0,
        "timeout_frequency": 0.0,
        "success_count": 0,
        "error_4xx_count": 3,
        "error_5xx_count": 0,
        "error_rate_4xx": 1.0,
        "error_rate_5xx": 0.0,
        "success_rate_attempts": 0.0,
        "retry_scheduled_count": 3,
        "retry_scheduled_rate": 1.0,
        "rate_limited_count": 0,
        "payload_error_count": 3,
        "invalid_sig_count": 0,
        "avg_success_rate": 0.45,
        "endpoint_active": 1,
        "payload_size_kb": 95,
        "payload_large_flag": 1,
        "replay_count": 0,
        "duplicate_detected": 0,
        "priority_encoded": 0,
        "latency_volatility": 0.14,
    })
    print(json.dumps(result3, indent=2))