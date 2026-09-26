import os

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.project import Project
from app.models.processing import ProcessingJob
from app.models.user import User
from app.schemas.processing import ProcessingStatus, ProcessingStage
from app.api.deps import get_current_user
from app.storage.local_storage import project_dir, safe_filename
from app.workers.job_runner import run_processing_job

router = APIRouter(prefix="/projects", tags=["processing"])

ALLOWED_EXT = {"png", "jpg", "jpeg", "tif", "tiff", "h5", "hdf5", "hdf", "he5"}
MAX_UPLOAD_BYTES = 32 * 1024 * 1024
CHUNK_SIZE = 64 * 1024  # 64 KB chunks

STAGE_DEFS = [
    ("upload", "Image upload", "Transferring source imagery and verifying file integrity."),
    ("preprocessing", "Preprocessing", "Normalizing radiometry, correcting artifacts, and tiling the image."),
    ("height_estimation", "Height estimation", "Estimating relative surface height from monocular cues."),
    ("scale_calibration", "Scale calibration", "Aligning relative heights against reference control where available."),
    ("surface_reconstruction", "Surface reconstruction", "Building a continuous elevation surface from estimated heights."),
    ("mesh_generation", "Mesh generation", "Converting the elevation surface into a renderable 3D mesh."),
    ("analysis", "Analysis", "Computing terrain statistics and preparing viewer assets."),
]


def _get_project(project_id: str, db: Session, user: User) -> Project:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/{project_id}/upload")
def upload_image(project_id: str, file: UploadFile = File(...), db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    project = _get_project(project_id, db, current_user)

    filename = safe_filename(file.filename or "upload.png")
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    input_dir = project_dir(str(project.id), "input")
    save_path = os.path.join(input_dir, filename)

    total_bytes = 0
    with open(save_path, "wb") as f:
        while True:
            chunk = file.file.read(CHUNK_SIZE)
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > MAX_UPLOAD_BYTES:
                f.close()
                if os.path.exists(save_path):
                    os.unlink(save_path)
                raise HTTPException(status_code=413, detail="File too large (exceeds 32 MB)")
            f.write(chunk)

    project.input_filename = filename
    project.input_path = save_path
    db.commit()
    return {"projectId": str(project.id), "filename": filename}


@router.post("/{project_id}/process")
def start_processing(project_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    project = _get_project(project_id, db, current_user)
    if not project.input_path:
        raise HTTPException(status_code=400, detail="Upload an image before processing")

    job = ProcessingJob(project_id=project.id, status="queued")
    db.add(job)
    project.status = "processing"
    db.commit()
    db.refresh(job)

    # Background task uses an independent SessionLocal inside run_processing_job
    background_tasks.add_task(run_processing_job, None, str(project.id), str(job.id), project.input_path)
    return {"started": True, "jobId": str(job.id)}


@router.get("/{project_id}/status", response_model=ProcessingStatus)
def get_status(project_id: str, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    project = _get_project(project_id, db, current_user)
    job = db.query(ProcessingJob).filter(ProcessingJob.project_id == project.id).order_by(
        ProcessingJob.started_at.desc()).first()

    if not job:
        stages = [ProcessingStage(id=sid, label=label, description=desc, status="pending", progress=0)
                   for sid, label, desc in STAGE_DEFS]
        return ProcessingStatus(projectId=project_id, stages=stages, overallProgress=0,
                                 currentStageId=None, isComplete=False)

    stages = []
    reached_current = False
    for sid, label, desc in STAGE_DEFS:
        if job.status == "completed":
            status_val, progress = "complete", 100.0
        elif job.status == "failed":
            status_val = "error" if sid == job.current_stage else (
                "complete" if not reached_current else "pending")
            progress = 100.0 if status_val == "complete" else 0.0
        elif sid == job.current_stage:
            status_val, progress = "active", job.progress
            reached_current = True
        elif not reached_current:
            status_val, progress = "complete", 100.0
        else:
            status_val, progress = "pending", 0.0
        stages.append(ProcessingStage(id=sid, label=label, description=desc,
                                       status=status_val, progress=progress))

    overall = sum(s.progress for s in stages) / len(stages)
    return ProcessingStatus(
        projectId=project_id, stages=stages, overallProgress=round(overall, 1),
        currentStageId=job.current_stage if job.status not in ("completed", "failed") else None,
        isComplete=job.status == "completed",
    )
