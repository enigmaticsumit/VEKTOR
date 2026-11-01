
import base64
import json
import httpx


OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "qwen2.5vl:3b"


async def analyze_disaster_image(image_bytes: bytes, mime_type: str):

    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    prompt = """
    You are VEKTOR, a disaster intelligence assistant.

    Carefully analyze this image for:
    1. Flooding
    2. Landslides
    3. Earthquake damage
    4. Snowfall
    5. Road damage
    6. Building damage
    7. Visible people who may need rescue

    Return ONLY valid JSON in this format:

    {
        "disaster_detected": true,
        "disaster_type": "Flood",
        "severity": "High",
        "confidence": 0.85,
        "visible_people": 4,
        "visual_evidence": [
            "Water covering the road",
            "Vehicles partially submerged"
        ],
        "recommended_action": "Avoid the flooded road",
        "verification_status": "AI preliminary assessment; human verification required"
    }

    Rules:
    - Never invent visual evidence.
    - Do not assume a disaster if evidence is unclear.
    - Do not estimate people's weight or exact age.
    - Count only visibly identifiable people.
    - If no disaster is visible, set disaster_detected to false.
    - Confidence must be between 0 and 1.
    """

    payload = {
        "model": MODEL,
        "prompt": prompt,
        "images": [image_base64],
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.2
        }
    }

    async with httpx.AsyncClient(timeout=180) as client:

        response = await client.post(
            OLLAMA_URL,
            json=payload
        )

        response.raise_for_status()

        result = response.json()

        return json.loads(result["response"])
