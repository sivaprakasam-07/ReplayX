<img width="3381" height="1377" alt="confusion_matrices" src="https://github.com/user-attachments/assets/0f0d7b8d-734c-4433-b89a-ad1cb443c573" /><img width="2260" height="1314" alt="architecture_highlights" src="https://github.com/user-attachments/assets/546cd8e9-2d59-4dbc-a093-b6b7086ebc55" /># ReplayX — Webhook Delivery Reliability Intelligence Platform

ReplayX is an ML-assisted webhook reliability intelligence platform designed to monitor webhook events in realtime, predict retry success, analyze replay safety, detect anomalies, and automate operational recovery workflows.

The platform combines:

* FastAPI backend services
* MongoDB persistence
* Realtime operational monitoring
* Retry & replay orchestration
* Machine Learning operational intelligence
* WebSocket + polling fallback communication
* React + Vite analytics dashboards

---

# Features

* Realtime webhook monitoring
* Retry success prediction
* Replay safety analysis
* Endpoint health analytics
* Failure pattern detection
* Anomaly detection
* Retry orchestration engine
* Replay execution engine
* Operations queue management
* ML-assisted operational intelligence
* WebSocket realtime updates
* Polling fallback architecture for deployment stability

---

# Tech Stack

## Frontend

* React + Vite
* TailwindCSS
* Framer Motion
* Recharts
* Axios
* react-hot-toast

## Backend

* FastAPI
* MongoDB Atlas
* WebSocket
* Async Scheduler Worker

## Machine Learning

* scikit-learn
* Random Forest
* Isolation Forest
* Feature Engineering
* Joblib

---

# Prerequisites

* Python 3.11+
* Node.js 18+
* MongoDB 6+

---

# Quick Start

## 1. Backend Setup

```bash
cd server
pip install -r requirements.txt
```

Create `.env` inside `server/`:

```env
MONGO_URL="mongodb://localhost:27017"
DATABASE_NAME="webhook_intelligence"
```

Optional sample data seeding:

```bash
python seed_db.py
```

Start backend:

```bash
uvicorn main:app --reload --port 8000
```

Verify:

```text
http://localhost:8000/docs
```

---

## 2. Frontend Setup

```bash
cd client
npm install
```

Create `.env` inside `client/`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws/events
```

Start frontend:

```bash
npm run dev
```

Verify:

```text
http://localhost:5173
```

---

# Deployment Environment Variables

## Frontend (Vercel)

```env
VITE_API_BASE_URL=https://your-backend-url
VITE_WS_URL=wss://your-backend-url/ws/events
```

## Backend

```env
MONGO_URL=your_mongodb_connection_string
DATABASE_NAME=webhook_intelligence
```

---

# WebSocket Fallback Architecture

ReplayX primarily uses WebSockets for realtime operational updates.

To improve deployment stability on hosting providers with WebSocket limitations, a polling fallback mechanism is implemented.

Flow:

```text
Try WebSocket Connection
        ↓
If WebSocket Fails
        ↓
HTTP Polling Fallback Starts
        ↓
UI Updates Every Few Seconds
```

This ensures:

* stable deployment behavior
* near-realtime dashboard updates
* uninterrupted monitoring workflows
* operational reliability during demos

---

# Simulating Events for Testing

With the backend server running:

```powershell
# Failed event
curl -X POST http://localhost:8000/api/v1/simulate/failure

# Retry flow
curl -X POST http://localhost:8000/api/v1/simulate/retry

# Replay scenario
curl -X POST http://localhost:8000/api/v1/simulate/replay

# Trigger retry operation
curl -X POST http://localhost:8000/api/v1/simulate/trigger_retry

# Trigger replay operation
curl -X POST http://localhost:8000/api/v1/simulate/trigger_replay

# Success event
curl -X POST http://localhost:8000/api/v1/simulate/success
```

---

# Triggering Retries & Replays

```powershell
# Trigger retry
curl -X POST http://localhost:8000/api/v1/retries/trigger/EVT_SIM_XXXXXX

# Execute replay
curl -X POST http://localhost:8000/api/v1/replay/execute/EVT_SIM_XXXXXX

# View operations queue
curl http://localhost:8000/api/v1/operations/queue?status=all

# Process pending operations
curl -X POST http://localhost:8000/api/v1/operations/process-pending
```

---

# Frontend Pages

| Page            | Route              | Description                                |
| --------------- | ------------------ | ------------------------------------------ |
| Dashboard       | `/`                | Realtime operational metrics overview      |
| Monitoring      | `/monitoring`      | Webhook event monitoring & ML insights     |
| Retry Analysis  | `/retry-analysis`  | Retry timeline, ML forecasting, queue view |
| Replay Center   | `/replay-center`   | Replay recommendations & risk analysis     |
| Endpoint Health | `/endpoint-health` | Endpoint analytics & operational health    |
| Simulator       | `/simulator`       | Generate webhook test events               |
| API Docs        | `/docs`            | Swagger API documentation                  |

---

# Project Structure

```text
ReplayX/
├── client/
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── services/
│       └── websocket/
│
├── server/
│   ├── routers/
│   ├── services/
│   ├── models/
│   ├── ml/
│   │   ├── src/
│   │   ├── models/
│   │   └── tests/
│   └── scheduler.py
│
└── README.md
```

---

# How the Retry & Replay System Works

```text
Simulator Trigger
        ↓
Event Created
        ↓
MongoDB Storage
        ↓
ML Prediction
        ↓
Retry / Replay Scheduling
        ↓
Operations Queue
        ↓
Background Worker Execution
        ↓
Delivery Result Processing
        ↓
Realtime Frontend Updates
```

---

# ML System

## Models Used

* `model1_success_predictor.joblib`
* `model2_risk_classifier.joblib`
* `model3_pattern_classifier.joblib`
* `model3_isolation_forest.joblib`
* `scaler.joblib`

## ML Features

* retry success probability
* replay risk analysis
* anomaly detection
* failure pattern classification
* recovery forecasting
* operational intelligence scoring

## ML + Rule Engine

ReplayX combines:

* deterministic rule-based safety validation
* predictive ML operational scoring

Example:

```text
If retry success probability > 70%
→ Retry succeeds
→ Event marked as recovered
→ Frontend updates in realtime
```

---
#ML Architecture
![Uploading architecture_highlights.png…]()


# ML Training & Evaluation

![Uploading roc_retry_success.png…]()


Synthetic webhook operational datasets were used for training and evaluation.

## Dataset Information

* 10,647 dataset rows
* 51 engineered operational features
* 6 feature categories

## ML Testing Results

```text
31/32 Unit Tests Passed
```

## Model Accuracy

![Uploading accuracy_comparison.png…]()


| Model                    | Algorithm                        | Accuracy     |
| ------------------------ | -------------------------------- | ------------ |
| Retry Success Predictor  | Random Forest                    | 99.7%        |
| Risk Level Classifier    | Random Forest                    | 99.8%        |
| Failure Pattern Detector | Random Forest + Isolation Forest | 99.6%        |
| Anomaly Detector         | Isolation Forest                 | Unsupervised |

## Key Validation Areas

<img width="3381" height="1377" alt="confusion_matrices" src="https://github.com/user-attachments/assets/a994151f-e32c-4316-8342-adf7cef5d414" />


* feature engineering validation
* prediction logic testing
* retry forecasting
* replay risk scoring
* operations queue validation
* end-to-end retry execution
* realtime operational flow

---

# ML Test Suite

Run ML tests:

```bash
cd server
python -m pytest ml/tests/test_ml_pipeline.py -v
```

Retrain ML models:

```bash
cd server/ml/src
python train.py
```

---






# Delivery States

* delivered
* retrying
* failed
* expired
* duplicate
* recovered
* unsafe_to_replay

---

# Failure Reasons

* timeout
* invalid_signature
* endpoint_deleted
* payload_too_large
* duplicate_event
* replay_without_fix
* malformed_response
* rate_limited

---

# Key Architecture Hi

* Hybrid ML + Rule Engine
* Retry Intelligence System
* Replay Safety Analysis
* Operational Monitoring
* Graceful Fallback Architecture
* Realtime Webhook Visibility
* ML-based Retry Backoff Strategies
* MongoDB Operations Queue
* WebSocket + Polling Fallback

---

# Final Summary

ReplayX combines realtime webhook monitoring, ML-assisted retry intelligence, replay safety analysis, anomaly detection, and operational recovery orchestration into a unified webhook reliability intelligence platform.
