import uuid
from sqlalchemy import create_engine, types
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import get_settings

# Coerce string UUID values to uuid.UUID so SQLite bind processor doesn't crash on str.hex
_orig_uuid_bind_processor = types.Uuid.bind_processor


def _safe_uuid_bind_processor(self, dialect):
    proc = _orig_uuid_bind_processor(self, dialect)
    if proc is None:
        return None

    def safe_proc(value):
        if value is not None:
            if isinstance(value, str):
                try:
                    value = uuid.UUID(value)
                except Exception:
                    # Non-UUID string passed into UUID column (e.g. demo string 'proj-demo')
                    # Use a zero UUID so SQLite won't crash on value.hex and safely returns no match
                    value = uuid.UUID(int=0)
            elif not isinstance(value, uuid.UUID):
                try:
                    value = uuid.UUID(str(value))
                except Exception:
                    value = uuid.UUID(int=0)
        return proc(value)

    return safe_proc


types.Uuid.bind_processor = _safe_uuid_bind_processor

settings = get_settings()


def _create_db_engine():
    db_url = settings.DATABASE_URL
    if db_url.startswith("sqlite"):
        return create_engine(db_url, connect_args={"check_same_thread": False})
    try:
        eng = create_engine(db_url, pool_pre_ping=True)
        # Verify connection can be established
        with eng.connect():
            pass
        return eng
    except Exception:
        # Fallback to local SQLite file when PostgreSQL is not running
        fallback_url = "sqlite:///./depthwizard.db"
        return create_engine(fallback_url, connect_args={"check_same_thread": False})


engine = _create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
