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

## Frontend Features

- **ChatGPT-Inspired Minimalist Dark UI**: Almost-black background (`#0d0d0d`), charcoal panels, subtle borders, clean typography.
- **Multimodal Visual Evidence Triage**: Visual hazard classification, severity ratings, confidence levels, visible persons identified, visual indicators checklist, and operational recommendations.
- **AI Model Attribution**: Visible attribution to `Qwen2.5-VL 3B` with clear ground-truth verification notice.
- **Live Meteorological Telemetry**: Real-time atmospheric conditions (temperature, humidity, precipitation, wind, coordinates) powered by Open-Meteo.
- **OSINT News Feed**: Real-time disaster signals with publishers, publication dates, and original links from GDELT and Google News RSS.
- **Emergency Supply Transit Map**: Interactive Leaflet map rendering OSRM driving routes from incident coordinates to the nearest regional relief hub.
- **Stockpile Allocation Table**: Detailed inventory fulfillment against local stocks (`logistics/vektor.db`) with shortage alerts.
- **Human-in-the-Loop Mission Approval**: Clearly labeled demo approval interaction indicating current backend architecture.
- **Manual Relief Route Planner**: Direct access to `POST /plan` for testing scenarios across flood, earthquake, wildfire, cyclone, and landslide hazards.
- **Local Analysis History**: Persistent session history stored in browser localStorage.
