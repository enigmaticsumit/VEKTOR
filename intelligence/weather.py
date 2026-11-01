
import httpx

def get_weather_description(code: int):
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


async def fetch_current_weather(location: str = "Jammu"):
    async with httpx.AsyncClient(timeout=20) as client:

        # Find the location's coordinates
        geo_url = "https://geocoding-api.open-meteo.com/v1/search"

        geo_response = await client.get(
            geo_url,
            params={
                "name": location,
                "count": 1,
                "language": "en",
                "format": "json"
            }
        )
        geo_response.raise_for_status()

        geo_data = geo_response.json()
        results = geo_data.get("results", [])

        if not results:
            return {
                "status": "error",
                "message": f"Location not found: {location}"
            }

        place = results[0]
        latitude = place["latitude"]
        longitude = place["longitude"]

        # Fetch current weather
        weather_url = "https://api.open-meteo.com/v1/forecast"

        weather_response = await client.get(
            weather_url,
            params={
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
        )
        weather_response.raise_for_status()

        weather_data = weather_response.json()
        current = weather_data["current"]
        units = weather_data["current_units"]

        return {
            "status": "success",
            "location": place["name"],
            "country": place.get("country"),
            "coordinates": {
                "latitude": latitude,
                "longitude": longitude
            },
            "weather": {
                **current,
                "description": get_weather_description(current["weather_code"])
                },
            "units": units,
            "source": "Open-Meteo",
            "observation_time": current.get("time")
        }
