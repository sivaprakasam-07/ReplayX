from database import get_db
from models.schemas import WebhookEvent, DeliveryAttempt, EndpointConfig
from typing import List, Optional

async def get_event_by_id(event_id: str) -> Optional[dict]:
    db = get_db()
    event = await db.events.find_one({"event_id": event_id})
    if event:
        event["_id"] = str(event["_id"])
    return event

async def get_delivery_attempts(event_id: str) -> List[dict]:
    db = get_db()
    cursor = db.delivery_attempts.find({"event_id": event_id}).sort("attempt_number", 1)
    attempts = await cursor.to_list(length=100)
    for attempt in attempts:
        attempt["_id"] = str(attempt["_id"])
    return attempts

async def get_endpoint_config(endpoint_id: str) -> Optional[dict]:
    db = get_db()
    endpoint = await db.endpoints.find_one({"endpoint_id": endpoint_id})
    if endpoint:
        endpoint["_id"] = str(endpoint["_id"])
    return endpoint

async def get_all_events(limit: int = 50, skip: int = 0) -> dict:
    db = get_db()
    total = await db.events.count_documents({})
    cursor = db.events.find({}).skip(skip).limit(limit)
    events = await cursor.to_list(length=limit)
    for event in events:
        event["_id"] = str(event["_id"])
    return {
        "total": total,
        "limit": limit,
        "skip": skip,
        "events": events
    }
