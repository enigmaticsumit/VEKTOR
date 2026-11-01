from fastapi import FastAPI
from news import fetch_disaster_news
from weather import fetch_current_weather
from fastapi import UploadFile, File, HTTPException
from vision import analyze_disaster_image
from fastapi import Form
from report import generate_intelligence_report

app = FastAPI(
    title="VEKTOR - Disaster Intelligence",
    description="AI-powered disaster intelligence platform",
    version="1.0.0"
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

    result = await analyze_disaster_image(
        image_bytes,
        file.content_type
    )

    return result

@app.post("/intelligence-report")
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