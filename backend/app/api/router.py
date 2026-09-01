"""Central API router — aggregates all sub-routers."""

from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.courses import router as courses_router
from app.api.routes.employer import router as employer_router
from app.api.routes.jobs import router as jobs_router
from app.api.routes.lookups import router as lookups_router
from app.api.routes.candidate import router as candidate_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(employer_router)
api_router.include_router(courses_router)
api_router.include_router(lookups_router)
api_router.include_router(jobs_router)
api_router.include_router(candidate_router)
