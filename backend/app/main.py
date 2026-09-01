"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle — startup / shutdown hooks."""
    from app.db.base import Base
    from app.db.session import engine, SessionLocal
    import app.models  # Ensures all models (User, Course, Lookups, Employer, Skill) are registered
    from app.services.skill_service import skill_service

    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            skill_service.seed_foundational_skills(db)
        finally:
            db.close()
    except Exception as e:
        print(f"[WARN] Startup initialization exception: {e}")

    from pathlib import Path
    import os
    import subprocess
    import sys
    import logging

    logger = logging.getLogger("uvicorn.error")
    backend_dir = Path(__file__).resolve().parent.parent
    logger.info("Starting LiveKit Voice Agent worker from %s...", backend_dir)
    
    worker_env = os.environ.copy()
    worker_env["PYTHONPATH"] = str(backend_dir)
    
    worker_process = subprocess.Popen(
        [sys.executable, "-m", "agent.main", "dev"],
        cwd=str(backend_dir),
        env=worker_env
    )

    yield

    logger.info("Shutting down LiveKit Voice Agent worker...")
    if worker_process.poll() is None:
        worker_process.terminate()
        try:
            worker_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            worker_process.kill()

    engine.dispose()



app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Labour Market Intelligence & Skill Alignment Platform — Course Data API",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(api_router)


@app.get("/health", tags=["health"])
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": settings.APP_VERSION}
