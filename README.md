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
        SQLite DB             OSRM Router                    Google News   Open-Meteo    Gemini Vision
       (vektor.db)          (OpenStreetMap)                    / GDELT      Weather       (3.1 Flash Lite)
```

---

## Production Environment Variables

### 1. Intelligence Service (`intelligence/`)

Configure these environment variables in your Render service settings:

| Variable | Description | Required | Default / Example |
| :--- | :--- | :--- | :--- |
| `VISION_PROVIDER` | Active vision provider: `gemini` (production) or `ollama` (local) | **Yes** | `gemini` |
| `GEMINI_API_KEY` | Google Gemini API key for vision multimodal inference | **Yes** (if `gemini`) | *Your Google AI Studio API Key* |
| `GEMINI_MODEL` | Gemini model ID | No | `gemini-3.1-flash-lite` |
| `VISION_INFERENCE_URL` | Optional remote Ollama endpoint URL (if using Ollama provider) | No | `http://localhost:11434/api/generate` |
| `VISION_MODEL` | Optional Ollama model name | No | `qwen2.5vl:3b` |
| `VISION_TIMEOUT_SECONDS` | Request read timeout | No | `25.0` |
| `VISION_CONNECT_TIMEOUT_SECONDS` | Fast connection timeout | No | `5.0` |

> **Production Resilience**:
> - **Gemini Vision**: The service connects via the official `google-genai` SDK using `gemini-3.1-flash-lite`. API keys are securely read from the environment and never printed, logged, or leaked.
> - **Graceful Failure**: If the vision API returns quota errors (429) or is temporarily unavailable, the system safely marks vision as `unavailable` while fully preserving news, weather telemetry, and logistics routing. AI results are **never** fabricated.

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

- **Google Gemini 3.1 Flash Lite Vision**: Official `google-genai` SDK async integration with structured JSON responses.
- **Open-Meteo 429 Rate-Limit Protection**: In-memory geocoding and forecast TTL caching, concurrent request deduplication, and exponential backoff retry. Gracefully handles HTTP 429 without crashing.
- **Vision Inference Isolation**: Fast connection timeout prevents gateway timeouts on Render. Never fabricates AI values.
- **ChatGPT-Inspired Minimalist Dark UI**: Almost-black background (`#0d0d0d`), charcoal panels, subtle borders, clean typography.
- **Multimodal Visual Evidence Triage**: Visual hazard classification, severity ratings, confidence levels, visible persons identified, visual indicators checklist, and operational recommendations.
- **Emergency Supply Transit Map**: Interactive Leaflet map rendering OSRM driving routes from incident coordinates to the nearest regional relief hub.
- **Stockpile Allocation Table**: Detailed inventory fulfillment against local stocks (`logistics/vektor.db`) with shortage alerts.
- **Human-in-the-Loop Mission Approval**: Clearly labeled demo approval interaction indicating current backend architecture.
- **Manual Relief Route Planner**: Direct access to `POST /plan` for testing scenarios across flood, earthquake, wildfire, cyclone, and landslide hazards.
