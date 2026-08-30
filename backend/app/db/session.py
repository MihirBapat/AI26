"""Database engine, session factory, and FastAPI dependency."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

db_url = settings.DATABASE_URL
engine_kwargs = {"echo": settings.DEBUG}

if db_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs.update({
        "pool_size": 5,
        "max_overflow": 10,
        "pool_pre_ping": True,
    })

try:
    engine = create_engine(db_url, **engine_kwargs)
    with engine.connect() as conn:
        pass
except Exception as e:
    print(f"[WARN] Could not connect to primary database ({db_url}): {e}")
    print("       Falling back to local SQLite database ('sqlite:///./skill_platform.db') for seamless operation.")
    db_url = "sqlite:///./skill_platform.db"
    engine_kwargs = {"echo": settings.DEBUG, "connect_args": {"check_same_thread": False}}
    engine = create_engine(db_url, **engine_kwargs)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)




def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a DB session and ensures cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
