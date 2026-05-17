from datetime import datetime
from fastapi import APIRouter, HTTPException
from typing import List, Any
from pydantic import BaseModel

from services.execution_engine import (
    trigger_retry,
    trigger_replay,
    process_operation,
    schedule_auto_operations,
    get_event,
    get_attempts,
)
from database import get_db

router = APIRouter(prefix="/api/v1", tags=["Operations"])


class TriggerRequest(BaseModel):
    event_id: str


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
    next_retry_at: str = ""
    result: Any = None
    created_at: str
    updated_at: str


@router.post("/retries/trigger/{event_id}", response_model=TriggerResponse)
async def api_trigger_retry(event_id: str):
    result = await trigger_retry(event_id)
    if result.get("status") == "error":
        raise HTTPException(status_code=404, detail=result["message"])
    return TriggerResponse(
        status=result["status"],
        operation_id=result["operation_id"],
        event_id=result["event_id"],
        operation_type=result["operation_type"],
        scheduled_at=result["scheduled_at"],
    )


@router.post("/replay/execute/{event_id}")
async def api_trigger_replay(event_id: str):
    result = await trigger_replay(event_id)
    if result.get("status") == "error":
        raise HTTPException(status_code=404, detail=result["message"])
    if result.get("status") == "blocked":
        raise HTTPException(status_code=400, detail=result["message"])
    return TriggerResponse(
        status=result["status"],
        operation_id=result["operation_id"],
        event_id=result["event_id"],
        operation_type="replay",
        scheduled_at=result["scheduled_at"],
    )


@router.post("/operations/schedule/{event_id}")
async def api_schedule_auto(event_id: str):
    result = await schedule_auto_operations(event_id)
    if result.get("status") == "error":
        raise HTTPException(status_code=404, detail=result["message"])
    return result


@router.get("/operations/queue", response_model=List[OperationStatus])
async def list_operations_queue(status: str = "pending"):
    db = get_db()
    query = {"status": status} if status != "all" else {}
    cursor = db.operations.find(query).sort("scheduled_at", 1).limit(50)
    ops = await cursor.to_list(length=50)
    result = []
    for op in ops:
        result.append(OperationStatus(
            operation_id=op["operation_id"],
            event_id=op["event_id"],
            operation_type=op["operation_type"],
            status=op["status"],
            attempt_number=op.get("attempt_number", 1),
            scheduled_at=op["scheduled_at"],
            next_retry_at=op.get("next_retry_at") or "",
            result=op.get("result"),
            created_at=op["created_at"],
            updated_at=op["updated_at"],
        ))
    return result


@router.post("/operations/process/{operation_id}")
async def api_process_operation(operation_id: str):
    db = get_db()
    op = await db.operations.find_one({"operation_id": operation_id})
    if not op:
        raise HTTPException(status_code=404, detail="Operation not found")
    result = await process_operation(op)
    return result


@router.post("/operations/process-pending")
async def api_process_all_pending():
    db = get_db()
    now = datetime.utcnow().isoformat() + "Z"
    cursor = db.operations.find({
        "status": "pending",
        "scheduled_at": {"$lte": now},
    }).sort("scheduled_at", 1).limit(20)
    ops = await cursor.to_list(length=20)
    results = []
    for op in ops:
        r = await process_operation(op)
        results.append({
            "operation_id": op["operation_id"],
            "event_id": op["event_id"],
            "type": op["operation_type"],
            "result": r,
        })
    return {"processed": len(results), "results": results}


@router.get("/operations/history/{event_id}")
async def get_operation_history(event_id: str):
    db = get_db()
    ops_cursor = db.operations.find({"event_id": event_id}).sort("created_at", 1)
    ops = await ops_cursor.to_list(length=100)
    transitions_cursor = db.state_transitions.find({"event_id": event_id}).sort("timestamp", 1)
    transitions = await transitions_cursor.to_list(length=500)
    for t in transitions:
        t.pop("_id", None)
    event = await db.events.find_one({"event_id": event_id})
    history = []
    for op in ops:
        history.append({
            "operation_id": op["operation_id"],
            "operation_type": op["operation_type"],
            "status": op["status"],
            "attempt_number": op.get("attempt_number", 1),
            "scheduled_at": op["scheduled_at"],
            "created_at": op["created_at"],
            "updated_at": op["updated_at"],
            "result": op.get("result"),
        })
    return {
        "event_id": event_id,
        "current_delivery_state": event.get("delivery_state") if event else None,
        "operations": history,
        "state_transitions": transitions,
    }
