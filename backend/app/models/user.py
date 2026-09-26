import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Uuid as UUID

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(120), nullable=False)
    email = Column(String(160), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    organization = Column(String(160), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
