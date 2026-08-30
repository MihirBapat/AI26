"""Job and Labour Market Intelligence API Endpoints.

Provides live Adzuna job postings, salary trends, top employers,
salary histograms, Google Trends fallback, and Maharashtra district heatmaps.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.job import (
    DistrictDemandSummary,
    DistrictHeatmapResponse,
    GeodataResponse,
    JobCategoriesResponse,
    JobSearchResponse,
    RoleMarketDemand,
    SalaryHistogramResponse,
    SalaryHistoryResponse,
    SalaryPredictionRequest,
    SalaryPredictionResponse,
    ServiceStatusResponse,
    TopCompaniesResponse,
    TrendsResponse,
)
from app.services.job_service import job_service

router = APIRouter(prefix="/jobs", tags=["jobs & labour market"])


@router.get("/search", response_model=JobSearchResponse)
async def search_job_postings(
    what: str | None = Query(None, description="Job title or skill keyword (e.g. Electrician, Data Analyst)"),
    where: str | None = Query(None, description="Location/District (e.g. Pune, Mumbai, Nagpur, Nashik)"),
    page: int = Query(1, ge=1, description="Page number"),
    results_per_page: int = Query(20, ge=1, le=50, description="Results per page (max 50)"),
    salary_min: float | None = Query(None, description="Minimum salary filter"),
    full_time: int | None = Query(None, description="1 to filter for full-time only"),
    sort_by: str | None = Query(None, description="Sorting field (e.g. salary, date)"),
):
    """Search live job advertisements across Maharashtra districts via Adzuna."""
    return await job_service.search_jobs(
        what=what,
        where=where,
        page=page,
        results_per_page=results_per_page,
        salary_min=salary_min,
        full_time=full_time,
        sort_by=sort_by,
    )


@router.get("/top-companies", response_model=TopCompaniesResponse)
async def get_top_companies_leaderboard(
    what: str | None = Query(None, description="Job role or skill (e.g. CNC Operator, Electrician)"),
    where: str | None = Query(None, description="District or city (e.g. Pune, Mumbai, Nagpur)"),
):
    """Leaderboard of the top 5 hiring employers for a role & district."""
    return await job_service.get_top_companies(what=what, where=where)


@router.get("/salary/history", response_model=SalaryHistoryResponse)
async def get_salary_trend_history(
    district: str | None = Query(None, description="District name or Maharashtra"),
    category: str | None = Query(None, description="Adzuna category tag (e.g. it-jobs, engineering-jobs)"),
    what: str | None = Query(None, description="Role keyword"),
):
    """Monthly average salary trend line over time."""
    return await job_service.get_salary_history(district_or_state=district, category=category, what=what)


@router.get("/salary/histogram", response_model=SalaryHistogramResponse)
async def get_salary_histogram_distribution(
    what: str | None = Query(None, description="Job role or skill (e.g. Welder, Software Engineer)"),
    district: str | None = Query(None, description="Target district"),
):
    """Salary distribution histogram across compensation bands."""
    return await job_service.get_salary_histogram(what=what, district=district)


@router.post("/salary/predict", response_model=SalaryPredictionResponse)
async def predict_role_salary(payload: SalaryPredictionRequest):
    """Adzuna Jobsworth salary predictor based on job role and requirements."""
    return await job_service.predict_salary(
        title=payload.title,
        description=payload.description,
        district=payload.district,
    )


@router.get("/categories", response_model=JobCategoriesResponse)
async def get_job_categories_taxonomy():
    """Adzuna standard job categories taxonomy."""
    return await job_service.get_categories()


@router.get("/geodata", response_model=GeodataResponse)
async def get_geodata_drilldown(
    location0: str = Query("India", description="Country level"),
    location1: str | None = Query("Maharashtra", description="State level"),
    location2: str | None = Query(None, description="District level"),
    category: str | None = Query(None, description="Category filter"),
):
    """Geodata regional counts for verifying district hierarchy depth."""
    locations = [location0]
    if location1:
        locations.append(location1)
    if location2:
        locations.append(location2)
    return await job_service.get_geodata(locations=locations, category=category)


@router.get("/districts/demand", response_model=DistrictDemandSummary)
async def get_district_demand_summary(
    district: str = Query("Pune", description="District name in Maharashtra"),
    sector: str | None = Query(None, description="Optional sector filter (e.g. IT-ITeS, Healthcare)"),
    domain: str | None = Query(None, description="Optional domain / specialization filter"),
    role: str | None = Query(None, description="Optional role/skill to filter demand by"),
):
    """District-level labor demand overview with active postings, salary, and top hiring employers."""
    return await job_service.get_district_demand_summary(district=district, sector=sector, domain=domain, role=role)


@router.get("/districts/heatmap", response_model=DistrictHeatmapResponse)
async def get_maharashtra_district_heatmap(
    sector: str | None = Query(None, description="Optional sector filter (e.g. IT, Automotive, Healthcare)"),
):
    """Statewide Maharashtra district skill and job demand heatmap (all 36 districts)."""
    return await job_service.get_maharashtra_district_heatmap(sector_filter=sector)


@router.get("/role-demand", response_model=RoleMarketDemand)
async def get_role_demand_analysis(
    role: str = Query("Electrician", description="Target role name (e.g. Electrician, Data Analyst, Welder)"),
    district: str | None = Query("Pune", description="District name (e.g. Pune, Mumbai, Nagpur)"),
    db: Session = Depends(get_db),
):
    """Comprehensive market intelligence for a role, connecting live vacancies with matching Skill India Digital courses."""
    return await job_service.get_role_demand_analysis(role_name=role, district=district, db=db)


@router.get("/trends", response_model=TrendsResponse)
async def get_google_trends_interest(
    keyword: str = Query("electrician jobs", description="Search query / skill keyword"),
    geo: str = Query("IN-MH", description="Geo code (IN-MH for Maharashtra)"),
):
    """Google Trends search interest over time and city ranking (used as fallback or bonus signal)."""
    return await job_service.get_trends_fallback(keyword=keyword, geo=geo)


@router.get("/status", response_model=ServiceStatusResponse)
async def get_service_health_status():
    """Check connectivity and credentials status for Adzuna API, Redis, and pytrends."""
    return await job_service.get_service_status()
