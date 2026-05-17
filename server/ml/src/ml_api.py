# =============================================================
# src/ml_api.py
# =============================================================
# PURPOSE:
#   FastAPI router that the backend team plugs into their existing
#   FastAPI app. Exposes one endpoint:
#
#   GET /api/v1/retries/analytics
#     → Accepts query params OR request body with event features
#     → Runs all 3 models
#     → Returns the exact prediction payload the frontend expects
#
# HOW BACKEND TEAM USES THIS:
#   In their main.py:
#     from ml_api import ml_router
#     app.include_router(ml_router)
#
# ARCHITECTURE:
#   Frontend → GET /api/v1/retries/analytics → ml_router
#                                            → ReplayXPredictor.predict()
#                                            → JSON response
#
# PERFORMANCE:
#   Models loaded once at startup (not per-request).
#   Each prediction call takes < 5ms.
#   Safe for concurrent requests (models are read-only after training).
# =============================================================

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional
import time
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from src.predictor import ReplayXPredictor

# Load predictor once at module import time
# This is intentional — loading 3 model files every request would be slow
_predictor = ReplayXPredictor()

ml_router = APIRouter(prefix="/api/v1", tags=["ML Intelligence"])


# =============================================================
# INPUT SCHEMA
# =============================================================
# These are the features the backend extracts from MongoDB
# and passes to the ML engine.
# All fields are optional with sensible defaults so the endpoint
# never crashes if some data is missing.
# =============================================================

class MLPredictionRequest(BaseModel):
    # Retry behaviour
    retry_attempts:        Optional[int]   = Field(default=1,    description="Total delivery attempts made")
    max_attempt_number:    Optional[int]   = Field(default=1,    description="Highest attempt number seen")
    timeout_count:         Optional[int]   = Field(default=0,    description="Number of timed-out attempts")
    timeout_frequency:     Optional[float] = Field(default=0.0,  description="Fraction of attempts that timed out")
    retry_scheduled_count: Optional[int]   = Field(default=0,    description="How many retries were scheduled")
    retry_scheduled_rate:  Optional[float] = Field(default=0.0,  description="Fraction of attempts with retry scheduled")

    # Latency
    avg_response_time_ms:  Optional[float] = Field(default=500,  description="Mean response time in ms")
    max_response_time_ms:  Optional[float] = Field(default=500,  description="Max response time in ms")
    min_response_time_ms:  Optional[float] = Field(default=500,  description="Min response time in ms")
    std_response_time_ms:  Optional[float] = Field(default=0,    description="Std dev of response time in ms")
    latency_volatility:    Optional[float] = Field(default=0.0,  description="Coefficient of variation of latency")

    # Delivery outcomes
    success_count:         Optional[int]   = Field(default=0,    description="Number of successful deliveries (HTTP 200)")
    error_4xx_count:       Optional[int]   = Field(default=0,    description="Number of 4xx errors")
    error_5xx_count:       Optional[int]   = Field(default=0,    description="Number of 5xx errors")
    error_rate_4xx:        Optional[float] = Field(default=0.0,  description="Fraction of 4xx errors")
    error_rate_5xx:        Optional[float] = Field(default=0.0,  description="Fraction of 5xx errors")
    success_rate_attempts: Optional[float] = Field(default=0.0,  description="Fraction of successful attempts")
    rate_limited_count:    Optional[int]   = Field(default=0,    description="Number of 429 rate-limit responses")
    payload_error_count:   Optional[int]   = Field(default=0,    description="Number of 413 payload-too-large errors")
    invalid_sig_count:     Optional[int]   = Field(default=0,    description="Number of failed signature validations")

    # Endpoint health
    avg_success_rate:      Optional[float] = Field(default=0.5,  description="Historical success rate of the endpoint (0–1)")
    rate_limit_per_minute: Optional[int]   = Field(default=60,   description="Endpoint rate limit per minute")
    endpoint_active:       Optional[int]   = Field(default=1,    description="Is endpoint currently active (1/0)")

    # Payload
    payload_size_kb:       Optional[float] = Field(default=10.0, description="Webhook payload size in KB")
    payload_large_flag:    Optional[int]   = Field(default=0,    description="1 if payload > 50KB")

    # Replay history
    replay_count:          Optional[int]   = Field(default=0,    description="How many times event was replayed")
    duplicate_detected:    Optional[int]   = Field(default=0,    description="1 if duplicate replay detected")
    manually_triggered:    Optional[int]   = Field(default=0,    description="1 if replay was manually triggered")
    replay_success_count:  Optional[int]   = Field(default=0,    description="Successful replay count")
    replay_failed_count:   Optional[int]   = Field(default=0,    description="Failed replay count")
    replay_duplicate_count:Optional[int]   = Field(default=0,    description="Duplicate-skipped replay count")

    # Event metadata
    priority_encoded:      Optional[int]   = Field(default=1,    description="0=low, 1=normal, 2=high")

    # One-hot features (backend sets these if available)
    dominant_http_status:  Optional[int]   = Field(default=200)
    rate_limit_pressure:   Optional[float] = Field(default=0.0)
    log_avg_response_time_ms: Optional[float] = Field(default=0.0)
    log_max_response_time_ms: Optional[float] = Field(default=0.0)
    log_payload_size_kb:   Optional[float] = Field(default=0.0)


# =============================================================
# ENDPOINT: GET /api/v1/retries/analytics
# =============================================================

@ml_router.post("/retries/analytics")
async def get_retry_analytics(request: MLPredictionRequest):
    """
    Run ML inference on a webhook event and return predictions.

    The backend team calls this with features extracted from MongoDB.
    The frontend visualizes the returned payload directly.

    Returns the exact payload format specified in requirements.
    """
    start_time = time.time()

    try:
        features = request.model_dump()
        result   = _predictor.predict(features)

        elapsed_ms = int((time.time() - start_time) * 1000)

        return JSONResponse(content={
            **result,
            "_meta": {
                "inference_time_ms": elapsed_ms,
                "model_version": "1.0.0",
            }
        })

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ML inference failed: {str(e)}"
        )


# =============================================================
# ENDPOINT: GET /api/v1/retries/analytics/health
# =============================================================

@ml_router.get("/retries/analytics/health")
async def ml_health():
    """
    Confirms ML models are loaded and ready.
    The backend health check should call this on startup.
    """
    return {
        "status": "ok",
        "models_loaded": {
            "success_predictor":   True,
            "risk_classifier":     True,
            "pattern_detector":    True,
            "isolation_forest":    True,
        },
        "feature_count": len(_predictor.feature_cols),
    }


# =============================================================
# Standalone server for development/testing
# Run: python src/ml_api.py
# =============================================================

if __name__ == "__main__":
    import uvicorn
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    app = FastAPI(title="ReplayX ML API", version="1.0.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(ml_router)

    print("Starting ReplayX ML API on http://localhost:8001")
    print("Swagger docs: http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001)