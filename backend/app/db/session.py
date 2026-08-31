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
    from pathlib import Path
    backend_dir = Path(__file__).resolve().parent.parent.parent
    db_file = (backend_dir / "skill_platform.db").as_posix()
    db_url = f"sqlite:///{db_file}"
    print(f"[WARN] Could not connect to primary database: {e}")
    print(f"       Falling back to local SQLite database ('{db_url}') for seamless operation.")
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
