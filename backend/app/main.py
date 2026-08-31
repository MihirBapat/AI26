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

    yield

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
