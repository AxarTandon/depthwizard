import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.craters import CraterAnomaly
from app.api.deps import get_current_user
from app.api.v1.terrain import _get_terrain

router = APIRouter(prefix="/projects", tags=["disaster-management"])


@router.get("/{project_id}/craters", response_model=list[CraterAnomaly])
def get_craters(project_id: str, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    project, terrain = _get_terrain(project_id, db, current_user)
    return json.loads(terrain.craters_json or "[]")
