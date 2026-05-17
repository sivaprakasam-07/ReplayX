import uuid
import random
from datetime import datetime
from fastapi import APIRouter
from database import get_db
from services.websocket_manager import manager

router = APIRouter(prefix="/api/v1/simulate", tags=["Simulator"])

@router.post("/{status_type}")
async def simulate_event(status_type: str):
    db = get_db()
    
    event_id = f"EVT_SIM_{uuid.uuid4().hex[:8].upper()}"
    endpoint_id = f"EP_{random.randint(100, 999)}"
    
    event = {
        "event_id": event_id,
        "event_type": random.choice(["invoice.created", "invoice.rejected", "compliance.failed"]),
        "customer_id": f"CUST_{random.randint(1000, 9999)}",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "payload_size_kb": round(random.uniform(10.0, 50.0), 2),
        "idempotency_key": str(uuid.uuid4()),
        "priority": "high" if random.random() > 0.5 else "normal"
    }
    
    await db.events.insert_one(event.copy())
    
    attempts = []
    
    if status_type == "success":
        attempts.append(create_attempt(event_id, endpoint_id, 1, 200, "success"))
    elif status_type == "failure":
        attempts.append(create_attempt(event_id, endpoint_id, 1, 500, "server_error"))
        attempts.append(create_attempt(event_id, endpoint_id, 2, 500, "server_error"))
    elif status_type == "retry":
        attempts.append(create_attempt(event_id, endpoint_id, 1, 429, "rate_limited"))
        attempts.append(create_attempt(event_id, endpoint_id, 2, 200, "success"))
    elif status_type == "replay":
        attempts.append(create_attempt(event_id, endpoint_id, 1, 401, "invalid_signature"))
    else:
        attempts.append(create_attempt(event_id, endpoint_id, 1, 200, "success"))
        
    if attempts:
        await db.delivery_attempts.insert_many(attempts)
        
    # Broadcast the live event to all connected dashboard clients
    await manager.broadcast({
        "type": "NEW_SIMULATION",
        "data": {
            "event": event,
            "attempts": attempts
        }
    })
        
    return {
        "message": f"Successfully simulated {status_type} flow",
        "event_id": event_id,
        "attempts_generated": len(attempts)
    }

def create_attempt(event_id, endpoint_id, attempt_number, status, category):
    return {
        "attempt_id": f"ATT_SIM_{uuid.uuid4().hex[:8].upper()}",
        "event_id": event_id,
        "endpoint_id": endpoint_id,
        "attempt_number": attempt_number,
        "attempted_at": datetime.utcnow().isoformat() + "Z",
        "http_status": status,
        "response_time_ms": random.randint(50, 500),
        "response_body_category": category,
        "timeout": status == 504,
        "signature_valid": status != 401,
        "retry_scheduled": category in ["rate_limited", "server_error", "timeout"] and attempt_number < 3
    }
