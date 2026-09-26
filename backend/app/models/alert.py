import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Uuid as UUID

from app.core.database import Base


class AlertEvent(Base):
    __tablename__ = "alert_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    trigger_type = Column(String(30))  # flood | building_collapse | crater
    message = Column(Text)
    sent = Column(String(10), default="pending")  # pending | sent | failed
    created_at = Column(DateTime, default=datetime.utcnow)
