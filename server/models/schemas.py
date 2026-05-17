from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
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
    delivery_state: Optional[str] = None

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

class FailurePattern(BaseModel):
    pattern: str
    severity: str

class MLPredictions(BaseModel):
    retry_success_probability: int = Field(default=50, description="0-100")
    predicted_recovery_time: str = Field(default="30s")
    risk_level: str = Field(default="medium")
    forecast: str = Field(default="degraded")
    ai_confidence: int = Field(default=50, description="0-100")

class AnalysisResponse(BaseModel):
    event_id: str
    delivery_state: str
    failure_reason: str
    safe_to_replay: bool
    recommended_action: str
    risk_score: float = Field(default=0.5, description="ML predicted risk (0.0-1.0)")
    ml_predictions: Optional[MLPredictions] = None
    failure_patterns: List[FailurePattern] = Field(default_factory=list)

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

class EnrichedRetryAnalyticsResponse(BaseModel):
    timeline: List[RetryTimelineItem]
    summary: RetrySummary
    ml_predictions: Dict[str, Any] = {}
    failure_patterns: List[FailurePattern] = []
    retry_events: List[Dict[str, Any]] = []

class ReplayRecommendation(BaseModel):
    event_id: str
    safe_to_replay: bool
    risk_level: str
    reason: str
    recommended_action: str

class EnrichedReplayRecommendation(BaseModel):
    event_id: str
    safe_to_replay: bool
    risk_level: str
    reason: str
    recommended_action: str
    risk_score: float = 0.0
    ml_confidence: int = 0
    failure_patterns: List[FailurePattern] = []

class EndpointHealth(BaseModel):
    endpoint: str
    health: str
    uptime: float
    risk_score: float
    avg_latency: float


class TriggerResponse(BaseModel):
    status: str
    operation_id: str
    event_id: str
    operation_type: str
    scheduled_at: str


class OperationStatus(BaseModel):
    operation_id: str
    event_id: str
    operation_type: str
    status: str
    attempt_number: int
    scheduled_at: str
    next_retry_at: Optional[str] = ""
    result: Any = None
    created_at: str
    updated_at: str


class ScheduleResponse(BaseModel):
    status: str
    operations: list = []
    reason: str = ""
