from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.analysis import AnalysisMetrics
from app.api.deps import get_current_user
from app.api.v1.terrain import _get_terrain, _load_elevation_grid
from app.services import analysis as analysis_service

router = APIRouter(prefix="/projects", tags=["analysis"])


@router.get("/{project_id}/analysis", response_model=AnalysisMetrics)
def get_analysis(project_id: str, db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    project, terrain = _get_terrain(project_id, db, current_user)
    elevation = _load_elevation_grid(terrain)
    metrics = analysis_service.compute_metrics(elevation, terrain.resolution_m or 1.0)
    return AnalysisMetrics(**metrics)
