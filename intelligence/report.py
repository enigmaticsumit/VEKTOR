
import asyncio

from news import fetch_disaster_news
from weather import fetch_current_weather
from vision import analyze_disaster_image


async def generate_intelligence_report(
    location: str = "Jammu",
    image_bytes: bytes = None,
    mime_type: str = None
):
    # Fetch news and weather simultaneously
    news_task = fetch_disaster_news(location, 7)
    weather_task = fetch_current_weather(location)

    news_result, weather_result = await asyncio.gather(
        news_task,
        weather_task,
        return_exceptions=True
    )

    # Analyse image if one is provided
    image_result = None

    if image_bytes and mime_type:
        try:
            image_result = await analyze_disaster_image(
                image_bytes,
                mime_type
            )
        except Exception as error:
            image_result = {
                "status": "error",
                "message": str(error)
            }

    return {
        "project": "VEKTOR",
        "location": location,
        "news": (
            news_result if not isinstance(news_result, Exception)
            else {"status": "error", "message": str(news_result)}
        ),
        "weather": (
            weather_result if not isinstance(weather_result, Exception)
            else {"status": "error", "message": str(weather_result)}
        ),
        "image_analysis": image_result
    }
