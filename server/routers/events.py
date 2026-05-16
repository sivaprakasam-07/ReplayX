from fastapi import APIRouter, HTTPException
from typing import List
from models.schemas import WebhookEvent, PaginatedEventsResponse, CombinedIntelligenceResponse, AnalysisResponse
from services.webhook_service import get_all_events, get_event_by_id, get_delivery_attempts, get_endpoint_config
from services.retry_intelligence import intelligence_engine
from services.ml_integration import ml_scorer

router = APIRouter(prefix="/api/v1/events", tags=["Events"])

@router.get("", response_model=PaginatedEventsResponse)
async def list_events(limit: int = 50, skip: int = 0):
    return await get_all_events(limit=limit, skip=skip)

@router.get("/{event_id}")
async def get_event_details(event_id: str):
    event = await get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    attempts = await get_delivery_attempts(event_id)
    
    return {
        "event": event,
        "delivery_history": attempts
    }

@router.get("/intelligence/{event_id}", response_model=CombinedIntelligenceResponse)
async def get_combined_intelligence(event_id: str):
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
    
    analysis = AnalysisResponse(
        event_id=event_id,
        delivery_state=analysis_result["delivery_state"],
        failure_reason=analysis_result["failure_reason"],
        safe_to_replay=analysis_result["safe_to_replay"],
        recommended_action=analysis_result["recommended_action"],
        risk_score=risk_score
    )
    
    return CombinedIntelligenceResponse(
        event=event,
        delivery_history=attempts,
        analysis=analysis
    )
