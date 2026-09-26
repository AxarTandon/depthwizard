import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Uuid as UUID

from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(160), nullable=False)
    status = Column(String(20), default="queued")  # queued|processing|complete|failed
    mode = Column(String(10), default="rDSM")  # rDSM | DSM
    terrain_type = Column(String(30), nullable=True)  # urban|sparse|hilly|forested
    is_georeferenced = Column(Boolean, default=False)
    input_filename = Column(String(255), nullable=True)
    input_path = Column(String(500), nullable=True)
    auto_alert_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
