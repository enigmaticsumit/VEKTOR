import base64
import json
import os
import re
from typing import Any, Optional
from dotenv import load_dotenv
import httpx

load_dotenv()


class VisionInferenceUnavailableError(Exception):
    """Raised when the vision AI inference service is unreachable or returns an error."""
    pass


def get_vision_config() -> dict[str, Any]:
    """Retrieve vision inference configuration from environment variables."""
    # Priority: VISION_INFERENCE_URL -> OLLAMA_URL -> Localhost
    url = os.getenv("VISION_INFERENCE_URL") or os.getenv("OLLAMA_URL")
    if not url:
        url = "http://localhost:11434/api/generate"

    model = os.getenv("VISION_MODEL") or os.getenv("OLLAMA_MODEL") or "qwen2.5vl:3b"
    api_key = os.getenv("VISION_API_KEY")

    try:
        timeout = float(os.getenv("VISION_TIMEOUT_SECONDS", "25.0"))
    except ValueError:
        timeout = 25.0

    try:
        connect_timeout = float(os.getenv("VISION_CONNECT_TIMEOUT_SECONDS", "5.0"))
    except ValueError:
        connect_timeout = 5.0

    return {
        "url": url,
        "model": model,
        "api_key": api_key,
        "timeout": timeout,
        "connect_timeout": connect_timeout,
    }


def _clean_json_string(text: str) -> str:
    cleaned = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if match:
        cleaned = match.group(1).strip()
    return cleaned


async def _call_inference_endpoint(
    url: str,
    payload: dict[str, Any],
    headers: dict[str, str],
    timeout: float,
    connect_timeout: float
) -> dict[str, Any]:
    timeout_config = httpx.Timeout(timeout, connect=connect_timeout)
    async with httpx.AsyncClient(timeout=timeout_config) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        raw_output = data.get("response") or data.get("content") or ""
        if isinstance(raw_output, dict):
            return raw_output
        return json.loads(_clean_json_string(str(raw_output)))


async def analyze_disaster_image(image_bytes: bytes, mime_type: str) -> dict[str, Any]:
    """
    Analyze image using configurable Ollama/Vision inference endpoint.
    If inference is unreachable, raises VisionInferenceUnavailableError with a descriptive message.
    Never fabricates disaster indicators or people counts.
    """
    config = get_vision_config()
    primary_url = config["url"]
    model = config["model"]
    api_key = config["api_key"]
    timeout = config["timeout"]
    connect_timeout = config["connect_timeout"]

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
        "model": model,
        "prompt": prompt,
        "images": [image_base64],
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.2
        }
    }

    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    # Target URLs to attempt (Primary, then local fallback if primary was localhost or 10.81.40.113)
    urls_to_try = [primary_url]
    if primary_url == "http://localhost:11434/api/generate":
        urls_to_try.append("http://10.81.40.113:11434/api/generate")
    elif primary_url == "http://10.81.40.113:11434/api/generate":
        urls_to_try.append("http://localhost:11434/api/generate")

    last_error: Optional[Exception] = None

    for candidate_url in urls_to_try:
        try:
            result = await _call_inference_endpoint(
                candidate_url,
                payload,
                headers,
                timeout,
                connect_timeout
            )
            return result
        except (httpx.ConnectError, httpx.ConnectTimeout) as exc:
            last_error = exc
            continue
        except httpx.HTTPStatusError as exc:
            raise VisionInferenceUnavailableError(
                f"Vision inference endpoint ({candidate_url}) returned HTTP {exc.response.status_code}."
            ) from exc
        except (httpx.ReadTimeout, httpx.TimeoutException) as exc:
            raise VisionInferenceUnavailableError(
                f"Vision inference endpoint ({candidate_url}) timed out after {timeout}s."
            ) from exc
        except (json.JSONDecodeError, KeyError) as exc:
            raise VisionInferenceUnavailableError(
                f"Vision inference endpoint returned invalid JSON structure: {str(exc)}"
            ) from exc
        except Exception as exc:
            raise VisionInferenceUnavailableError(
                f"Vision inference request failed: {str(exc)}"
            ) from exc

    # If all candidate endpoints failed connection
    raise VisionInferenceUnavailableError(
        f"Vision inference service is unreachable at {primary_url}. "
        "In production (Render), configure the VISION_INFERENCE_URL environment variable with an accessible endpoint. "
        "For local development, ensure Ollama is running with model 'qwen2.5vl:3b'."
    ) from last_error
