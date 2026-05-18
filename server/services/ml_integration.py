import os
import sys
import math
import numpy as np
from typing import List, Dict, Any, Optional

ML_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml")
sys.path.insert(0, ML_DIR)

from src.predictor import ReplayXPredictor


def _extract_features(
    event: Dict[str, Any],
    attempts: List[Dict[str, Any]],
    endpoint: Dict[str, Any]
) -> Dict[str, Any]:
    features = {}

    retry_attempts = len(attempts)
    features["retry_attempts"] = retry_attempts
    features["max_attempt_number"] = max((a.get("attempt_number", 0) for a in attempts), default=0)

    response_times = [a.get("response_time_ms", 0) or 0 for a in attempts]
    features["avg_response_time_ms"] = np.mean(response_times) if response_times else 500
    features["max_response_time_ms"] = max(response_times) if response_times else 500
    features["min_response_time_ms"] = min(response_times) if response_times else 500
    features["std_response_time_ms"] = float(np.std(response_times)) if len(response_times) > 1 else 0

    timeout_count = sum(1 for a in attempts if a.get("timeout", False))
    features["timeout_count"] = timeout_count
    features["timeout_frequency"] = timeout_count / retry_attempts if retry_attempts > 0 else 0.0

    retry_scheduled_count = sum(1 for a in attempts if a.get("retry_scheduled", False))
    features["retry_scheduled_count"] = retry_scheduled_count
    features["retry_scheduled_rate"] = retry_scheduled_count / retry_attempts if retry_attempts > 0 else 0.0

    features["success_count"] = sum(1 for a in attempts if a.get("http_status", 0) == 200)
    features["error_4xx_count"] = sum(1 for a in attempts if 400 <= (a.get("http_status", 0) or 0) < 500)
    features["error_5xx_count"] = sum(1 for a in attempts if 500 <= (a.get("http_status", 0) or 0) < 600)
    features["error_rate_4xx"] = features["error_4xx_count"] / retry_attempts if retry_attempts > 0 else 0.0
    features["error_rate_5xx"] = features["error_5xx_count"] / retry_attempts if retry_attempts > 0 else 0.0
    features["success_rate_attempts"] = features["success_count"] / retry_attempts if retry_attempts > 0 else 0.0

    features["rate_limited_count"] = sum(1 for a in attempts if a.get("http_status", 0) == 429)
    features["payload_error_count"] = sum(1 for a in attempts if a.get("http_status", 0) == 413)
    features["invalid_sig_count"] = sum(1 for a in attempts if not a.get("signature_valid", True))

    statuses = [a.get("http_status", 200) or 200 for a in attempts]
    features["dominant_http_status"] = max(set(statuses), key=statuses.count) if statuses else 200

    features["avg_success_rate"] = endpoint.get("avg_success_rate", 0.5) or 0.5
    features["rate_limit_per_minute"] = endpoint.get("rate_limit_per_minute", 60) or 60
    features["endpoint_active"] = 1 if endpoint.get("active", True) else 0

    features["payload_size_kb"] = event.get("payload_size_kb", 10) or 10
    features["payload_large_flag"] = 1 if features["payload_size_kb"] > 50 else 0

    priority_map = {"low": 0, "normal": 1, "high": 2}
    features["priority_encoded"] = priority_map.get(event.get("priority", "normal"), 1)

    features["replay_count"] = 0
    features["duplicate_detected"] = 0
    features["manually_triggered"] = 0
    features["replay_success_count"] = 0
    features["replay_failed_count"] = 0
    features["replay_duplicate_count"] = 0

    avg_rt = features["avg_response_time_ms"]
    features["latency_volatility"] = features["std_response_time_ms"] / avg_rt if avg_rt > 0 else 0.0
    features["rate_limit_pressure"] = retry_attempts / features["rate_limit_per_minute"] if features["rate_limit_per_minute"] > 0 else 0.0
    features["log_avg_response_time_ms"] = math.log1p(avg_rt)
    features["log_max_response_time_ms"] = math.log1p(features["max_response_time_ms"])
    features["log_payload_size_kb"] = math.log1p(features["payload_size_kb"])

    return features


def _normalize_probability(probability: Any, default: float = 50.0) -> float:
    try:
        value = float(probability)
    except (TypeError, ValueError):
        return default

    if value <= 1:
        value *= 100

    return max(0.0, min(100.0, value))


class MLRiskScorer:
    def __init__(self):
        try:
            self.predictor = ReplayXPredictor()
            self.initialized = True
        except Exception as e:
            print(f"[MLRiskScorer] Failed to load ML models: {e}")
            print("[MLRiskScorer] Falling back to rule-based risk scoring")
            self.initialized = False

    def calculate_risk_score(
        self,
        event: Dict[str, Any],
        attempts: List[Dict[str, Any]],
        endpoint: Dict[str, Any]
    ) -> float:
        if not self.initialized:
            return 0.2

        features = _extract_features(event, attempts, endpoint)
        result = self.predictor.predict(features)

        risk_level = result["ml_predictions"]["risk_level"]
        risk_map = {"low": 0.2, "medium": 0.5, "high": 0.85}
        base_risk = risk_map.get(risk_level, 0.5)

        prob = _normalize_probability(result["ml_predictions"]["retry_success_probability"])
        prob_factor = (100 - prob) / 100

        return round((base_risk * 0.6 + prob_factor * 0.4), 2)

    def get_retry_success_probability(
        self,
        event: Dict[str, Any],
        attempts: List[Dict[str, Any]],
        endpoint: Dict[str, Any]
    ) -> float:
        prediction = self.get_full_prediction(event, attempts, endpoint)
        retry_probability = prediction.get("ml_predictions", {}).get("retry_success_probability", 50)
        return _normalize_probability(retry_probability)

    def get_full_prediction(
        self,
        event: Dict[str, Any],
        attempts: List[Dict[str, Any]],
        endpoint: Dict[str, Any]
    ) -> Dict[str, Any]:
        if not self.initialized:
            return {
                "ml_predictions": {
                    "retry_success_probability": 50,
                    "predicted_recovery_time": "30s",
                    "risk_level": "medium",
                    "forecast": "degraded",
                    "ai_confidence": 50
                },
                "failure_patterns": []
            }

        features = _extract_features(event, attempts, endpoint)
        return self.predictor.predict(features)


ml_scorer = MLRiskScorer()
