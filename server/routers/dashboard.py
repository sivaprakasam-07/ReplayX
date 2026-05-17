from fastapi import APIRouter
from typing import List
from models.schemas import DashboardMetrics, RetryAnalyticsResponse, EndpointHealth, ReplayRecommendation
from database import get_db

router = APIRouter(prefix="/api/v1", tags=["Dashboard & Analytics"])

@router.get("/dashboard/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics():
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
    
    return DashboardMetrics(
        total_events=total_events,
        failed_deliveries=failed_deliveries,
        retry_success_rate=round(retry_success_rate, 1),
        safe_replays=safe_replays,
        critical_endpoints=critical_endpoints,
        avg_latency_ms=round(avg_latency, 1)
    )

@router.get("/retries/analytics", response_model=RetryAnalyticsResponse)
async def get_retry_analytics():
    db = get_db()
    
    # Dynamic MongoDB Aggregation for Timeline
    # We group delivery attempts by the hour (extracting from 'attempted_at' e.g. "2023-10-24T08:15:00Z")
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
    
    return RetryAnalyticsResponse(
        timeline=timeline,
        summary={
            "total_retries": total_retries,
            "recovery_rate": round(recovery_rate, 1),
            "failed_retries": total_retries - successful_retries
        }
    )

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

@router.get("/replay/recommendations", response_model=List[ReplayRecommendation])
async def get_replay_recommendations():
    db = get_db()
    
    cursor = db.delivery_attempts.find({"response_body_category": "invalid_signature"}).limit(10)
    attempts = await cursor.to_list(length=10)
    
    recommendations = []
    for att in attempts:
        recommendations.append(ReplayRecommendation(
            event_id=att["event_id"],
            safe_to_replay=False,
            risk_level="high",
            reason="invalid_signature",
            recommended_action="verify_customer_secret"
        ))
        
    return recommendations
