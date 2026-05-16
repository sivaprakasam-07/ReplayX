from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class WebhookEvent(BaseModel):
    event_id: str
    event_type: str
    customer_id: str
    invoice_id: Optional[str] = None
    created_at: str
    payload_size_kb: float
    idempotency_key: str
    priority: str

class PaginatedEventsResponse(BaseModel):
    total: int
    limit: int
    skip: int
    events: List[WebhookEvent]

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
    delivery_state: str # success, failed, retry, warning, duplicate, recovered, blocked, critical
    failure_reason: str
    safe_to_replay: bool
    recommended_action: str
    risk_score: float = Field(description="ML predicted risk of failure or duplicate delivery")

class CombinedIntelligenceResponse(BaseModel):
    event: WebhookEvent
    delivery_history: List[DeliveryAttempt]
    analysis: AnalysisResponse

class DashboardMetrics(BaseModel):
    total_events: int
    failed_deliveries: int
    retry_success_rate: float
    safe_replays: int
    critical_endpoints: int
    avg_latency_ms: float

class RetryTimelineItem(BaseModel):
    time: str
    retries: int
    recovered: int

class RetrySummary(BaseModel):
    total_retries: int
    recovery_rate: float
    failed_retries: int

class RetryAnalyticsResponse(BaseModel):
    timeline: List[RetryTimelineItem]
    summary: RetrySummary

class ReplayRecommendation(BaseModel):
    event_id: str
    safe_to_replay: bool
    risk_level: str
    reason: str
    recommended_action: str

class EndpointHealth(BaseModel):
    endpoint: str
    health: str
    uptime: float
    risk_score: float
    avg_latency: float
