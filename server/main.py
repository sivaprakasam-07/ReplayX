import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import events, intelligence, dashboard, simulator, websockets, operations
from scheduler import worker_loop

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    worker_task = asyncio.create_task(worker_loop())
    yield
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Webhook Delivery Reliability Intelligence API",
    description="Backend for analyzing webhook delivery histories and replay safety.",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS configuration for Frontend Lead (Sivaprakasam T)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to actual frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(events.router)
app.include_router(intelligence.router)
app.include_router(dashboard.router)
app.include_router(simulator.router)
app.include_router(websockets.router)
app.include_router(operations.router)

@app.get("/")
async def root():
    return {"message": "Webhook Intelligence Engine v2 is running. Trigger endpoints available at /api/v1/retries/trigger/{id} and /api/v1/replay/execute/{id}. Visit /docs for API documentation."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
