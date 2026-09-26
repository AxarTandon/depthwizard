import uuid

from sqlalchemy import Column, String, Float, ForeignKey, Boolean, Uuid as UUID

from app.core.database import Base


class CalibrationInfo(Base):
    __tablename__ = "calibration_info"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, unique=True)
    method = Column(String(30))  # "srtm" | "gcp" | "none"
    calibrated = Column(Boolean, default=False)
    scale = Column(Float, nullable=True)
    offset = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    mae = Column(Float, nullable=True)
    correlation = Column(Float, nullable=True)
