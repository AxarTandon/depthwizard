"""
Tool functions the LangGraph agents call. Each wraps an existing service
module so the agent layer never duplicates pipeline logic - it only
orchestrates and narrates it.
"""
import json

from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.processing import TerrainResult
from app.models.calibration import CalibrationInfo
from app.services import flood as flood_service
from app.services import opendata_gov


def get_project_context(db: Session, project_id: str) -> dict:
    project = db.query(Project).filter(Project.id == project_id).first()
    terrain = db.query(TerrainResult).filter(TerrainResult.project_id == project_id).first()
    calibration = db.query(CalibrationInfo).filter(CalibrationInfo.project_id == project_id).first()
    if not project or not terrain:
        return {"error": "No completed analysis found for this project."}

    return {
        "landscape_type": project.terrain_type,
        "mode": project.mode,
        "calibrated": bool(calibration and calibration.calibrated),
        "rmse": calibration.rmse if calibration else None,
        "mae": calibration.mae if calibration else None,
        "buildings": json.loads(terrain.buildings_json or "[]"),
        "craters": json.loads(terrain.craters_json or "[]"),
        "population": json.loads(terrain.population_json or "{}"),
        "disaster_classification": json.loads(terrain.disaster_classification_json or "[]"),
        "min_elevation": terrain.min_elevation,
        "max_elevation": terrain.max_elevation,
    }


def simulate_flood(db: Session, project_id: str, water_level: float) -> dict:
    """Tool: run a flood simulation at a given water level for a project."""
    terrain = db.query(TerrainResult).filter(TerrainResult.project_id == project_id).first()
    if not terrain:
        return {"error": "No terrain available."}
    import cv2
    import numpy as np
    heightmap = cv2.imread(terrain.depth_map_path, cv2.IMREAD_GRAYSCALE)
    norm = heightmap.astype(np.float32) / 255.0
    elevation = norm * (terrain.max_elevation - terrain.min_elevation) + terrain.min_elevation
    return flood_service.flood_summary(elevation, water_level)


def summarize_risk(context: dict) -> str:
    """Tool: produce a short plain-language risk summary from a project's context."""
    parts = []
    high_risk = [b for b in context.get("buildings", []) if b.get("risk_level") == "high"]
    if high_risk:
        parts.append(f"{len(high_risk)} building(s) at high collapse risk")
    craters = context.get("craters", [])
    if craters:
        parts.append(f"{len(craters)} crater/impact anomaly(ies) detected")
    pop = context.get("population", {})
    if pop.get("estimated_population"):
        parts.append(f"~{pop['estimated_population']} people estimated in the scene")
    return "; ".join(parts) if parts else "No elevated risk signals in this scene."


def fetch_open_data(filters: dict[str, str] | None = None, limit: int = 5) -> dict:
    """Tool: pull supplementary official records from data.gov.in (Government
    of India Open Data Platform) - e.g. official rainfall/disaster stats for
    the region being analyzed, once OPENDATA_GOV_IN_RESOURCE_ID is configured."""
    return opendata_gov.fetch_records(filters=filters, limit=limit)
