from fastapi import APIRouter, HTTPException
from models.schemas import AnalysisResponse
from services.webhook_service import get_event_by_id, get_delivery_attempts, get_endpoint_config
from services.retry_intelligence import intelligence_engine
from services.ml_integration import ml_scorer

router = APIRouter(prefix="/api/v1/intelligence", tags=["Intelligence"])

@router.get("/analyze/{event_id}", response_model=AnalysisResponse)
async def analyze_webhook_delivery(event_id: str):
    # 1. Fetch data
    event = await get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    attempts = await get_delivery_attempts(event_id)
    
    endpoint_id = attempts[0]["endpoint_id"] if attempts else None
    endpoint = {}
    if endpoint_id:
        endpoint = await get_endpoint_config(endpoint_id) or {}
    
    # 2. Rule-Based Analysis (Nandhakishore's Engine)
    analysis_result = intelligence_engine.analyze(event, attempts, endpoint)
    
    # 3. ML Risk Scoring Integration (Suganidhi's Layer Placeholder)
    risk_score = ml_scorer.calculate_risk_score(event, attempts, endpoint)
    
    # 4. Construct Final Response
    return AnalysisResponse(
        event_id=event_id,
        delivery_state=analysis_result["delivery_state"],
        failure_reason=analysis_result["failure_reason"],
        safe_to_replay=analysis_result["safe_to_replay"],
        recommended_action=analysis_result["recommended_action"],
        risk_score=risk_score
    )
