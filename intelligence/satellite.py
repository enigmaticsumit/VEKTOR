"""
VEKTOR Disaster Intelligence — Copernicus Sentinel-2 Satellite Module

Handles OAuth Client Credentials authentication with Copernicus Data Space Ecosystem (CDSE),
queries Sentinel-2 MSI catalogue products intersecting geographical coordinates,
and retrieves high-resolution / quicklook earth observation imagery for multimodal AI inspection.
"""

import os
import time
import base64
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
import httpx

logger = logging.getLogger("vektor.satellite")

TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
CATALOGUE_URL = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"

# In-memory OAuth token cache
_token_cache: Dict[str, Any] = {
    "access_token": None,
    "expires_at": 0.0,
}


async def get_copernicus_token(client: Optional[httpx.AsyncClient] = None) -> str:
    """
    Acquires or returns a cached OAuth Bearer token using CDSE client credentials.
    """
    client_id = os.getenv("COPERNICUS_CLIENT_ID", "").strip()
    client_secret = os.getenv("COPERNICUS_CLIENT_SECRET", "").strip()

    if not client_id or not client_secret:
        raise ValueError(
            "Copernicus credentials are not configured. Please set COPERNICUS_CLIENT_ID and COPERNICUS_CLIENT_SECRET."
        )

    now = time.time()
    # Reuse valid token if more than 60 seconds remain before expiration
    if _token_cache.get("access_token") and now < (_token_cache.get("expires_at", 0) - 60):
        return _token_cache["access_token"]

    data = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    should_close = False
    if client is None:
        client = httpx.AsyncClient(timeout=20.0)
        should_close = True

    try:
        response = await client.post(TOKEN_URL, data=data, headers=headers)
        if response.status_code != 200:
            error_body = response.text[:300]
            logger.error(f"Copernicus OAuth failed (HTTP {response.status_code}): {error_body}")
            raise RuntimeError(f"Copernicus authentication failed (HTTP {response.status_code}): {error_body}")

        token_data = response.json()
        token = token_data.get("access_token")
        if not token:
            raise RuntimeError("OAuth response did not include 'access_token'.")

        expires_in = token_data.get("expires_in", 1800)
        _token_cache["access_token"] = token
        _token_cache["expires_at"] = now + float(expires_in)
        return token
    finally:
        if should_close:
            await client.aclose()


async def fetch_latest_sentinel2(
    latitude: float,
    longitude: float,
    days: int = 30,
    max_cloud_cover: float = 100.0,
) -> Dict[str, Any]:
    """
    Finds the latest available Sentinel-2 imagery for the given coordinate point,
    fetches its quicklook preview image, and returns metadata and base64 preview.
    """
    if not (-90.0 <= latitude <= 90.0) or not (-180.0 <= longitude <= 180.0):
        raise ValueError(f"Invalid coordinates: latitude={latitude}, longitude={longitude}")

    days = max(1, min(days, 180))

    now = datetime.now(timezone.utc)
    start_date = (now - timedelta(days=days)).strftime("%Y-%m-%dT00:00:00.000Z")
    end_date = now.strftime("%Y-%m-%dT23:59:59.999Z")

    async with httpx.AsyncClient(timeout=30.0) as client:
        token = await get_copernicus_token(client)
        auth_headers = {"Authorization": f"Bearer {token}"}

        # Spatial intersection filter on WGS84 point
        filter_query = (
            f"Collection/Name eq 'SENTINEL-2' and "
            f"ContentDate/Start gt {start_date} and "
            f"ContentDate/Start lt {end_date} and "
            f"OData.CSC.Intersects(area=geography'SRID=4326;POINT({longitude} {latitude})')"
        )

        query_params = [
            ("$filter", filter_query),
            ("$orderby", "ContentDate/Start desc"),
            ("$top", "10"),
            ("$expand", "Assets"),
            ("$expand", "Attributes"),
        ]

        try:
            catalogue_res = await client.get(CATALOGUE_URL, params=query_params)
        except httpx.RequestError as exc:
            logger.error(f"CDSE catalogue request error: {exc}")
            raise RuntimeError(f"Copernicus Data Space catalogue is unreachable: {str(exc)}")

        if catalogue_res.status_code != 200:
            error_body = catalogue_res.text[:300]
            logger.error(f"CDSE catalogue error HTTP {catalogue_res.status_code}: {error_body}")
            raise RuntimeError(f"CDSE catalogue query failed (HTTP {catalogue_res.status_code}): {error_body}")

        products = catalogue_res.json().get("value", [])
        if not products:
            return {
                "status": "no_data",
                "message": f"No Sentinel-2 imagery acquired for ({latitude:.4f}, {longitude:.4f}) in the past {days} days.",
                "coordinates": {"latitude": latitude, "longitude": longitude},
                "days_searched": days,
                "product": None,
            }

        # Select the best product (matching cloud cover preference or most recent)
        selected_product = None
        selected_cloud = None
        selected_asset = None

        for p in products:
            cloud_val = None
            for attr in p.get("Attributes", []):
                if attr.get("Name") == "cloudCover":
                    try:
                        cloud_val = float(attr.get("Value", 100))
                    except (ValueError, TypeError):
                        cloud_val = None
                    break

            # Find Quicklook asset
            assets = p.get("Assets", [])
            ql = next((a for a in assets if (a.get("Type") or "").upper() == "QUICKLOOK"), None)
            if not ql:
                continue

            if cloud_val is not None and cloud_val <= max_cloud_cover:
                selected_product = p
                selected_cloud = cloud_val
                selected_asset = ql
                break
            elif selected_product is None:
                # Keep as fallback even if cloud cover exceeds threshold
                selected_product = p
                selected_cloud = cloud_val
                selected_asset = ql

        if not selected_product or not selected_asset:
            return {
                "status": "no_data",
                "message": f"Sentinel-2 products found for ({latitude:.4f}, {longitude:.4f}), but none had an accessible quicklook preview.",
                "coordinates": {"latitude": latitude, "longitude": longitude},
                "days_searched": days,
                "product": None,
            }

        asset_id = selected_asset.get("Id")
        download_url = (
            selected_asset.get("DownloadLink")
            or f"https://catalogue.dataspace.copernicus.eu/odata/v1/Assets({asset_id})/$value"
        )

        # Download preview image bytes
        try:
            img_res = await client.get(download_url, headers=auth_headers, follow_redirects=True)
            if img_res.status_code != 200 or not img_res.content:
                raise RuntimeError(f"Unable to download asset preview (HTTP {img_res.status_code})")
        except httpx.RequestError as exc:
            logger.error(f"Asset preview download failed: {exc}")
            raise RuntimeError(f"Failed to download Sentinel-2 image preview: {str(exc)}")

        b64_image = base64.b64encode(img_res.content).decode("utf-8")
        prod_id = selected_product.get("Id")
        prod_name = selected_product.get("Name", "SENTINEL-2")
        acq_date = selected_product.get("ContentDate", {}).get("Start") or selected_product.get("OriginDate")

        return {
            "status": "success",
            "coordinates": {"latitude": latitude, "longitude": longitude},
            "product_id": prod_id,
            "product_name": prod_name,
            "acquisition_date": acq_date,
            "cloud_cover": round(selected_cloud, 2) if selected_cloud is not None else None,
            "asset_id": asset_id,
            "image_url": f"/satellite/image/{asset_id}",
            "preview_base64": f"data:image/jpeg;base64,{b64_image}",
            "image_size_bytes": len(img_res.content),
            "collection": "SENTINEL-2",
            "source": "Copernicus Data Space Ecosystem (ESA Sentinel-2)",
        }


async def get_satellite_asset_bytes(asset_id: str) -> bytes:
    """
    Fetches raw image bytes for a Copernicus asset ID.
    """
    if not asset_id:
        raise ValueError("asset_id is required")

    asset_url = f"https://catalogue.dataspace.copernicus.eu/odata/v1/Assets({asset_id})/$value"

    async with httpx.AsyncClient(timeout=25.0) as client:
        token = await get_copernicus_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        res = await client.get(asset_url, headers=headers, follow_redirects=True)
        if res.status_code != 200:
            raise RuntimeError(f"Asset download failed (HTTP {res.status_code})")
        return res.content
