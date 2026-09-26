import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.disaster import DisasterClassification
from app.api.deps import get_current_user
from app.api.v1.terrain import _get_terrain

router = APIRouter(prefix="/projects", tags=["unique-features"])


@router.get("/{project_id}/disaster-classification", response_model=DisasterClassification)
def get_disaster_classification(project_id: str, db: Session = Depends(get_db),
                                 current_user: User = Depends(get_current_user)):
    project, terrain = _get_terrain(project_id, db, current_user)
    labels = json.loads(terrain.disaster_classification_json or "[]")
    return DisasterClassification(labels=labels)
