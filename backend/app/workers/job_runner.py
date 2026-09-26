"""
Background job runner using FastAPI's BackgroundTasks (no extra infra needed
for a hackathon-scale deployment). Swap this for Celery + Redis if you need
multi-worker horizontal scaling later - run_processing_job()'s signature
would not need to change.
"""
import json
import traceback

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models import user, project, processing, calibration, validation, alert, chat  # noqa: F401
from app.models.project import Project
from app.models.processing import ProcessingJob, TerrainResult
from app.models.calibration import CalibrationInfo
from app.models.alert import AlertEvent
from app.services.processing_pipeline import run_pipeline
from app.services import alerts as alert_service
from app.storage.local_storage import project_dir


def run_processing_job(db: Session | None, project_id: str, job_id: str, image_path: str):
    owns_session = False
    if db is None:
        db = SessionLocal()
        owns_session = True

    try:
        _execute_processing_job(db, project_id, job_id, image_path)
    finally:
        if owns_session:
            db.close()


def _execute_processing_job(db: Session, project_id: str, job_id: str, image_path: str):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    project = db.query(Project).filter(Project.id == project_id).first()
    if not job or not project:
        return

    def progress_cb(stage: str, pct: float):
        job.current_stage = stage
        job.progress = pct
        job.status = "processing"
        db.commit()

    try:
        job.status = "preprocessing"
        db.commit()

        output_dir = project_dir(str(project_id), "output")
        result = run_pipeline(image_path, output_dir, progress_cb=progress_cb)

        project.status = "complete"
        project.mode = result["mode"]
        project.terrain_type = result["landscape_type"]
        project.is_georeferenced = result["is_georeferenced"]

        terrain = TerrainResult(
            project_id=project.id,
            depth_map_path=result["depth_map_path"],
            texture_path=result["texture_path"],
            segmentation_path=result["segmentation_path"],
            crs=result["crs"],
            bounds_json=json.dumps(result["bounds"]) if result["bounds"] else None,
            resolution_m=result["resolution"],
            min_elevation=result["metrics"]["minElevation"],
            max_elevation=result["metrics"]["maxElevation"],
            mean_elevation=result["metrics"]["meanElevation"],
            mean_slope=result["metrics"]["meanSlope"],
            max_slope=result["metrics"]["maxSlope"],
            buildings_json=json.dumps(result["buildings"]),
            craters_json=json.dumps(result["craters"]),
            population_json=json.dumps(result["population"]),
            disaster_classification_json=json.dumps(result["disaster_classification"]),
        )
        db.add(terrain)

        calibration = CalibrationInfo(
            project_id=project.id,
            method="srtm" if result["calibrated"] else "none",
            calibrated=result["calibrated"],
            rmse=result["rmse"], mae=result["mae"], correlation=result["correlation"],
        )
        db.add(calibration)

        if project.auto_alert_enabled and result["alert_triggers"]:
            for trigger in result["alert_triggers"]:
                sent = alert_service.send_alert_email(
                    subject=f"Depthwizard alert - {trigger['trigger_type']}",
                    body=trigger["message"],
                )
                db.add(AlertEvent(
                    project_id=project.id,
                    trigger_type=trigger["trigger_type"],
                    message=trigger["message"],
                    sent="sent" if sent else "failed",
                ))

        job.status = "completed"
        job.progress = 100
        db.commit()

    except Exception as e:
        db.rollback()
        job.status = "failed"
        job.error_message = f"{e}\n{traceback.format_exc()}"
        project.status = "failed"
        db.commit()
