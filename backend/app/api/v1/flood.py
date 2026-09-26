from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.flood import FloodSummary
from app.api.deps import get_current_user
from app.api.v1.terrain import _get_terrain, _load_elevation_grid
from app.services import flood as flood_service

router = APIRouter(prefix="/projects", tags=["disaster-management"])


@router.get("/{project_id}/flood", response_model=FloodSummary)
def get_flood(project_id: str, water_level: float = Query(...), db: Session = Depends(get_db),
              current_user: User = Depends(get_current_user)):
    project, terrain = _get_terrain(project_id, db, current_user)
    elevation = _load_elevation_grid(terrain)
    summary = flood_service.flood_summary(elevation, water_level)
    return FloodSummary(**summary)
