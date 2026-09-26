from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.services import opendata_gov

router = APIRouter(prefix="/opendata", tags=["unique-features"])


@router.get("/status")
def opendata_status(current_user: User = Depends(get_current_user)):
    return {"configured": opendata_gov.is_available()}


@router.get("/records")
def opendata_records(limit: int = 5, current_user: User = Depends(get_current_user)):
    """Pulls records from the data.gov.in (Government of India Open Data
    Platform) resource configured via OPENDATA_GOV_IN_RESOURCE_ID."""
    return opendata_gov.fetch_records(limit=limit)
