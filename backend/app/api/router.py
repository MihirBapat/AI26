"""Central API router — aggregates all sub-routers."""

from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.courses import router as courses_router
from app.api.routes.lookups import router as lookups_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(courses_router)
api_router.include_router(lookups_router)

