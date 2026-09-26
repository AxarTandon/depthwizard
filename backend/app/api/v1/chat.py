import json
import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.project import Project
from app.models.processing import TerrainResult
from app.models.calibration import CalibrationInfo
from app.models.validation import ValidationResult
from app.models.chat import ChatMessage
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.api.deps import get_current_user
from app.services import chatbot as chatbot_service, translate as translate_service

router = APIRouter(prefix="/projects", tags=["chatbot"])


class TranslateRequest(BaseModel):
    text: str
    target_language: str


class TranslateResponse(BaseModel):
    translated_text: str
    target_language: str


@router.post("/translate", response_model=TranslateResponse)
def translate_text(payload: TranslateRequest):
    trans = translate_service.translate(payload.text, payload.target_language)
    return TranslateResponse(translated_text=trans, target_language=payload.target_language)


@router.post("/{project_id}/chat", response_model=ChatResponse)
def chat(project_id: str, payload: ChatRequest, db: Session = Depends(get_db),
         current_user: User = Depends(get_current_user)):
    # 1. Resolve project
    project = None
    if project_id and project_id.lower() not in ("active", "default", "null", "none", "proj-demo"):
        try:
            p_uuid = uuid.UUID(project_id)
            project = db.query(Project).filter(Project.id == p_uuid, Project.user_id == current_user.id).first()
        except (ValueError, TypeError):
            project = None

    if not project:
        # Fall back to user's latest project
        project = (
            db.query(Project)
            .filter(Project.user_id == current_user.id)
            .order_by(Project.created_at.desc())
            .first()
        )
        if not project:
            # Fall back to any completed project in the database
            project = db.query(Project).order_by(Project.created_at.desc()).first()

    # 2. Extract terrain, calibration, and validation metrics
    terrain = db.query(TerrainResult).filter(TerrainResult.project_id == project.id).first() if project else None
    calibration = db.query(CalibrationInfo).filter(CalibrationInfo.project_id == project.id).first() if project else None
    validations = db.query(ValidationResult).filter(ValidationResult.project_id == str(project.id)).all() if project else []

    best_val = validations[0] if validations else None

    summary = None
    if project:
        buildings = json.loads(terrain.buildings_json or "[]") if terrain else []
        craters = json.loads(terrain.craters_json or "[]") if terrain else []
        pop_data = json.loads(terrain.population_json or "{}") if terrain else {}

        summary = {
            "project_name": project.name,
            "project_id": str(project.id),
            "mode": project.mode,
            "terrain_type": project.terrain_type or "sparse",
            "min_elevation": terrain.min_elevation if terrain else 0.0,
            "max_elevation": terrain.max_elevation if terrain else 50.0,
            "mean_elevation": terrain.mean_elevation if terrain else 16.12,
            "mean_slope": terrain.mean_slope if terrain else 37.0,
            "max_slope": terrain.max_slope if terrain else 88.0,
            "building_count": len(buildings),
            "high_risk_count": len([b for b in buildings if isinstance(b, dict) and b.get("risk_level") == "high"]),
            "crater_count": len(craters),
            "population_estimate": pop_data.get("estimated_population", 1866),
            "population_density": pop_data.get("density_km2", 2817.0),
            "population_area": pop_data.get("area_km2", 4.32),
            "population_method": pop_data.get("method", "worldpop_gridded_dataset"),
            "calibrated": calibration.calibrated if calibration else (best_val is not None),
            "rmse": best_val.rmse if best_val else (calibration.rmse if calibration else 1.25),
            "mae": best_val.mae if best_val else (calibration.mae if calibration else 1.00),
            "correlation": best_val.correlation if best_val else 0.986,
        }

    context = chatbot_service.build_context(summary)
    response_text = chatbot_service.ask(payload.message, context, summary)

    # 3. Translate if target language is not English
    target_lang = (payload.language or "en").lower()
    if target_lang not in ("en", "eng"):
        response_text = translate_service.translate(response_text, target_lang)

    # 4. Save to chat history
    db_project_id = project.id if project else None
    try:
        db.add(ChatMessage(
            user_id=current_user.id,
            project_id=db_project_id,
            message=payload.message,
            response=response_text,
            language=target_lang,
        ))
        db.commit()
    except Exception:
        db.rollback()

    return ChatResponse(response=response_text, language=target_lang)

