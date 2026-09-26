from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectSummary, ProjectCreateRequest
from app.api.deps import get_current_user
from app.storage.local_storage import project_dir

router = APIRouter(prefix="/projects", tags=["projects"])


def _to_summary(p: Project) -> ProjectSummary:
    return ProjectSummary(
        id=str(p.id), name=p.name, thumbnailLabel=p.terrain_type or "pending",
        createdAt=p.created_at.isoformat(), status=p.status, mode=p.mode,
        terrainType=p.terrain_type,
    )


@router.post("", response_model=ProjectSummary)
def create_project(payload: ProjectCreateRequest, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    project = Project(user_id=current_user.id, name=payload.name, status="queued")
    db.add(project)
    db.commit()
    db.refresh(project)
    project_dir(str(project.id))
    return _to_summary(project)


@router.get("", response_model=list[ProjectSummary])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    projects = db.query(Project).filter(Project.user_id == current_user.id).order_by(
        Project.created_at.desc()).all()
    return [_to_summary(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectSummary)
def get_project(project_id: str, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return _to_summary(project)


@router.delete("/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"success": True}
