"""FastAPI application for the VEKTOR Logistics Brain."""

import os
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import httpx
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from . import database
from .planner import build_mission_plan
from .routing import LocationNotFoundError, RoutingError

DisasterType = Literal["flood", "earthquake", "wildfire", "cyclone", "landslide"]
STATIC_FILE = Path(__file__).with_name("static") / "index.html"

app = FastAPI(
    title="VEKTOR Logistics Brain",
    description="Starter relief-supply recommendations and map routes.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PlanRequest(BaseModel):
    location: str = Field(min_length=2, max_length=200)
    disaster_type: DisasterType


class SupplyRecommendation(BaseModel):
    item_id: str
    name: str
    quantity: int
    requested_quantity: int
    available_quantity: int
    shortage: int
    unit: str


class Coordinate(BaseModel):
    latitude: float
    longitude: float


class Destination(Coordinate):
    name: str


class Route(BaseModel):
    origin: Coordinate
    distance_m: float
    duration_s: float
    geometry: list[list[float]]


class PlanResponse(BaseModel):
    id: int
    location: str
    disaster_type: DisasterType
    destination: Destination
    route: Route
    recommended_supplies: list[SupplyRecommendation]
    mission_summary: str
    created_at: str


@app.on_event("startup")
def startup() -> None:
    database.initialize_database()


@app.get("/", include_in_schema=False)
def home() -> FileResponse:
    return FileResponse(STATIC_FILE)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/plan", response_model=PlanResponse)
def create_plan(request: PlanRequest) -> dict:
    if not request.location.strip():
        raise HTTPException(status_code=422, detail="Location cannot be blank.")
    try:
        mission = build_mission_plan(request.location, request.disaster_type)
    except LocationNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except RoutingError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    mission_id, created_at = database.save_mission(mission)
    return {"id": mission_id, **mission, "created_at": created_at}

INTELLIGENCE_API = os.getenv(
    "INTELLIGENCE_API", "https://vektor-intelligence.onrender.com/analyze"
)


@app.post("/full-response")
async def full_response(
    location: str = Form(...),
    file: UploadFile = File(None)
):
    if not location.strip():
        raise HTTPException(status_code=422, detail="Location cannot be blank.")

    try:
        async with httpx.AsyncClient(timeout=240) as client:

            data = {"location": location}

            if file:
                image_bytes = await file.read()

                if not image_bytes:
                    raise HTTPException(
                        status_code=400,
                        detail="Uploaded image is empty."
                    )

                files = {
                    "file": (
                        file.filename,
                        image_bytes,
                        file.content_type
                    )
                }

                response = await client.post(
                    INTELLIGENCE_API,
                    data=data,
                    files=files
                )
            else:
                response = await client.post(
                    INTELLIGENCE_API,
                    data=data
                )

            response.raise_for_status()
            intelligence = response.json()

    except httpx.HTTPStatusError as error:
        raise HTTPException(
            status_code=502,
            detail=f"Intelligence API error: {error.response.text}"
        )
    except httpx.RequestError as error:
        raise HTTPException(
            status_code=503,
            detail=f"Cannot connect to Intelligence API: {str(error)}"
        )

    image_analysis = intelligence.get("image_analysis") or {}

    disaster_type = str(
        image_analysis.get("disaster_type", "")
    ).lower()

    confidence = image_analysis.get("confidence", 0)

    supported_disasters = {
        "flood", "earthquake", "landslide",
        "wildfire", "cyclone"
    }

    logistics = {
        "status": "not_generated",
        "message": "No sufficiently reliable, supported disaster classification."
    }

    if (
        image_analysis.get("disaster_detected") is True
        and disaster_type in supported_disasters
        and isinstance(confidence, (int, float))
        and not isinstance(confidence, bool)
        and 0.70 <= confidence <= 1.0
    ):
        try:
            mission = build_mission_plan(location, disaster_type)
            mission_id, created_at = database.save_mission(mission)

            logistics = {
                "status": "awaiting_human_approval",
                "approval_required": True,
                "mission": {
                    "id": mission_id,
                    **mission,
                    "created_at": created_at
                }
            }

        except LocationNotFoundError as error:
            logistics = {"status": "error", "message": str(error)}
        except RoutingError as error:
            logistics = {"status": "error", "message": str(error)}

    return {
        "project": "VEKTOR",
        "location": location,
        "intelligence": intelligence,
        "logistics": logistics
    }
