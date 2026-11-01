# VEKTOR Frontend — Incident Command & Disaster Intelligence

The frontend for **VEKTOR**, a disaster intelligence and emergency relief coordination platform. It delivers a minimalist, ChatGPT-inspired dark interface connecting multi-source news signals, real-time meteorological telemetry, edge multimodal computer vision, and automated supply transit routing into a unified incident command dashboard.

---

## Tech Stack

- **Framework**: React 18 + Vite 5
- **Styling**: Tailwind CSS (dark mode, `#0d0d0d` palette)
- **Icons**: Lucide React
- **Maps**: Leaflet + React Leaflet (custom dark-mode tile rendering)
- **State & Storage**: React Hooks, localStorage persistent history

---

## Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Configuration
Verify or copy `.env.example` to `.env`:
```bash
# .env
VITE_INTELLIGENCE_API_URL=http://localhost:8001
VITE_LOGISTICS_API_URL=http://localhost:8002
```

### 3. Run Development Server
```bash
npm run dev
```
The application will be accessible at: `http://localhost:5173/`

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## Backend Services Integration

The frontend talks to two FastAPI backends:

1. **Intelligence Brain** (`http://localhost:8001`):
   - `GET /health`: Health status check
   - `GET /news`: GDELT / Google News RSS disaster news
   - `GET /weather`: Open-Meteo live weather telemetry
   - `POST /analyze-image`: Qwen2.5-VL 3B visual hazard triage

2. **Logistics Brain** (`http://localhost:8002`):
   - `GET /health`: Health status check
   - `POST /full-response`: Unified orchestration endpoint (accepts `location` and optional `file`)
   - `POST /plan`: Direct disaster supply allocation and OSRM driving route generator

---

## Key Features

- **ChatGPT-Inspired Minimalist Dark UI**: Almost-black background (`#0d0d0d`), charcoal panels (`#141416`), subtle zinc borders (`#27272a`), refined typography.
- **Multimodal Vision Intelligence**: Displays disaster type, severity badges (High/Medium/Low), confidence meter, visible person count, visual indicators checklist, and recommended action.
- **Model Attribution**: Explicitly displays *"Image analysis powered by Qwen2.5-VL 3B"* with *"AI model"* badge and clarification that field ground-truth verification is required.
- **Open-Source News Feed**: Real-time articles from GDELT and Google News RSS with source publishers, timestamps, and clickable original links.
- **Meteorological Telemetry**: Live temperatures, apparent temperatures, humidity, wind speed/direction, precipitation, coordinates, and Open-Meteo attribution.
- **Interactive Leaflet Route Map**: Displays OSRM driving geometry between incident coordinates and the nearest regional relief hub with distance and travel time.
- **Supply Allocation Table**: Real-time quantities against SQLite inventory stockpiles with shortage warnings.
- **Human-in-the-Loop Mission Approval**: Clearly labeled demo approval interaction reflecting operational dispatch protocols.
- **Direct Route Planner Modal**: Ability to plan missions directly for any disaster type (flood, earthquake, wildfire, cyclone, landslide).
- **Offline Resilience & Diagnostic Modal**: Visual indicator showing live status of ports 8001 and 8002.
