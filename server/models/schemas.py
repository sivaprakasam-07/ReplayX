from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class WebhookEvent(BaseModel):
    event_id: str
    event_type: str
    customer_id: str
    invoice_id: Optional[str] = None
    created_at: str
    payload_size_kb: float
    idempotency_key: str
    priority: str

class DeliveryAttempt(BaseModel):
    attempt_id: str
    event_id: str
    endpoint_id: str
    attempt_number: int
    attempted_at: str
    http_status: int
    response_time_ms: int
    response_body_category: str
    timeout: bool
    signature_valid: bool
    retry_scheduled: bool

class EndpointConfig(BaseModel):
    endpoint_id: str
    customer_id: str
    endpoint_url_type: str
    expected_signature_version: str
    avg_success_rate: float
    rate_limit_per_minute: int
    active: bool
    last_config_change_at: str

class ReplayAction(BaseModel):
    event_id: str
    replayed_at: str
    replay_result: str
    duplicate_detected: bool
    manually_triggered: bool

class AnalysisResponse(BaseModel):
    event_id: str
    delivery_state: str # delivered, retrying, failed, expired, duplicate, recovered, unsafe_to_replay
    failure_reason: str # none, customer_endpoint_down, invalid_signature, etc.
    safe_to_replay: bool
    recommended_action: str
    risk_score: float = Field(description="ML predicted risk of failure or duplicate delivery")
