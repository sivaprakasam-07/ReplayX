import uuid
import asyncio
import random
import math
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List

from database import get_db
from services.ml_integration import ml_scorer
from services.retry_intelligence import intelligence_engine
from services.websocket_manager import manager

SIMULATE_DELIVERY = True

MAX_RETRY_ATTEMPTS = 5

BACKOFF_TABLE = {
    "aggressive": [1, 2, 4, 8, 16],
    "moderate":   [5, 10, 20, 40, 80],
    "conservative": [30, 60, 120, 240, 480],
}

DELIVERY_STATES = {
    "delivered": "delivered",
    "retrying": "retrying",
    "failed": "failed",
    "expired": "expired",
    "duplicate": "duplicate",
    "recovered": "recovered",
    "unsafe_to_replay": "unsafe_to_replay",
}

FAILURE_REASONS = [
    "customer_endpoint_down",
    "invalid_signature",
    "endpoint_deleted",
    "rate_limited",
    "payload_too_large",
    "timeout",
    "duplicate_event",
    "replay_without_fix",
    "malformed_response",
]


async def get_event(event_id: str) -> Optional[Dict[str, Any]]:
    db = get_db()
    doc = await db.events.find_one({"event_id": event_id})
    return doc


async def record_state_transition(event_id: str, from_state: Optional[str], to_state: str, reason: str = ""):
    db = get_db()
    transition = {
        "transition_id": f"TR_{uuid.uuid4().hex[:12].upper()}",
        "event_id": event_id,
        "from_state": from_state or "unknown",
        "to_state": to_state,
        "reason": reason,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    await db.state_transitions.insert_one(transition.copy())
    await manager.broadcast({
        "type": "STATE_TRANSITION",
        "data": transition,
    })


async def update_event_state(event_id: str, delivery_state: str, reason: str = ""):
    db = get_db()
    event = await db.events.find_one({"event_id": event_id})
    old_state = event.get("delivery_state") if event else None
    await db.events.update_one(
        {"event_id": event_id},
        {"$set": {"delivery_state": delivery_state}}
    )
    await record_state_transition(event_id, old_state, delivery_state, reason)


async def check_idempotency(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    idempotency_key = event.get("idempotency_key")
    if not idempotency_key:
        return None
    db = get_db()
    existing = await db.delivery_attempts.find_one({
        "idempotency_key": idempotency_key,
        "http_status": {"$lt": 400},
    })
    return existing


async def record_attempt(
    event_id: str,
    endpoint_id: str,
    attempt_number: int,
    http_status: int,
    response_body_category: str,
    response_time_ms: int,
    timeout: bool = False,
    signature_valid: bool = True,
    idempotency_key: str = "",
) -> Dict[str, Any]:
    db = get_db()
    attempt = {
        "attempt_id": f"ATT_{uuid.uuid4().hex[:12].upper()}",
        "event_id": event_id,
        "endpoint_id": endpoint_id,
        "attempt_number": attempt_number,
        "attempted_at": datetime.utcnow().isoformat() + "Z",
        "http_status": http_status,
        "response_time_ms": response_time_ms,
        "response_body_category": response_body_category,
        "timeout": timeout,
        "signature_valid": signature_valid,
        "retry_scheduled": False,
        "idempotency_key": idempotency_key,
    }
    await db.delivery_attempts.insert_one(attempt.copy())
    return attempt


async def get_endpoint(endpoint_id: str) -> Dict[str, Any]:
    db = get_db()
    doc = await db.endpoints.find_one({"endpoint_id": endpoint_id})
    if not doc:
        doc = {
            "endpoint_id": endpoint_id,
            "customer_id": "unknown",
            "endpoint_url_type": "unknown",
            "expected_signature_version": "v1",
            "avg_success_rate": 0.85,
            "rate_limit_per_minute": 60,
            "active": True,
            "last_config_change_at": datetime.utcnow().isoformat() + "Z",
        }
    return doc


async def simulate_delivery(endpoint: Dict[str, Any]) -> Dict[str, Any]:
    success_rate = endpoint.get("avg_success_rate", 0.85)
    roll = random.random()

    latency = int(random.gauss(120, 40))
    latency = max(10, min(2000, latency))

    if roll < success_rate:
        return {
            "http_status": 200,
            "response_body_category": "success",
            "response_time_ms": latency,
            "timeout": False,
        }

    failure_roll = random.random()
    if failure_roll < 0.25:
        return {
            "http_status": 500,
            "response_body_category": "server_error",
            "response_time_ms": latency,
            "timeout": False,
        }
    elif failure_roll < 0.50:
        return {
            "http_status": 504,
            "response_body_category": "timeout",
            "response_time_ms": 2000,
            "timeout": True,
        }
    elif failure_roll < 0.70:
        return {
            "http_status": 429,
            "response_body_category": "rate_limited",
            "response_time_ms": latency,
            "timeout": False,
        }
    elif failure_roll < 0.85:
        return {
            "http_status": 401,
            "response_body_category": "invalid_signature",
            "response_time_ms": latency,
            "timeout": False,
        }
    else:
        return {
            "http_status": 413,
            "response_body_category": "payload_too_large",
            "response_time_ms": latency,
            "timeout": False,
        }


def pick_backoff_strategy(ml_prediction: Dict[str, Any]) -> str:
    prob = ml_prediction.get("ml_predictions", {}).get("retry_success_probability", 50)
    if prob >= 70:
        return "aggressive"
    elif prob >= 40:
        return "moderate"
    return "conservative"


def compute_backoff(strategy: str, attempt_number: int) -> int:
    table = BACKOFF_TABLE.get(strategy, BACKOFF_TABLE["moderate"])
    idx = min(attempt_number - 1, len(table) - 1)
    return table[idx]


async def create_operation(
    event_id: str,
    endpoint_id: str,
    operation_type: str,
    attempt_number: int = 1,
    backoff_strategy: str = "moderate",
    scheduled_at: Optional[datetime] = None,
) -> Dict[str, Any]:
    db = get_db()
    if scheduled_at is None:
        scheduled_at = datetime.utcnow()

    operation = {
        "operation_id": f"OP_{uuid.uuid4().hex[:12].upper()}",
        "event_id": event_id,
        "endpoint_id": endpoint_id,
        "operation_type": operation_type,
        "status": "pending",
        "attempt_number": attempt_number,
        "max_attempts": MAX_RETRY_ATTEMPTS,
        "backoff_strategy": backoff_strategy,
        "scheduled_at": scheduled_at.isoformat() + "Z",
        "next_retry_at": None,
        "result": None,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "updated_at": datetime.utcnow().isoformat() + "Z",
    }
    await db.operations.insert_one(operation.copy())
    return operation


def categorize_result(http_status: int, response_body_category: str) -> str:
    if http_status < 400:
        return "success"
    if http_status == 429:
        return "rate_limited"
    if http_status == 401:
        return "invalid_signature"
    if http_status == 413:
        return "payload_too_large"
    if response_body_category == "timeout" or http_status == 504:
        return "timeout"
    return "server_error"


async def broadcast_op_update(op_data: Dict[str, Any]):
    await manager.broadcast({
        "type": "OPERATION_UPDATE",
        "data": {
            "operation_id": op_data["operation_id"],
            "event_id": op_data["event_id"],
            "operation_type": op_data.get("operation_type"),
            "status": op_data.get("status"),
            "attempt_number": op_data.get("attempt_number"),
            "result": op_data.get("result"),
        },
    })


async def process_operation(operation: Dict[str, Any]) -> Dict[str, Any]:
    db = get_db()
    op_id = operation["operation_id"]
    event_id = operation["event_id"]
    op_type = operation["operation_type"]
    attempt_number = operation.get("attempt_number", 1)

    await db.operations.update_one(
        {"operation_id": op_id},
        {"$set": {"status": "in_progress", "updated_at": datetime.utcnow().isoformat() + "Z"}}
    )
    operation["status"] = "in_progress"
    await broadcast_op_update(operation)

    event = await get_event(event_id)
    if not event:
        await db.operations.update_one(
            {"operation_id": op_id},
            {"$set": {"status": "failed", "result": {"error": "event_not_found"}}}
        )
        operation["status"] = "failed"
        await broadcast_op_update(operation)
        return {"status": "failed", "error": "event_not_found"}

    dup = await check_idempotency(event)
    if dup:
        await db.operations.update_one(
            {"operation_id": op_id},
            {"$set": {
                "status": "completed",
                "result": {
                    "status": "duplicate",
                    "message": "Event already delivered (idempotency_key matched)",
                    "existing_attempt_id": dup["attempt_id"],
                },
                "updated_at": datetime.utcnow().isoformat() + "Z",
            }}
        )
        operation["status"] = "completed"
        await broadcast_op_update(operation)
        await update_event_state(event_id, "duplicate", "idempotency_key_match")
        return {"status": "completed", "delivery_state": "duplicate"}

    attempts_list = await get_attempts(event_id)
    endpoint_id = operation.get("endpoint_id") or (
        attempts_list[0]["endpoint_id"] if attempts_list else "EP_000"
    )
    endpoint = await get_endpoint(endpoint_id)

    if not endpoint.get("active", True):
        await db.operations.update_one(
            {"operation_id": op_id},
            {"$set": {"status": "failed", "result": {"error": "endpoint_inactive"}}}
        )
        operation["status"] = "failed"
        await broadcast_op_update(operation)
        await update_event_state(event_id, "unsafe_to_replay", "endpoint_inactive")
        return {"status": "failed", "error": "endpoint_inactive"}

    ml_result = ml_scorer.get_full_prediction(event, attempts_list, endpoint)
    analysis = intelligence_engine.analyze(event, attempts_list, endpoint)

    if SIMULATE_DELIVERY:
        delivery_result = await simulate_delivery(endpoint)
    else:
        delivery_result = await real_http_delivery(event, endpoint)

    http_status = delivery_result["http_status"]
    category = delivery_result["response_body_category"]
    response_time = delivery_result["response_time_ms"]
    is_timeout = delivery_result.get("timeout", False)

    attempt = await record_attempt(
        event_id=event_id,
        endpoint_id=endpoint_id,
        attempt_number=attempt_number,
        http_status=http_status,
        response_body_category=category,
        response_time_ms=response_time,
        timeout=is_timeout,
        idempotency_key=event.get("idempotency_key", ""),
    )

    result_category = categorize_result(http_status, category)
    is_success = http_status < 400

    if is_success:
        if op_type == "retry":
            if len(attempts_list) > 0:
                new_state = "recovered"
            else:
                new_state = "delivered"
        else:
            new_state = "recovered"

        await update_event_state(event_id, new_state, "delivery_success")

        await db.operations.update_one(
            {"operation_id": op_id},
            {"$set": {
                "status": "completed",
                "result": {
                    "status": "success",
                    "http_status": http_status,
                    "delivery_state": new_state,
                    "attempt_id": attempt["attempt_id"],
                },
                "updated_at": datetime.utcnow().isoformat() + "Z",
            }}
        )
        operation["status"] = "completed"
        await broadcast_op_update(operation)

        return {"status": "completed", "delivery_state": new_state}

    if op_type == "retry" and attempt_number < MAX_RETRY_ATTEMPTS:
        strategy = pick_backoff_strategy(ml_result)
        backoff_seconds = compute_backoff(strategy, attempt_number + 1)
        next_time = datetime.utcnow() + timedelta(seconds=backoff_seconds)

        await update_event_state(event_id, "retrying", f"attempt_{attempt_number}_failed")

        next_op = await create_operation(
            event_id=event_id,
            endpoint_id=endpoint_id,
            operation_type="retry",
            attempt_number=attempt_number + 1,
            backoff_strategy=strategy,
            scheduled_at=next_time,
        )

        await db.operations.update_one(
            {"operation_id": op_id},
            {"$set": {
                "status": "retry_scheduled",
                "next_retry_at": next_time.isoformat() + "Z",
                "result": {
                    "status": "retry_scheduled",
                    "http_status": http_status,
                    "category": category,
                    "next_operation_id": next_op["operation_id"],
                    "backoff_seconds": backoff_seconds,
                },
                "updated_at": datetime.utcnow().isoformat() + "Z",
            }}
        )
        operation["status"] = "retry_scheduled"
        await broadcast_op_update(operation)

        return {"status": "retry_scheduled", "next_backoff": backoff_seconds}

    if op_type == "replay":
        ml_risk = ml_result.get("ml_predictions", {}).get("risk_level", "high")
        if ml_risk in ("high", "critical"):
            state = "unsafe_to_replay"
        else:
            state = "failed"
    else:
        state = "failed"

    await update_event_state(event_id, state, f"max_{op_type}_attempts")

    cancel_pending = db.operations.find({
        "event_id": event_id,
        "status": "pending",
        "operation_id": {"$ne": op_id},
    })
    async for pending_op in cancel_pending:
        await db.operations.update_one(
            {"operation_id": pending_op["operation_id"]},
            {"$set": {"status": "cancelled"}}
        )
        pending_op["status"] = "cancelled"
        await broadcast_op_update(pending_op)

    await db.operations.update_one(
        {"operation_id": op_id},
        {"$set": {
            "status": "failed",
            "result": {
                "status": "failed",
                "http_status": http_status,
                "category": category,
                "delivery_state": state,
                "reason": f"max_{op_type}_attempts_reached",
            },
            "updated_at": datetime.utcnow().isoformat() + "Z",
        }}
    )
    operation["status"] = "failed"
    await broadcast_op_update(operation)

    return {"status": "failed", "delivery_state": state}


async def get_attempts(event_id: str) -> List[Dict[str, Any]]:
    db = get_db()
    cursor = db.delivery_attempts.find({"event_id": event_id}).sort("attempt_number", 1)
    return await cursor.to_list(length=100)


async def real_http_delivery(event: Dict[str, Any], endpoint: Dict[str, Any]) -> Dict[str, Any]:
    import httpx
    callback_url = endpoint.get("callback_url") or f"https://api.example.com/webhooks/{endpoint.get('endpoint_url_type', 'unknown')}"
    payload = {
        "event_id": event.get("event_id"),
        "event_type": event.get("event_type"),
        "customer_id": event.get("customer_id"),
        "idempotency_key": event.get("idempotency_key"),
        "created_at": event.get("created_at"),
        "payload_size_kb": event.get("payload_size_kb"),
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(callback_url, json=payload)
            response_time = int(resp.elapsed.total_seconds() * 1000)
            return {
                "http_status": resp.status_code,
                "response_body_category": "success" if resp.status_code < 400 else categorize_result(resp.status_code, "server_error"),
                "response_time_ms": response_time,
                "timeout": False,
            }
    except httpx.TimeoutException:
        return {"http_status": 504, "response_body_category": "timeout", "response_time_ms": 10000, "timeout": True}
    except Exception:
        return {"http_status": 500, "response_body_category": "server_error", "response_time_ms": 5000, "timeout": False}


async def trigger_retry(event_id: str) -> Dict[str, Any]:
    event = await get_event(event_id)
    if not event:
        return {"status": "error", "message": f"Event {event_id} not found"}

    attempts = await get_attempts(event_id)
    endpoint_id = attempts[0]["endpoint_id"] if attempts else "EP_000"
    endpoint = await get_endpoint(endpoint_id)

    ml_result = ml_scorer.get_full_prediction(event, attempts, endpoint)
    strategy = pick_backoff_strategy(ml_result)
    backoff_seconds = compute_backoff(strategy, 1)

    next_time = datetime.utcnow() + timedelta(seconds=backoff_seconds)
    operation = await create_operation(
        event_id=event_id,
        endpoint_id=endpoint_id,
        operation_type="retry",
        attempt_number=1,
        backoff_strategy=strategy,
        scheduled_at=next_time,
    )

    await update_event_state(event_id, "retrying")
    await broadcast_op_update(operation)

    return {
        "status": "scheduled",
        "operation_id": operation["operation_id"],
        "event_id": event_id,
        "operation_type": "retry",
        "scheduled_at": operation["scheduled_at"],
        "backoff_seconds": backoff_seconds,
    }


async def trigger_replay(event_id: str) -> Dict[str, Any]:
    event = await get_event(event_id)
    if not event:
        return {"status": "error", "message": f"Event {event_id} not found"}

    attempts = await get_attempts(event_id)
    endpoint_id = attempts[0]["endpoint_id"] if attempts else "EP_000"
    endpoint = await get_endpoint(endpoint_id)

    analysis = intelligence_engine.analyze(event, attempts, endpoint)
    ml_result = ml_scorer.get_full_prediction(event, attempts, endpoint)
    risk_level = ml_result.get("ml_predictions", {}).get("risk_level", "high")

    if not analysis["safe_to_replay"] or risk_level in ("high", "critical"):
        return {
            "status": "blocked",
            "message": "Event is not safe to replay based on ML+rule analysis",
            "risk_level": risk_level,
            "safe_to_replay": analysis["safe_to_replay"],
        }

    operation = await create_operation(
        event_id=event_id,
        endpoint_id=endpoint_id,
        operation_type="replay",
        attempt_number=1,
        backoff_strategy="moderate",
    )

    await broadcast_op_update(operation)

    return {
        "status": "scheduled",
        "operation_id": operation["operation_id"],
        "event_id": event_id,
        "operation_type": "replay",
        "scheduled_at": operation["scheduled_at"],
    }


async def schedule_auto_operations(event_id: str) -> Dict[str, Any]:
    event = await get_event(event_id)
    if not event:
        return {"status": "error", "message": f"Event {event_id} not found"}

    attempts = await get_attempts(event_id)
    if not attempts:
        return {"status": "skipped", "reason": "no_delivery_attempts"}

    endpoint_id = attempts[0].get("endpoint_id", "EP_000")
    endpoint = await get_endpoint(endpoint_id)

    analysis = intelligence_engine.analyze(event, attempts, endpoint)
    ml_result = ml_scorer.get_full_prediction(event, attempts, endpoint)
    ml_preds = ml_result.get("ml_predictions", {})
    risk_level = ml_preds.get("risk_level", "medium")
    forecast = ml_preds.get("forecast", "degraded")

    scheduled = []

    delivery_state = analysis["delivery_state"]
    if delivery_state in ("retrying", "warning", "recovered"):
        return {"status": "skipped", "reason": f"state_is_{delivery_state}"}

    if delivery_state in ("failed", "critical", "blocked"):
        if analysis["safe_to_replay"] and risk_level in ("low", "medium"):
            replay_op = await trigger_replay(event_id)
            scheduled.append(replay_op)

        if forecast in ("degraded", "unstable") and risk_level != "high":
            retry_op = await trigger_retry(event_id)
            scheduled.append(retry_op)
        elif risk_level == "high":
            return {"status": "skipped", "reason": "high_risk_requires_manual_trigger"}

    return {"status": "scheduled", "operations": scheduled}
