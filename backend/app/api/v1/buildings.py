import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.building import BuildingDamage
from app.api.deps import get_current_user
from app.api.v1.terrain import _get_terrain

router = APIRouter(prefix="/projects", tags=["disaster-management"])


@router.get("/{project_id}/buildings", response_model=list[BuildingDamage])
def get_buildings(project_id: str, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    project, terrain = _get_terrain(project_id, db, current_user)
    return json.loads(terrain.buildings_json or "[]")
