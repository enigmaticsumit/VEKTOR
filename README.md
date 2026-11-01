# VEKTOR — AI-Powered Disaster Intelligence & Relief Platform

VEKTOR is a disaster intelligence and emergency relief coordination platform. It unifies open-source news signals, real-time meteorological telemetry, multimodal computer vision, and automated supply routing into a single incident command dashboard.

---

## Architecture Overview

```
                                 ┌────────────────────────────────────┐
                                 │   VEKTOR Frontend (React + Vite)   │
                                 │       http://localhost:5173        │
                                 └─────────────────┬──────────────────┘
                                                   │
                        ┌──────────────────────────┴──────────────────────────┐
                        │ multipart/form-data                                 │ json
                        ▼                                                     ▼
        ┌───────────────────────────────┐                     ┌───────────────────────────────┐
        │        Logistics Brain        │◄────────────────────┤       Intelligence Brain      │
        │     http://localhost:8002     │   Internal call     │     http://localhost:8001     │
        └───────────────┬───────────────┘                     └───────────────┬───────────────┘
                        │                                                     │
             ┌──────────┴──────────┐                               ┌──────────┴──────────┐
             ▼                     ▼                               ▼          ▼          ▼
        SQLite DB             OSRM Router                    Google News   Open-Meteo   Qwen2.5-VL
       (vektor.db)          (OpenStreetMap)                    / GDELT      Weather       Vision
```

---

## Production Environment Variables

### 1. Intelligence Service (`intelligence/`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VISION_INFERENCE_URL` | Public/hosted inference endpoint URL (Ollama `/api/generate` or compatible). In production on Render, set this to your hosted inference server. | Local: `http://localhost:11434/api/generate` |
| `VISION_MODEL` | Vision model tag | `qwen2.5vl:3b` |
| `VISION_API_KEY` | Optional Bearer authentication token for secured remote vision endpoints | *(Optional)* |
| `VISION_TIMEOUT_SECONDS` | Request read timeout in seconds | `25.0` |
| `VISION_CONNECT_TIMEOUT_SECONDS` | Fast-fail connection timeout in seconds (prevents 504 gateway hangs if remote endpoint is down) | `5.0` |

> **Note on Vision Resilience**: If the configured vision inference service is unreachable or down, the Intelligence engine does **not** crash or fabricate data; it returns a user-friendly `unavailable` status while fully preserving the rest of the incident report (news, weather, and logistics staging).

### 2. Logistics Service (`logistics/`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `INTELLIGENCE_API` | Target URL for Intelligence `/analyze` endpoint | Production: `https://vektor-intelligence.onrender.com/analyze`<br>Local: `http://127.0.0.1:8001/analyze` |
| `VEKTOR_DB_PATH` | Optional custom path for the SQLite database | `logistics/vektor.db` |

### 3. Frontend Service (`frontend/`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_INTELLIGENCE_API_URL` | Base URL for Intelligence microservice | `http://localhost:8001` or Render URL |
| `VITE_LOGISTICS_API_URL` | Base URL for Logistics microservice | `http://localhost:8002` or Render URL |

---

## Quickstart Guide

### 1. Start the Intelligence Service (Port 8001)

```bash
cd intelligence
python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

Health check: `http://localhost:8001/health`

### 2. Start the Logistics Service (Port 8002)

```bash
cd logistics
python -m uvicorn main:app --host 0.0.0.0 --port 8002
```

Health check: `http://localhost:8002/health`

### 3. Start the Frontend (Port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open your browser at: **`http://localhost:5173/`**

---

## Production Reliability Features

- **Open-Meteo 429 Rate-Limit Protection**: In-memory geocoding and forecast TTL caching, concurrent request deduplication, and exponential backoff retry. Gracefully handles HTTP 429 without crashing.
- **Vision Inference Isolation**: Fast connection timeout (5s) prevents gateway timeouts on Render. Never fabricates AI values.
- **ChatGPT-Inspired Minimalist Dark UI**: Almost-black background (`#0d0d0d`), charcoal panels, subtle borders, clean typography.
- **Multimodal Visual Evidence Triage**: Visual hazard classification, severity ratings, confidence levels, visible persons identified, visual indicators checklist, and operational recommendations.
- **AI Model Attribution**: Visible attribution to `Qwen2.5-VL 3B` with clear ground-truth verification notice.
- **Emergency Supply Transit Map**: Interactive Leaflet map rendering OSRM driving routes from incident coordinates to the nearest regional relief hub.
- **Stockpile Allocation Table**: Detailed inventory fulfillment against local stocks (`logistics/vektor.db`) with shortage alerts.
- **Human-in-the-Loop Mission Approval**: Clearly labeled demo approval interaction indicating current backend architecture.
- **Manual Relief Route Planner**: Direct access to `POST /plan` for testing scenarios across flood, earthquake, wildfire, cyclone, and landslide hazards.
