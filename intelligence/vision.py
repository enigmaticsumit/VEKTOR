import base64
import json
import os
import re
from typing import Any, Optional
from dotenv import load_dotenv
import httpx

load_dotenv()
_local_env = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(_local_env):
    load_dotenv(_local_env)

VISION_PROMPT = """
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
- If no disaster is visible, set disaster_detected to false and disaster_type to null.
- Confidence must be between 0 and 1.
"""


class VisionInferenceUnavailableError(Exception):
    """Raised when the vision AI inference service is unreachable or returns an error."""
    pass


def _sanitize_key_from_error(message: str) -> str:
    """Ensure any accidental API key patterns in SDK tracebacks are redacted."""
    sanitized = re.sub(r"AQ\.[a-zA-Z0-9_-]{30,}", "[REDACTED_API_KEY]", str(message))
    sanitized = re.sub(r"AIza[a-zA-Z0-9_-]{35}", "[REDACTED_API_KEY]", sanitized)
    return sanitized


def _clean_json_string(text: str) -> str:
    """Extract and sanitize JSON from markdown codeblocks or raw output."""
    cleaned = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if match:
        cleaned = match.group(1).strip()
    return cleaned


def _format_vision_result(data: dict[str, Any], provider: str, model: str) -> dict[str, Any]:
    """Normalize and enforce the VEKTOR vision schema."""
    disaster_detected = bool(data.get("disaster_detected"))
    disaster_type = data.get("disaster_type")
    if disaster_type is not None:
        disaster_type = str(disaster_type).strip()

    severity = data.get("severity") or ("Moderate" if disaster_detected else "Low")

    confidence = data.get("confidence")
    if isinstance(confidence, (int, float)) and not isinstance(confidence, bool):
        confidence = max(0.0, min(1.0, float(confidence)))
    else:
        confidence = 0.85 if disaster_detected else 0.95

    visible_people = data.get("visible_people")
    if isinstance(visible_people, (int, float)) and not isinstance(visible_people, bool):
        visible_people = int(visible_people)
    else:
        visible_people = 0

    visual_evidence = data.get("visual_evidence")
    if not isinstance(visual_evidence, list):
        visual_evidence = [str(visual_evidence)] if visual_evidence else []

    rec_act = data.get("recommended_action")
    if not rec_act or str(rec_act).strip().lower() in ("none", "null"):
        rec_act = (
            "Maintain situational awareness and verify field conditions"
            if disaster_detected
            else "No immediate hazard detected"
        )
    recommended_action = str(rec_act).strip()

    verification_status = (
        data.get("verification_status")
        or "AI preliminary assessment; human verification required"
    )

    return {
        "status": "success",
        "disaster_detected": disaster_detected,
        "disaster_type": disaster_type,
        "severity": severity,
        "confidence": confidence,
        "visible_people": visible_people,
        "visual_evidence": visual_evidence,
        "recommended_action": recommended_action,
        "verification_status": verification_status,
        "provider": provider,
        "model": model,
    }


def get_vision_provider() -> str:
    """
    Determine the active vision provider.
    Priority:
    1. VISION_PROVIDER environment variable ('gemini' or 'ollama')
    2. 'gemini' if GEMINI_API_KEY is configured
    3. 'ollama' otherwise
    """
    provider = os.getenv("VISION_PROVIDER", "").lower().strip()
    if provider in ("gemini", "ollama"):
        return provider

    if os.getenv("GEMINI_API_KEY"):
        return "gemini"

    return "ollama"


# ============================================================================
# Google Gemini Vision Provider Implementation
# ============================================================================

async def _analyze_with_gemini(image_bytes: bytes, mime_type: str) -> dict[str, Any]:
    """
    Analyze image using Google Gemini Vision API via official google-genai SDK.
    Never logs or exposes the API key.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not api_key.strip():
        raise VisionInferenceUnavailableError(
            "GEMINI_API_KEY environment variable is missing. "
            "Configure GEMINI_API_KEY in Render environment variables or local .env."
        )

    model_id = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite").strip()
    if not model_id:
        model_id = "gemini-3.1-flash-lite"

    # Validate/normalize mime_type
    valid_mime = mime_type if mime_type in ("image/jpeg", "image/png", "image/webp") else "image/jpeg"

    try:
        from google import genai
        from google.genai import types
        from google.genai import errors
    except ImportError as exc:
        raise VisionInferenceUnavailableError(
            f"The google-genai SDK is not installed: {str(exc)}. Ensure google-genai is installed."
        ) from exc

    try:
        client = genai.Client(api_key=api_key.strip())
        part = types.Part.from_bytes(data=image_bytes, mime_type=valid_mime)
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
        )

        response = await client.aio.models.generate_content(
            model=model_id,
            contents=[part, VISION_PROMPT],
            config=config,
        )

        raw_text = response.text or ""
        cleaned = _clean_json_string(raw_text)
        data = json.loads(cleaned)

        return _format_vision_result(data, provider="gemini", model=model_id)

    except errors.APIError as exc:
        err_msg = _sanitize_key_from_error(str(exc))
        if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
            raise VisionInferenceUnavailableError(
                f"Google Gemini API quota exceeded (HTTP 429) for model '{model_id}'. Please retry in a moment."
            ) from exc
        if "401" in err_msg or "403" in err_msg or "API_KEY_INVALID" in err_msg:
            raise VisionInferenceUnavailableError(
                "Invalid or unauthorized GEMINI_API_KEY. Please verify your Render environment settings."
            ) from exc
        raise VisionInferenceUnavailableError(
            f"Google Gemini Vision API error ({model_id}): {err_msg}"
        ) from exc
    except json.JSONDecodeError as exc:
        raise VisionInferenceUnavailableError(
            f"Google Gemini returned an unexpected non-JSON response structure: {str(exc)}"
        ) from exc
    except Exception as exc:
        err_msg = _sanitize_key_from_error(str(exc))
        raise VisionInferenceUnavailableError(
            f"Gemini Vision request failed: {err_msg}"
        ) from exc


# ============================================================================
# Ollama Vision Provider Implementation (Local Development)
# ============================================================================

def _get_ollama_config() -> dict[str, Any]:
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


async def _analyze_with_ollama(image_bytes: bytes, mime_type: str) -> dict[str, Any]:
    config = _get_ollama_config()
    primary_url = config["url"]
    model = config["model"]
    api_key = config["api_key"]
    timeout = config["timeout"]
    connect_timeout = config["connect_timeout"]

    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    payload = {
        "model": model,
        "prompt": VISION_PROMPT,
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

    urls_to_try = [primary_url]
    if primary_url == "http://localhost:11434/api/generate":
        urls_to_try.append("http://10.81.40.113:11434/api/generate")
    elif primary_url == "http://10.81.40.113:11434/api/generate":
        urls_to_try.append("http://localhost:11434/api/generate")

    last_error: Optional[Exception] = None

    for candidate_url in urls_to_try:
        try:
            timeout_config = httpx.Timeout(timeout, connect=connect_timeout)
            async with httpx.AsyncClient(timeout=timeout_config) as client:
                response = await client.post(candidate_url, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
                raw_output = data.get("response") or data.get("content") or ""
                if isinstance(raw_output, dict):
                    parsed = raw_output
                else:
                    parsed = json.loads(_clean_json_string(str(raw_output)))

                return _format_vision_result(parsed, provider="ollama", model=model)

        except (httpx.ConnectError, httpx.ConnectTimeout) as exc:
            last_error = exc
            continue
        except httpx.HTTPStatusError as exc:
            raise VisionInferenceUnavailableError(
                f"Ollama inference endpoint ({candidate_url}) returned HTTP {exc.response.status_code}."
            ) from exc
        except (httpx.ReadTimeout, httpx.TimeoutException) as exc:
            raise VisionInferenceUnavailableError(
                f"Ollama inference endpoint ({candidate_url}) timed out after {timeout}s."
            ) from exc
        except (json.JSONDecodeError, KeyError) as exc:
            raise VisionInferenceUnavailableError(
                f"Ollama inference endpoint returned invalid JSON: {str(exc)}"
            ) from exc
        except Exception as exc:
            raise VisionInferenceUnavailableError(
                f"Ollama inference request failed: {str(exc)}"
            ) from exc

    raise VisionInferenceUnavailableError(
        f"Ollama vision service is unreachable at {primary_url}. "
        "For production on Render, set VISION_PROVIDER=gemini and configure GEMINI_API_KEY. "
        "For local development, ensure Ollama is running with qwen2.5vl:3b."
    ) from last_error


# ============================================================================
# Main Unified Vision Analysis Interface
# ============================================================================

async def analyze_disaster_image(image_bytes: bytes, mime_type: str) -> dict[str, Any]:
    """
    Main entry point for disaster image analysis in VEKTOR.
    Dispatches to Google Gemini (production default) or Ollama (local dev).
    Never fabricates AI results on failure.
    """
    provider = get_vision_provider()
    if provider == "gemini":
        return await _analyze_with_gemini(image_bytes, mime_type)
    return await _analyze_with_ollama(image_bytes, mime_type)
