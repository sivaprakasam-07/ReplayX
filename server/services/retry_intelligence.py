from typing import List, Dict, Any

class RetryIntelligenceEngine:
    """
    Core Rule-Based Engine developed by Backend Lead (Nandhakishore).
    Analyzes delivery history to classify the state and safety of webhooks.
    """

    def analyze(self, event: Dict[str, Any], attempts: List[Dict[str, Any]], endpoint: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main analysis function to determine delivery state and failure reasons.
        """
        # Default baseline
        delivery_state = "retry"
        failure_reason = "none"
        safe_to_replay = True
        recommended_action = "none"

        if not attempts:
            return {
                "delivery_state": "failed",
                "failure_reason": "no_attempts_recorded",
                "safe_to_replay": True,
                "recommended_action": "trigger_initial_delivery"
            }

        # Check if endpoint is active
        if not endpoint.get("active", True):
            delivery_state = "critical"
            failure_reason = "endpoint_deleted"
            safe_to_replay = False
            recommended_action = "contact_customer_to_restore_endpoint"
            return self._build_response(delivery_state, failure_reason, safe_to_replay, recommended_action)

        latest_attempt = attempts[-1]
        has_success = any(a.get("response_body_category") == "success" for a in attempts)
        
        if has_success:
            # Check for duplicates (multiple successes)
            success_count = sum(1 for a in attempts if a.get("response_body_category") == "success")
            if success_count > 1:
                delivery_state = "duplicate"
                failure_reason = "duplicate_event"
                safe_to_replay = False
                recommended_action = "suppress_retries"
            else:
                # Did it fail before succeeding?
                if len(attempts) > 1:
                    delivery_state = "recovered"
                    failure_reason = "none"
                    safe_to_replay = False
                    recommended_action = "none"
                else:
                    delivery_state = "success"
                    failure_reason = "none"
                    safe_to_replay = False
                    recommended_action = "none"
            return self._build_response(delivery_state, failure_reason, safe_to_replay, recommended_action)

        # All attempts failed so far. Analyze why.
        if latest_attempt.get("response_body_category") == "invalid_signature":
            delivery_state = "blocked"
            failure_reason = "invalid_signature"
            safe_to_replay = False
            recommended_action = "verify_customer_secret_and_signature_algorithm"

        elif latest_attempt.get("response_body_category") == "rate_limited":
            delivery_state = "warning" if latest_attempt.get("retry_scheduled") else "failed"
            failure_reason = "rate_limited"
            safe_to_replay = True
            recommended_action = "apply_exponential_backoff_or_increase_customer_limit"

        elif latest_attempt.get("response_body_category") == "payload_too_large":
            delivery_state = "blocked"
            failure_reason = "payload_too_large"
            safe_to_replay = False
            recommended_action = "compress_payload_or_send_reference_id_only"

        elif latest_attempt.get("response_body_category") in ["endpoint_not_found", "server_error", "timeout", "malformed_response"]:
            delivery_state = "retry" if latest_attempt.get("retry_scheduled") else "failed"
            failure_reason = "customer_endpoint_down"
            safe_to_replay = True
            recommended_action = "monitor_endpoint_health"
            
            if len(attempts) >= 5: # Assuming 5 is max retries
                 delivery_state = "critical"
                 failure_reason = "timeout" # Or customer_endpoint_down
                 safe_to_replay = True
                 recommended_action = "mark_as_dead_letter_and_notify_support"

        return self._build_response(delivery_state, failure_reason, safe_to_replay, recommended_action)

    def _build_response(self, state: str, reason: str, safe: bool, action: str) -> Dict[str, Any]:
        return {
            "delivery_state": state,
            "failure_reason": reason,
            "safe_to_replay": safe,
            "recommended_action": action
        }

intelligence_engine = RetryIntelligenceEngine()
