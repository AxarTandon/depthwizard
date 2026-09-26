from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.project import Project
from app.models.alert import AlertEvent
from app.models.user import User
from app.schemas.alert import AlertToggleRequest, AlertEventResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/projects", tags=["disaster-management"])


@router.post("/{project_id}/alerts/toggle")
def toggle_alerts(project_id: str, payload: AlertToggleRequest, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.auto_alert_enabled = payload.enabled
    db.commit()
    return {"auto_alert_enabled": project.auto_alert_enabled}


@router.get("/{project_id}/alerts/history", response_model=list[AlertEventResponse])
def alert_history(project_id: str, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    events = db.query(AlertEvent).filter(AlertEvent.project_id == project.id).order_by(
        AlertEvent.created_at.desc()).all()
    return [AlertEventResponse(id=str(e.id), trigger_type=e.trigger_type, message=e.message,
                                sent=e.sent, created_at=e.created_at.isoformat()) for e in events]
