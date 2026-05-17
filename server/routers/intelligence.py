from fastapi import APIRouter, HTTPException
from models.schemas import AnalysisResponse, MLPredictions, FailurePattern
from services.webhook_service import get_event_by_id, get_delivery_attempts, get_endpoint_config
from services.retry_intelligence import intelligence_engine
from services.ml_integration import ml_scorer

router = APIRouter(prefix="/api/v1/intelligence", tags=["Intelligence"])

@router.get("/analyze/{event_id}", response_model=AnalysisResponse)
async def analyze_webhook_delivery(event_id: str):
    event = await get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    attempts = await get_delivery_attempts(event_id)

    endpoint_id = attempts[0]["endpoint_id"] if attempts else None
    endpoint = {}
    if endpoint_id:
        endpoint = await get_endpoint_config(endpoint_id) or {}

    analysis_result = intelligence_engine.analyze(event, attempts, endpoint)
    risk_score = ml_scorer.calculate_risk_score(event, attempts, endpoint)
    full_ml = ml_scorer.get_full_prediction(event, attempts, endpoint)

    ml_preds = full_ml.get("ml_predictions", {})
    patterns = full_ml.get("failure_patterns", [])

    return AnalysisResponse(
        event_id=event_id,
        delivery_state=analysis_result["delivery_state"],
        failure_reason=analysis_result["failure_reason"],
        safe_to_replay=analysis_result["safe_to_replay"],
        recommended_action=analysis_result["recommended_action"],
        risk_score=risk_score,
        ml_predictions=MLPredictions(
            retry_success_probability=ml_preds.get("retry_success_probability", 50),
            predicted_recovery_time=ml_preds.get("predicted_recovery_time", "30s"),
            risk_level=ml_preds.get("risk_level", "medium"),
            forecast=ml_preds.get("forecast", "degraded"),
            ai_confidence=ml_preds.get("ai_confidence", 50),
        ),
        failure_patterns=[FailurePattern(**p) for p in patterns]
    )
