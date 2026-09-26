import json

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.api.v1.terrain import _get_terrain

router = APIRouter(prefix="/projects", tags=["export"])


@router.get("/{project_id}/export")
def export_summary(project_id: str, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    project, terrain = _get_terrain(project_id, db, current_user)
    return {
        "projectId": project_id, "mode": project.mode,
        "downloads": {
            "dsm": f"/api/v1/projects/{project_id}/export/dsm",
            "metadata": f"/api/v1/projects/{project_id}/export/metadata",
        },
    }


@router.get("/{project_id}/export/dsm")
def export_dsm(project_id: str, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    project, terrain = _get_terrain(project_id, db, current_user)
    return FileResponse(terrain.depth_map_path, filename=f"{project_id}_dsm.png")


@router.get("/{project_id}/export/metadata")
def export_metadata(project_id: str, db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_user)):
    project, terrain = _get_terrain(project_id, db, current_user)
    return {
        "crs": terrain.crs, "resolution": terrain.resolution_m,
        "bounds": json.loads(terrain.bounds_json) if terrain.bounds_json else None,
        "minElevation": terrain.min_elevation, "maxElevation": terrain.max_elevation,
    }
