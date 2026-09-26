"""
Open Government Data (OGD) Platform India - the real, self-serve Government
of India data API (api.data.gov.in), used here as the "Indian open-data"
counterpart to OpenTopography.

Unlike API Setu (which mostly gates access behind registered government
departments), this one works the same way as the Hugging Face / OpenTopography
keys already in this project: sign up free at https://data.gov.in, grab your
personal API key from your profile page, done.

One thing to know: not every dataset listed on data.gov.in has a *live* REST
API - many are file-only downloads and show "Request API" instead of an
"API" button on their resource page. So this client is intentionally generic
(works with any resource_id) rather than hardcoded to one guessed dataset -
pick any dataset whose page shows a working "API" button (disaster
management, rainfall, flood, and agriculture datasets are good starting
points for this project) and copy its Resource ID into OPENDATA_GOV_IN_RESOURCE_ID.

Docs / example: https://api.data.gov.in/resource/{resource_id}?api-key=...&format=json
"""
import requests

from app.core.config import get_settings

settings = get_settings()

BASE_URL = "https://api.data.gov.in/resource"


def is_available() -> bool:
    return bool(settings.OPENDATA_GOV_IN_API_KEY and settings.OPENDATA_GOV_IN_RESOURCE_ID)


def fetch_records(filters: dict[str, str] | None = None, limit: int = 10, offset: int = 0) -> dict:
    """Fetch records from the configured data.gov.in resource.

    `filters` maps a field name to an exact-match value, following the OGD
    API's own `filters[field]=value` query convention (e.g.
    {"state": "Uttar Pradesh"}).
    """
    if not is_available():
        return {
            "error": (
                "data.gov.in isn't configured - set OPENDATA_GOV_IN_API_KEY "
                "(free, from your data.gov.in profile) and OPENDATA_GOV_IN_RESOURCE_ID "
                "(pick any dataset on data.gov.in whose page shows a live 'API' button) "
                "in backend/.env."
            )
        }

    params = {
        "api-key": settings.OPENDATA_GOV_IN_API_KEY,
        "format": "json",
        "limit": limit,
        "offset": offset,
    }
    for field, value in (filters or {}).items():
        params[f"filters[{field}]"] = value

    url = f"{BASE_URL}/{settings.OPENDATA_GOV_IN_RESOURCE_ID}"
    try:
        resp = requests.get(url, params=params, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        return {
            "source": data.get("title", "data.gov.in"),
            "fields": data.get("field", []),
            "records": data.get("records", []),
            "total": data.get("total"),
        }
    except Exception as e:
        return {"error": f"data.gov.in request failed: {e}"}
