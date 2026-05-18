from fastapi import APIRouter
from typing import List, Any
from models.schemas import (
    DashboardMetrics, RetryAnalyticsResponse, EnrichedRetryAnalyticsResponse,
    EndpointHealth, ReplayRecommendation, EnrichedReplayRecommendation, FailurePattern
)
from database import get_db
from services.ml_integration import ml_scorer
from services.retry_intelligence import intelligence_engine
from services.cache import get_cache, set_cache, cache_key

router = APIRouter(prefix="/api/v1", tags=["Dashboard & Analytics"])

@router.get("/dashboard/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics():
    # Check cache first
    cache_id = cache_key("dashboard_metrics")
    cached = get_cache(cache_id)
    if cached is not None:
        return cached
    
    db = get_db()
    total_events = await db.events.count_documents({})
    failed_deliveries = await db.delivery_attempts.count_documents({"http_status": {"$gte": 400}})
    
    total_retries = await db.delivery_attempts.count_documents({"attempt_number": {"$gt": 1}})
    successful_retries = await db.delivery_attempts.count_documents({"attempt_number": {"$gt": 1}, "http_status": {"$lt": 400}})
    retry_success_rate = (successful_retries / total_retries * 100) if total_retries > 0 else 0.0
    
    safe_replays = await db.delivery_attempts.count_documents({"response_body_category": {"$in": ["timeout", "server_error", "rate_limited"]}})
    critical_endpoints = await db.endpoints.count_documents({"active": False})
    
    pipeline = [{"$group": {"_id": None, "avg_latency": {"$avg": "$response_time_ms"}}}]
    cursor = db.delivery_attempts.aggregate(pipeline)
    latency_result = await cursor.to_list(length=1)
    avg_latency = latency_result[0]["avg_latency"] if latency_result else 0.0
    
    result = DashboardMetrics(
        total_events=total_events,
        failed_deliveries=failed_deliveries,
        retry_success_rate=round(retry_success_rate, 1),
        safe_replays=safe_replays,
        critical_endpoints=critical_endpoints,
        avg_latency_ms=round(avg_latency, 1)
    )
    
    # Cache the result for 12 seconds
    set_cache(cache_id, result)
    return result

@router.get("/retries/analytics", response_model=EnrichedRetryAnalyticsResponse)
async def get_retry_analytics(limit: int = 10, skip: int = 0):
    # Check cache first
    cache_id = cache_key("retries_analytics", limit=limit, skip=skip)
    cached = get_cache(cache_id)
    if cached is not None:
        return cached
    
    db = get_db()
    
    pipeline = [
        {"$match": {"attempt_number": {"$gt": 1}}},
        {"$group": {
            "_id": {"$substr": ["$attempted_at", 11, 2]},
            "retries": {"$sum": 1},
            "recovered": {
                "$sum": {"$cond": [{"$lt": ["$http_status", 400]}, 1, 0]}
            }
        }},
        {"$sort": {"_id": 1}}
    ]
    cursor = db.delivery_attempts.aggregate(pipeline)
    results = await cursor.to_list(length=24)
    
    timeline = []
    for r in results:
        if not r["_id"]:
            continue
        timeline.append({
            "time": f"{r['_id']}:00",
            "retries": r["retries"],
            "recovered": r["recovered"]
        })
        
    if not timeline:
        timeline = [{"time": "00:00", "retries": 0, "recovered": 0}]
    
    total_retries = await db.delivery_attempts.count_documents({"attempt_number": {"$gt": 1}})
    successful_retries = await db.delivery_attempts.count_documents({"attempt_number": {"$gt": 1}, "http_status": {"$lt": 400}})
    recovery_rate = (successful_retries / total_retries * 100) if total_retries > 0 else 0.0
    
    ml_predictions = {
        "predicted_retry_volume": int(total_retries * 1.12),
        "predicted_spike_time": "14:00",
        "predicted_retries": [min(t["retries"] * 2, 100) for t in timeline],
        "predicted_recoveries": [min(t["recovered"] * 2, 100) for t in timeline],
        "risk_level": "medium",
        "forecast": "degraded",
    }
    
    failure_patterns = [
        FailurePattern(pattern="timeout_spike", severity="high"),
        FailurePattern(pattern="rate_limit_burst", severity="medium"),
    ]
    
    recent_cursor = db.delivery_attempts.find(
        {"attempt_number": {"$gt": 1}}
    ).sort("attempted_at", -1).skip(skip).limit(limit)
    raw_events = await recent_cursor.to_list(length=limit)
    retry_events = []
    for att in raw_events:
        ev = await db.events.find_one({"event_id": att["event_id"]})
        endpoint_id = att.get("endpoint_id", "")
        ep = await db.endpoints.find_one({"endpoint_id": endpoint_id}) if endpoint_id else None
        endpoint_name = ep.get("endpoint_url_type", "unknown") if ep else "unknown"
        attempts_for_event = await db.delivery_attempts.find(
            {"event_id": att["event_id"]}
        ).sort("attempt_number", -1).to_list(length=10)
        
        event_obj = ev or {}
        ml_result = ml_scorer.get_full_prediction(event_obj, attempts_for_event, ep or {})
        ml_preds = ml_result.get("ml_predictions", {})
        patterns = ml_result.get("failure_patterns", [])
        risk_score = ml_scorer.calculate_risk_score(event_obj, attempts_for_event, ep or {})
        status_code = att.get("http_status", 500)
        if status_code < 400:
            state = "recovered"
        elif att.get("response_body_category") == "rate_limited":
            state = "retrying"
        else:
            state = "failed"
        
        retry_events.append({
            "id": att["attempt_id"],
            "endpoint": endpoint_name,
            "status": state,
            "attempts": att.get("attempt_number", 1),
            "delay": f"{att.get('response_time_ms', 0)}ms",
            "risk_score": risk_score,
            "failure_pattern": patterns[0]["pattern"] if patterns else "normal",
        })
    
    result = {
        "timeline": timeline,
        "summary": {
            "total_retries": total_retries,
            "recovery_rate": round(recovery_rate, 1),
            "failed_retries": total_retries - successful_retries,
        },
        "ml_predictions": ml_predictions,
        "failure_patterns": [p.dict() for p in failure_patterns],
        "retry_events": retry_events,
        "total_retry_events": total_retries,
    }
    # Cache the result for 12 seconds
    set_cache(cache_id, result)
    return result

@router.get("/endpoints/health", response_model=List[EndpointHealth])
async def get_endpoints_health():
    db = get_db()
    endpoints = await db.endpoints.find({}).limit(20).to_list(length=20)
    
    health_data = []
    for ep in endpoints:
        health_status = "critical"
        if ep["active"]:
            health_status = "warning" if ep.get("avg_success_rate", 0) < 0.85 else "healthy"
            
        health_data.append(EndpointHealth(
            endpoint=ep["endpoint_url_type"],
            health=health_status,
            uptime=ep["avg_success_rate"] * 100,
            risk_score=0.15 if ep["active"] else 0.85,
            avg_latency=120.5
        ))
    return health_data

@router.get("/replay/recommendations", response_model=List[EnrichedReplayRecommendation])
async def get_replay_recommendations(limit: int = 10, skip: int = 0):
    # Check cache first
    cache_id = cache_key("replay_recommendations", limit=limit, skip=skip)
    cached = get_cache(cache_id)
    if cached is not None:
        return cached
    
    db = get_db()
    
    pipeline = [
        {"$match": {"http_status": {"$gte": 400}}},
        {"$group": {"_id": "$event_id", "attempt_number": {"$max": "$attempt_number"}}},
        {"$sort": {"_id": 1}},
        {"$skip": skip},
        {"$limit": limit},
    ]
    cursor = db.delivery_attempts.aggregate(pipeline)
    groups = await cursor.to_list(length=limit)
    
    if not groups:
        set_cache(cache_id, [])
        return []
    
    # Batch fetch all events and endpoints at once (avoid N+1 queries)
    event_ids = [g["_id"] for g in groups]
    events_cursor = db.events.find({"event_id": {"$in": event_ids}})
    events_list = await events_cursor.to_list(length=len(event_ids))
    events_map = {e["event_id"]: e for e in events_list}
    
    # Batch fetch all attempts for these events
    attempts_cursor = db.delivery_attempts.find({"event_id": {"$in": event_ids}}).sort("attempt_number", 1)
    all_attempts = await attempts_cursor.to_list(length=len(event_ids) * 10)
    attempts_by_event = {}
    for att in all_attempts:
        event_id = att["event_id"]
        if event_id not in attempts_by_event:
            attempts_by_event[event_id] = []
        attempts_by_event[event_id].append(att)
    
    # Batch fetch all endpoints
    endpoint_ids = set()
    for attempts_list in attempts_by_event.values():
        if attempts_list:
            endpoint_ids.add(attempts_list[0].get("endpoint_id", ""))
    endpoint_ids.discard("")
    
    endpoints_cursor = db.endpoints.find({"endpoint_id": {"$in": list(endpoint_ids)}})
    endpoints_list = await endpoints_cursor.to_list(length=len(endpoint_ids))
    endpoints_map = {e["endpoint_id"]: e for e in endpoints_list}
    
    # Now process with pre-fetched data (no more queries in loop)
    recommendations = []
    for g in groups:
        event_id = g["_id"]
        attempts_list = attempts_by_event.get(event_id, [])
        if not attempts_list:
            continue
        
        event_obj = events_map.get(event_id, {})
        endpoint_id = attempts_list[0].get("endpoint_id", "")
        ep = endpoints_map.get(endpoint_id, {})
        
        intelligence_result = intelligence_engine.analyze(event_obj, attempts_list, ep or {})
        ml_result = ml_scorer.get_full_prediction(event_obj, attempts_list, ep or {})
        ml_preds = ml_result.get("ml_predictions", {})
        patterns = ml_result.get("failure_patterns", [])
        risk_score = ml_scorer.calculate_risk_score(event_obj, attempts_list, ep or {})
        ai_conf = ml_preds.get("ai_confidence", 50)
        risk_lvl = ml_preds.get("risk_level", "high")
        
        recommendations.append(EnrichedReplayRecommendation(
            event_id=event_id,
            safe_to_replay=intelligence_result.get("safe_to_replay", False),
            risk_level=risk_lvl,
            reason=intelligence_result.get("failure_reason", "unknown"),
            recommended_action=intelligence_result.get("recommended_action", "review"),
            risk_score=risk_score,
            ml_confidence=ai_conf,
            failure_patterns=[FailurePattern(**p) for p in patterns],
        ))
    
    # Cache the result for 12 seconds
    set_cache(cache_id, recommendations)
    return recommendations
