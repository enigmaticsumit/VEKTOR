import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError("GEMINI_API_KEY missing from .env")

client = genai.Client(api_key=API_KEY)

MODEL = "gemini-3.8-flash"

async def analyze_disaster_image(image_bytes: bytes, mime_type: str):
    prompt = """
    You are VEKTOR, a disaster intelligence assistant.

    Analyze this image for possible:
    - Flooding
    - Landslides
    - Earthquake damage
    - Snowfall
    - Road damage
    - Building damage

    Return ONLY valid JSON in this format:

    {
        "disaster_detected": true,
        "disaster_type": "Flood",
        "severity": "High",
        "confidence": 0.85,
        "visual_evidence": ["Water covering the road"],
        "recommended_action": "Avoid the flooded road",
        "verification_status": "AI visual assessment; requires human verification"
    }

    Do not claim certainty beyond what is visible.
    If no disaster is visible, set disaster_detected to false.
    """

    response = client.models.generate_content(
        model=MODEL,
        contents=[
            types.Part.from_bytes(
                data=image_bytes,
                mime_type=mime_type
            ),
            prompt
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )

    return json.loads(response.text)