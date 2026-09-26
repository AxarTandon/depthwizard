import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Text, Uuid as UUID

from app.core.database import Base


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    status = Column(String(20), default="queued")
    current_stage = Column(String(30), nullable=True)
    progress = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class TerrainResult(Base):
    __tablename__ = "terrain_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, unique=True)
    depth_map_path = Column(String(500))
    texture_path = Column(String(500))
    segmentation_path = Column(String(500))
    crs = Column(String(50), nullable=True)
    bounds_json = Column(Text, nullable=True)
    resolution_m = Column(Float, nullable=True)
    min_elevation = Column(Float, nullable=True)
    max_elevation = Column(Float, nullable=True)
    mean_elevation = Column(Float, nullable=True)
    mean_slope = Column(Float, nullable=True)
    max_slope = Column(Float, nullable=True)
    buildings_json = Column(Text, nullable=True)
    craters_json = Column(Text, nullable=True)
    population_json = Column(Text, nullable=True)
    disaster_classification_json = Column(Text, nullable=True)
