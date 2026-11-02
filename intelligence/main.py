import os
from dotenv import load_dotenv

load_dotenv()
_local_env = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(_local_env):
    load_dotenv(_local_env)

from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from news import fetch_disaster_news
from weather import fetch_current_weather
from vision import analyze_disaster_image
from report import generate_intelligence_report
from satellite import fetch_latest_sentinel2, get_satellite_asset_bytes

app = FastAPI(
    title="VEKTOR - Disaster Intelligence",
    description="AI-powered disaster intelligence platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "project": "VEKTOR",
        "module": "Disaster Intelligence",
        "status": "Online"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/news")
async def get_news(location: str = "Jammu", days: int = 7):
    result = await fetch_disaster_news(location, days)
    return result

@app.get("/weather")
async def get_weather(location: str = "Jammu"):
    result = await fetch_current_weather(location)
    return result

@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):

    allowed_types = ["image/jpeg", "image/png", "image/webp"]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WEBP images are supported."
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image.")

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 10 MB.")

    try:
        result = await analyze_disaster_image(
            image_bytes,
            file.content_type
        )
        return result
    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail=f"Vision inference service is unavailable: {str(error)}"
        )

@app.post("/analyze")
async def intelligence_report(
    location: str = Form("Jammu"),
    file: UploadFile = File(None)
):
    image_bytes = None
    mime_type = None

    if file:
        allowed_types = ["image/jpeg", "image/png", "image/webp"]

        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Only JPG, PNG and WEBP images are supported."
            )

        image_bytes = await file.read()
        mime_type = file.content_type

        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="Image must be under 10 MB."
            )

    return await generate_intelligence_report(
        location=location,
        image_bytes=image_bytes,
        mime_type=mime_type
    )

@app.get("/satellite/sentinel2")
async def get_sentinel2_imagery(
    latitude: float = Query(..., description="Target latitude (-90 to 90)"),
    longitude: float = Query(..., description="Target longitude (-180 to 180)"),
    days: int = Query(30, ge=1, le=180, description="Acquisition lookback in days"),
    max_cloud_cover: float = Query(100.0, ge=0.0, le=100.0, description="Max cloud cover %")
):
    """
    Retrieves the latest Copernicus Sentinel-2 satellite imagery for a given coordinate point.
    Returns preview metadata, cloud coverage, acquisition timestamp, and base64 preview.
    """
    try:
        result = await fetch_latest_sentinel2(
            latitude=latitude,
            longitude=longitude,
            days=days,
            max_cloud_cover=max_cloud_cover
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Satellite imagery service error: {str(exc)}"
        )

@app.get("/satellite/image/{asset_id}")
async def get_satellite_image(asset_id: str):
    """
    Proxies binary JPEG imagery from Copernicus Data Space for an authorized asset ID.
    """
    try:
        image_bytes = await get_satellite_asset_bytes(asset_id)
        return Response(content=image_bytes, media_type="image/jpeg")
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch satellite asset: {str(exc)}"
        )
