"""Services package."""

from app.services.adzuna_service import AdzunaService, adzuna_service
from app.services.cache_service import CacheService, cache_service
from app.services.job_service import JobService, job_service
from app.services.trends_service import TrendsService, trends_service

__all__ = [
    "CacheService",
    "cache_service",
    "AdzunaService",
    "adzuna_service",
    "TrendsService",
    "trends_service",
    "JobService",
    "job_service",
]
