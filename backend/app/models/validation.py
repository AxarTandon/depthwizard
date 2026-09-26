import uuid

from sqlalchemy import Column, String, Float, ForeignKey, Integer, Uuid as UUID

from app.core.database import Base


class ValidationResult(Base):
    __tablename__ = "validation_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    category = Column(String(20))  # Urban | Sparse | Hilly | Forested
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    correlation = Column(Float, nullable=True)
    sample_count = Column(Integer, default=0)
    status = Column(String(20), default="not_available")  # not_available | available
