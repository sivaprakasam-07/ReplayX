# ReplayX — Webhook Delivery Reliability Intelligence

## Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB 6+ (running on `localhost:27017`)

---

## Quick Start

### 1. Backend

```bash
cd server
pip install -r requirements.txt
```

Create `.env` in `server/`:
```
MONGO_URL="mongodb://localhost:27017"
DATABASE_NAME="webhook_intelligence"
```

Seed sample data (optional but recommended):
```bash
python seed_db.py
```

Start the server:
```bash
uvicorn main:app --reload --port 8000
```

Verify → [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Verify → [http://localhost:5173](http://localhost:5173)

---

## Simulating Events for Testing

With the server running, send test events:

```powershell
# Failed event (auto-triggers a retry operation)
curl -X POST http://localhost:8000/api/v1/simulate/failure

# Retry flow (429 -> 200)
curl -X POST http://localhost:8000/api/v1/simulate/retry

# Replay scenario (401 invalid_signature)
curl -X POST http://localhost:8000/api/v1/simulate/replay

# Trigger retry + auto-queue
curl -X POST http://localhost:8000/api/v1/simulate/trigger_retry

# Trigger replay + auto-queue
curl -X POST http://localhost:8000/api/v1/simulate/trigger_replay

# Success event
curl -X POST http://localhost:8000/api/v1/simulate/success
```

---

## Triggering Retries & Replays (New)

```powershell
# Trigger a retry on any event
curl -X POST http://localhost:8000/api/v1/retries/trigger/EVT_SIM_XXXXXX

# Execute a replay (blocked if unsafe)
curl -X POST http://localhost:8000/api/v1/replay/execute/EVT_SIM_XXXXXX

# View operation queue
curl http://localhost:8000/api/v1/operations/queue?status=all

# Process all due operations immediately
curl -X POST http://localhost:8000/api/v1/operations/process-pending
```

---

## Key Pages (Frontend)

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/` | Metrics overview |
| Monitoring | `/monitoring` | Event list with ML risk scores |
| Retry Analysis | `/retry-analysis` | Retry timeline, ML forecast, trigger buttons, queue view |
| Replay Center | `/replay-center` | Replay recommendations, ML confidence, execute buttons |
| Simulator | `/simulator` | Generate test events |
| API Docs | `/docs` (backend) | Swagger UI for all endpoints |

---

## Project Structure

```
ReplayX/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── pages/          # RetryAnalysis, ReplayCenter, Monitoring, etc.
│       ├── components/     # EventModal, StatusPill, tables, charts
│       └── services/api/   # retryApi, replayApi, monitoringApi
├── server/                  # FastAPI backend
│   ├── routers/            # events, intelligence, dashboard, operations, simulator
│   ├── services/           # ml_integration, execution_engine, retry_intelligence
│   ├── models/             # Pydantic schemas
│   ├── ml/                 # ML models & training
│   │   ├── src/            # predictor, train, feature_engineering
│   │   ├── models/         # Trained .joblib files
│   │   └── tests/          # ML test suite
│   └── scheduler.py        # Background worker (auto-starts with server)
└── README.md
```

---

## How the Trigger System Works

1. **User calls** `POST /retries/trigger/{id}` or `POST /replay/execute/{id}`
2. **ML prediction** runs (3 Random Forest models + Isolation Forest, 30+ features)
3. **Backoff strategy** selected: aggressive (1-16s), moderate (5-80s), or conservative (30-480s)
4. **Operation enqueued** in MongoDB `operations` collection
5. **Background worker** (polls every 5s) picks up due operations
6. **Delivery simulated** (checks endpoint `avg_success_rate`) — or real HTTP if `SIMULATE_DELIVERY=False`
7. **Result recorded** in `delivery_attempts`, event state updated
8. **Auto-retry** if failed + attempts < 5; marked `failed` if max reached

---

## ML Models

- `model1_success_predictor.joblib` — Retry success probability
- `model2_risk_classifier.joblib` — Risk level (low/medium/high)
- `model3_pattern_classifier.joblib` — Failure pattern classification
- `model3_isolation_forest.joblib` — Anomaly detection
- `scaler.joblib` — Feature scaler

To retrain:
```bash
cd server/ml/src
python train.py
```

ML test suite:
```bash
cd server
python -m pytest ml/tests/test_ml_pipeline.py -v
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `DATABASE_NAME` | `webhook_intelligence` | Database name |
