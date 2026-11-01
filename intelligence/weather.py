import asyncio
import random
import time
from typing import Any, Optional
import httpx

# In-memory caches to prevent Open-Meteo 429 rate limits
_GEO_CACHE: dict[str, dict[str, Any]] = {
    # Pre-seeded coordinates for standard relief & incident monitoring hubs
    "jammu": {"name": "Jammu", "country": "India", "latitude": 32.73528, "longitude": 74.86167},
    "srinagar": {"name": "Srinagar", "country": "India", "latitude": 34.08366, "longitude": 74.79728},
    "new delhi": {"name": "New Delhi", "country": "India", "latitude": 28.6139, "longitude": 77.2090},
    "delhi": {"name": "Delhi", "country": "India", "latitude": 28.6139, "longitude": 77.2090},
    "shimla": {"name": "Shimla", "country": "India", "latitude": 31.1048, "longitude": 77.1734},
    "leh": {"name": "Leh", "country": "India", "latitude": 34.1526, "longitude": 77.5771},
    "mumbai": {"name": "Mumbai", "country": "India", "latitude": 19.0760, "longitude": 72.8777},
    "kolkata": {"name": "Kolkata", "country": "India", "latitude": 22.5726, "longitude": 88.3639},
    "chennai": {"name": "Chennai", "country": "India", "latitude": 13.0827, "longitude": 80.2707},
}

_WEATHER_CACHE: dict[str, tuple[dict[str, Any], float]] = {}
_LAST_KNOWN_WEATHER: dict[str, dict[str, Any]] = {}
_IN_FLIGHT_REQUESTS: dict[str, asyncio.Future] = {}
_CACHE_TTL_SECONDS = 300  # 5 minutes sensible cache


def get_weather_description(code: int) -> str:
    descriptions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        71: "Slight snowfall",
        73: "Moderate snowfall",
        75: "Heavy snowfall",
        80: "Rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        95: "Thunderstorm",
        96: "Thunderstorm with hail",
        99: "Severe thunderstorm with hail"
    }
    return descriptions.get(code, "Unknown weather condition")


async def _fetch_with_backoff(
    client: httpx.AsyncClient,
    url: str,
    params: dict[str, Any],
    max_retries: int = 3
) -> httpx.Response:
    """Fetch URL with exponential backoff on HTTP 429 or temporary 5xx errors."""
    last_response: Optional[httpx.Response] = None

    for attempt in range(max_retries):
        try:
            response = await client.get(url, params=params)
            last_response = response

            if response.status_code == 429:
                if attempt < max_retries - 1:
                    retry_header = response.headers.get("Retry-After")
                    if retry_header and retry_header.strip().isdigit():
                        backoff = min(float(retry_header), 4.0)
                    else:
                        backoff = 0.8 * (2 ** attempt) + random.uniform(0.1, 0.4)
                    await asyncio.sleep(backoff)
                    continue
                return response

            if response.status_code in (502, 503, 504):
                if attempt < max_retries - 1:
                    await asyncio.sleep(0.7 * (attempt + 1))
                    continue
                return response

            return response

        except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.ConnectError) as exc:
            if attempt < max_retries - 1:
                await asyncio.sleep(0.5 * (attempt + 1))
                continue
            raise exc

    return last_response  # type: ignore


async def _execute_weather_fetch(location: str) -> dict[str, Any]:
    """Internal weather query logic with geocoding, forecast, and error isolation."""
    cleaned_location = location.strip().lower()

    # Step 1: Geocoding (check pre-seeded or cached coordinates first)
    place: Optional[dict[str, Any]] = _GEO_CACHE.get(cleaned_location)

    async with httpx.AsyncClient(timeout=15) as client:
        if not place:
            geo_url = "https://geocoding-api.open-meteo.com/v1/search"
            try:
                geo_resp = await _fetch_with_backoff(
                    client,
                    geo_url,
                    {"name": location.strip(), "count": 1, "language": "en", "format": "json"}
                )

                if geo_resp.status_code == 429:
                    return {
                        "status": "rate_limited",
                        "location": location,
                        "weather": None,
                        "units": None,
                        "source": "Open-Meteo",
                        "message": "Open-Meteo geocoding is temporarily rate-limited (HTTP 429). Incident intelligence remains active."
                    }

                geo_resp.raise_for_status()
                geo_data = geo_resp.json()
                results = geo_data.get("results", [])

                if not results:
                    return {
                        "status": "error",
                        "location": location,
                        "weather": None,
                        "message": f"Location not found: {location}"
                    }

                matched = results[0]
                place = {
                    "name": matched["name"],
                    "country": matched.get("country"),
                    "latitude": float(matched["latitude"]),
                    "longitude": float(matched["longitude"])
                }
                _GEO_CACHE[cleaned_location] = place

            except httpx.HTTPStatusError as err:
                if err.response.status_code == 429:
                    return {
                        "status": "rate_limited",
                        "location": location,
                        "weather": None,
                        "units": None,
                        "source": "Open-Meteo",
                        "message": "Open-Meteo geocoding service is temporarily rate-limited (HTTP 429)."
                    }
                return {
                    "status": "error",
                    "location": location,
                    "weather": None,
                    "message": f"Geocoding service error: {err.response.status_code}"
                }
            except Exception as err:
                return {
                    "status": "error",
                    "location": location,
                    "weather": None,
                    "message": f"Geocoding network error: {str(err)}"
                }

        latitude = place["latitude"]
        longitude = place["longitude"]
        coord_key = f"{round(latitude, 3)},{round(longitude, 3)}"

        # Step 2: Forecast query
        weather_url = "https://api.open-meteo.com/v1/forecast"
        weather_params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": (
                "temperature_2m,"
                "relative_humidity_2m,"
                "apparent_temperature,"
                "precipitation,"
                "rain,"
                "weather_code,"
                "wind_speed_10m,"
                "wind_direction_10m"
            ),
            "timezone": "auto"
        }

        try:
            weather_resp = await _fetch_with_backoff(client, weather_url, weather_params)

            if weather_resp.status_code == 429:
                # Return last known real weather if available
                if coord_key in _LAST_KNOWN_WEATHER:
                    last = _LAST_KNOWN_WEATHER[coord_key]
                    return {
                        **last,
                        "cached": True,
                        "notice": "Serving recent cached telemetry due to Open-Meteo rate limit (HTTP 429)."
                    }

                return {
                    "status": "rate_limited",
                    "location": place["name"],
                    "country": place.get("country"),
                    "coordinates": {"latitude": latitude, "longitude": longitude},
                    "weather": None,
                    "units": None,
                    "source": "Open-Meteo",
                    "message": "Open-Meteo forecast is temporarily rate-limited (HTTP 429). Incident intelligence remains active."
                }

            weather_resp.raise_for_status()
            weather_data = weather_resp.json()
            current = weather_data.get("current", {})
            units = weather_data.get("current_units", {})

            result = {
                "status": "success",
                "location": place["name"],
                "country": place.get("country"),
                "coordinates": {
                    "latitude": latitude,
                    "longitude": longitude
                },
                "weather": {
                    **current,
                    "description": get_weather_description(current.get("weather_code", -1))
                },
                "units": units,
                "source": "Open-Meteo",
                "observation_time": current.get("time")
            }

            # Update caches
            now = time.time()
            _WEATHER_CACHE[coord_key] = (result, now)
            _LAST_KNOWN_WEATHER[coord_key] = result
            return result

        except httpx.HTTPStatusError as err:
            if err.response.status_code == 429:
                if coord_key in _LAST_KNOWN_WEATHER:
                    return {
                        **_LAST_KNOWN_WEATHER[coord_key],
                        "cached": True,
                        "notice": "Serving recent cached telemetry due to Open-Meteo rate limit (HTTP 429)."
                    }
                return {
                    "status": "rate_limited",
                    "location": place["name"],
                    "country": place.get("country"),
                    "coordinates": {"latitude": latitude, "longitude": longitude},
                    "weather": None,
                    "units": None,
                    "source": "Open-Meteo",
                    "message": "Open-Meteo rate limit reached (HTTP 429). Please retry in a few moments."
                }
            return {
                "status": "error",
                "location": place["name"],
                "weather": None,
                "message": f"Weather service HTTP error: {err.response.status_code}"
            }
        except Exception as err:
            if coord_key in _LAST_KNOWN_WEATHER:
                return {
                    **_LAST_KNOWN_WEATHER[coord_key],
                    "cached": True,
                    "notice": f"Serving cached telemetry due to connection error: {str(err)}"
                }
            return {
                "status": "error",
                "location": place["name"],
                "weather": None,
                "message": f"Weather service network error: {str(err)}"
            }


async def fetch_current_weather(location: str = "Jammu") -> dict[str, Any]:
    """
    Fetch current weather with in-memory caching, request deduplication,
    exponential backoff on HTTP 429, and graceful rate-limit handling.
    Never fabricates values.
    """
    loc_key = (location or "Jammu").strip().lower()

    # Step 0: Check if valid unexpired weather cache exists
    if loc_key in _GEO_CACHE:
        geo = _GEO_CACHE[loc_key]
        coord_key = f"{round(geo['latitude'], 3)},{round(geo['longitude'], 3)}"
        if coord_key in _WEATHER_CACHE:
            cached_data, cached_at = _WEATHER_CACHE[coord_key]
            if time.time() - cached_at < _CACHE_TTL_SECONDS:
                return {**cached_data, "cached": True}

    # Step 1: Request deduplication (coalesce concurrent requests for the same location)
    if loc_key in _IN_FLIGHT_REQUESTS:
        return await _IN_FLIGHT_REQUESTS[loc_key]

    loop = asyncio.get_running_loop()
    future = loop.create_future()
    _IN_FLIGHT_REQUESTS[loc_key] = future

    try:
        result = await _execute_weather_fetch(location)
        if not future.done():
            future.set_result(result)
        return result
    except Exception as exc:
        err_res = {
            "status": "error",
            "location": location,
            "weather": None,
            "message": f"Weather fetch error: {str(exc)}"
        }
        if not future.done():
            future.set_result(err_res)
        return err_res
    finally:
        _IN_FLIGHT_REQUESTS.pop(loc_key, None)
