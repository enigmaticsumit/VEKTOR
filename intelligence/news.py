import httpx
import json
from bs4 import BeautifulSoup
from email.utils import parsedate_to_datetime

GDELT_URL = "https://api.gdeltproject.org/api/v2/doc/doc"

async def get_original_publish_time(client, url):
    try:
        response = await client.get(
            url,
            follow_redirects=True,
            timeout=10
        )

        soup = BeautifulSoup(response.text, "html.parser")

        selectors = [
            {"property": "article:published_time"},
            {"name": "datePublished"},
            {"itemprop": "datePublished"}
        ]

        for selector in selectors:
            tag = soup.find("meta", attrs=selector)
            if tag and tag.get("content"):
                return tag["content"]

        for script in soup.find_all(
            "script", type="application/ld+json"
        ):
            try:
                data = json.loads(script.string or script.get_text())
                records = data if isinstance(data, list) else [data]

                for record in records:
                    if isinstance(record, dict):
                        if record.get("datePublished"):
                            return record["datePublished"]
            except (json.JSONDecodeError, TypeError):
                continue

    except Exception:
        pass

    return "Not available"


async def fetch_google_news(client, location, days):
    query = (
        f'"{location}" '
        '(flood OR landslide OR earthquake OR snowfall '
        'OR cloudburst OR disaster OR rainfall)'
    )

    url = "https://news.google.com/rss/search"

    response = await client.get(
        url,
        params={
            "q": query,
            "hl": "en-IN",
            "gl": "IN",
            "ceid": "IN:en"
        },
        timeout=20
    )

    response.raise_for_status()

    soup = BeautifulSoup(response.text, "xml")
    results = []

    for item in soup.find_all("item")[:15]:
        published = item.pubDate.get_text(strip=True) if item.pubDate else None

        try:
            published = parsedate_to_datetime(published).isoformat()
        except (TypeError, ValueError):
            published = "Not available"

        source = item.find("source")

        results.append({
            "title": item.title.get_text(strip=True) if item.title else None,
            "url": item.link.get_text(strip=True) if item.link else None,
            "source": source.get_text(strip=True) if source else "Google News",
            "published_at": published,
            "timestamp_type": "RSS publication date",
            "gdelt_seen_at": None,
            "location": location,
            "provider": "Google News RSS"
        })

    return results


async def fetch_disaster_news(location="Jammu", days=7):

    async with httpx.AsyncClient(
        timeout=25,
        headers={"User-Agent": "VEKTOR/1.0"}
    ) as client:

        try:
            response = await client.get(
                GDELT_URL,
                params={
                    "query": (
                        f'"{location}" AND '
                        '(flood OR landslide OR earthquake OR snowfall '
                        'OR cloudburst OR disaster OR heavy rainfall)'
                    ),
                    "mode": "ArtList",
                    "format": "json",
                    "maxrecords": 15,
                    "sort": "DateDesc",
                    "timespan": f"{days}d"
                }
            )

            response.raise_for_status()

            articles = response.json().get("articles", [])

            if articles:
                results = []

                for article in articles:
                    url = article.get("url")

                    published = (
                        await get_original_publish_time(client, url)
                        if url else "Not available"
                    )

                    results.append({
                        "title": article.get("title"),
                        "url": url,
                        "source": article.get("domain"),
                        "published_at": published,
                        "timestamp_type": "Publisher metadata",
                        "gdelt_seen_at": article.get("seendate"),
                        "location": location,
                        "provider": "GDELT"
                    })

                return {
                    "location": location,
                    "provider": "GDELT",
                    "total_articles": len(results),
                    "articles": results
                }

        except httpx.HTTPStatusError:
            pass

        except httpx.RequestError:
            pass

        # Automatic fallback
        try:
            results = await fetch_google_news(
                client, location, days
            )

            return {
                "location": location,
                "provider": "Google News RSS",
                "total_articles": len(results),
                "articles": results
            }

        except Exception as error:
            return {
                "location": location,
                "provider": None,
                "total_articles": 0,
                "articles": [],
                "error": str(error)
            }