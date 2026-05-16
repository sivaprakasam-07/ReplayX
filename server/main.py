from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import events, intelligence, dashboard, simulator, websockets

app = FastAPI(
    title="Webhook Delivery Reliability Intelligence API",
    description="Backend for analyzing webhook delivery histories and replay safety.",
    version="1.0.0"
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

@app.get("/")
async def root():
    return {"message": "Webhook Intelligence Engine is running. Visit /docs for API documentation."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
