import json

import cv2
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.project import Project
from app.models.processing import TerrainResult
from app.models.calibration import CalibrationInfo
from app.models.user import User
from app.schemas.terrain import TerrainResponse, GeoBounds
from app.api.deps import get_current_user
from app.services import analysis

router = APIRouter(prefix="/projects", tags=["terrain"])


def _get_terrain(project_id: str, db: Session, user: User) -> tuple[Project, TerrainResult]:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    terrain = db.query(TerrainResult).filter(TerrainResult.project_id == project.id).first()
    if not terrain:
        raise HTTPException(status_code=404, detail="No terrain result yet - processing not complete")
    return project, terrain


def _load_elevation_grid(terrain: TerrainResult, max_dim: int = 128) -> np.ndarray:
    """Downsamples the stored heightmap PNG to a manageable grid for the
    frontend's Three.js mesh, and rescales 0-255 back to real elevation units."""
    heightmap = cv2.imread(terrain.depth_map_path, cv2.IMREAD_GRAYSCALE)
    h, w = heightmap.shape
    scale = max_dim / max(h, w)
    resized = cv2.resize(heightmap, (max(1, int(w * scale)), max(1, int(h * scale))))
    norm = resized.astype(np.float32) / 255.0
    return norm * (terrain.max_elevation - terrain.min_elevation) + terrain.min_elevation


@router.get("/{project_id}/terrain", response_model=TerrainResponse)
def get_terrain(project_id: str, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    project, terrain = _get_terrain(project_id, db, current_user)
    calibration = db.query(CalibrationInfo).filter(CalibrationInfo.project_id == project.id).first()
    elevation = _load_elevation_grid(terrain)

    bounds = GeoBounds(**json.loads(terrain.bounds_json)) if terrain.bounds_json else None
    return TerrainResponse(
        project_id=project_id, mode=project.mode,
        height_unit="m" if (calibration and calibration.calibrated) else "rel",
        calibrated=bool(calibration and calibration.calibrated),
        width=elevation.shape[1], height=elevation.shape[0],
        elevations=elevation.tolist(),
        crs=terrain.crs, bounds=bounds, resolution=terrain.resolution_m or 1.0,
    )


@router.get("/{project_id}/terrain/metadata")
def get_terrain_metadata(project_id: str, db: Session = Depends(get_db),
                          current_user: User = Depends(get_current_user)):
    project, terrain = _get_terrain(project_id, db, current_user)
    return {
        "crs": terrain.crs, "resolution": terrain.resolution_m,
        "minElevation": terrain.min_elevation, "maxElevation": terrain.max_elevation,
        "bounds": json.loads(terrain.bounds_json) if terrain.bounds_json else None,
    }


@router.get("/{project_id}/terrain/contours")
def get_contours(project_id: str, levels: int = Query(8, ge=2, le=30),
                  db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project, terrain = _get_terrain(project_id, db, current_user)
    elevation = _load_elevation_grid(terrain)
    step = (elevation.max() - elevation.min()) / levels
    contour_levels = [float(elevation.min() + i * step) for i in range(1, levels)]
    return {"levels": contour_levels}


@router.post("/{project_id}/terrain/query")
def query_point(project_id: str, x: int, y: int, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    project, terrain = _get_terrain(project_id, db, current_user)
    elevation = _load_elevation_grid(terrain)
    h, w = elevation.shape
    if not (0 <= x < w and 0 <= y < h):
        raise HTTPException(status_code=400, detail="Point outside terrain bounds")
    slope = analysis.compute_slope_degrees(elevation)
    return {"x": x, "y": y, "elevation": float(elevation[y, x]), "slope": float(slope[y, x])}
