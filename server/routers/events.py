from fastapi import APIRouter, HTTPException
from typing import List
from models.schemas import WebhookEvent
from services.webhook_service import get_all_events, get_event_by_id, get_delivery_attempts

router = APIRouter(prefix="/api/v1/events", tags=["Events"])

@router.get("", response_model=List[WebhookEvent])
async def list_events(limit: int = 50, skip: int = 0):
    events = await get_all_events(limit=limit, skip=skip)
    return events

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
