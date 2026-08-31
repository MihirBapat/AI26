"""Employer Module API Router — Profiles, Jobs, Skills, Validations, Analytics, and Intelligence."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user, require_employer
from app.models.job_posting import JobPosting
from app.models.skill import Skill
from app.models.user import User
from app.schemas.employer import (
    CourseMatchItem,
    EmployerFeedbackCreate,
    EmployerFeedbackResponse,
    EmployerIntelligenceRequest,
    EmployerIntelligenceResponse,
    EmployerOverviewStats,
    EmployerProfileResponse,
    EmployerProfileUpdate,
    EmployerValidationCreate,
    EmployerValidationResponse,
    JobCourseMatchesResponse,
    JobPostingCreate,
    JobPostingResponse,
    JobPostingUpdate,
    JobSkillDetail,
    PaginatedJobPostings,
    SalaryBenchmarkResponse,
    SkillDemandAnalyticsResponse,
    SkillExtractionRequest,
    SkillExtractionResponse,
    SkillGapResponse,
    SkillNormalizeRequest,
    SkillNormalizeResponse,
    SkillRead,
)
from app.services.ai.employer_agent import employer_intelligence_agent
from app.services.employer_analytics_service import employer_analytics_service
from app.services.employer_service import employer_service
from app.services.ingestion_service import ingestion_service
from app.services.skill_gap_service import skill_gap_service
from app.services.skill_service import skill_service

router = APIRouter(prefix="/employer", tags=["employer module"])


# ---------------------------------------------------------------------------
# Employer Profile Endpoints
# ---------------------------------------------------------------------------

@router.get("/profile", response_model=EmployerProfileResponse)
def get_employer_profile(
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    """Retrieve organization profile for authenticated employer."""
    profile = employer_service.get_or_create_profile(db, current_user)
    return EmployerProfileResponse.model_validate(profile)


@router.put("/profile", response_model=EmployerProfileResponse)
def update_employer_profile(
    payload: EmployerProfileUpdate,
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    """Update organization profile for authenticated employer."""
    profile = employer_service.update_profile(db, current_user, payload)
    return EmployerProfileResponse.model_validate(profile)


# ---------------------------------------------------------------------------
# Job Postings Management Endpoints
# ---------------------------------------------------------------------------

def _to_job_response(job: JobPosting) -> JobPostingResponse:
    """Format JobPosting model with mapped skills to response schema."""
    skill_details = []
    for s in job.skills:
        skill_details.append(
            JobSkillDetail(
                id=s.id,
                skill_id=s.skill_id,
                skill_name=s.skill.name if s.skill else "Unknown",
                category=s.skill.category if s.skill else "General",
                requirement_type=s.requirement_type,
                proficiency_level=s.proficiency_level,
                importance_weight=s.importance_weight,
                confidence_score=s.confidence_score,
                extraction_source=s.extraction_source,
            )
        )

    return JobPostingResponse(
        id=job.id,
        employer_id=job.employer_id,
        company_name=job.employer.company_name if job.employer else job.company_name_raw,
        source=job.source,
        source_job_id=job.source_job_id,
        title=job.title,
        normalized_title=job.normalized_title,
        description=job.description,
        role_category=job.role_category,
        industry=job.industry,
        sector_id=job.sector_id,
        location=job.location,
        district=job.district,
        state=job.state,
        employment_type=job.employment_type,
        work_mode=job.work_mode,
        min_experience_years=job.min_experience_years,
        max_experience_years=job.max_experience_years,
        min_salary=float(job.min_salary) if job.min_salary else None,
        max_salary=float(job.max_salary) if job.max_salary else None,
        currency=job.currency,
        status=job.status,
        posted_at=job.posted_at,
        expires_at=job.expires_at,
        created_at=job.created_at,
        updated_at=job.updated_at,
        skills=skill_details,
    )


@router.post("/jobs", response_model=JobPostingResponse, status_code=status.HTTP_201_CREATED)
def create_job_posting(
    payload: JobPostingCreate,
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    """Create a new job posting with automatic skill extraction from title & description."""
    job = employer_service.create_job(db, current_user, payload)
    return _to_job_response(job)


@router.get("/jobs", response_model=PaginatedJobPostings)
def list_employer_jobs(
    status_filter: str | None = Query(None, description="'draft', 'published', 'paused', 'closed'"),
    district: str | None = Query(None, description="District filter (e.g. Pune, Mumbai)"),
    search: str | None = Query(None, description="Search keyword in title or description"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    """List authenticated employer's job postings with pagination and filters."""
    return employer_service.list_employer_jobs(
        db=db,
        current_user=current_user,
        status_filter=status_filter,
        district_filter=district,
        search=search,
        page=page,
        size=size,
    )


@router.get("/jobs/{job_id}", response_model=JobPostingResponse)
def get_job_posting(
    job_id: int,
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    """Fetch job details with eager-loaded required skills. Enforces strict employer ownership."""
    job = employer_service.get_job_by_id(db, job_id, current_user)
    return _to_job_response(job)


@router.put("/jobs/{job_id}", response_model=JobPostingResponse)
def update_job_posting(
    job_id: int,
    payload: JobPostingUpdate,
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    """Update job posting details and required skills. Enforces employer ownership."""
    job = employer_service.update_job(db, job_id, current_user, payload)
    return _to_job_response(job)


@router.delete("/jobs/{job_id}")
def delete_job_posting(
    job_id: int,
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    """Delete job posting. Enforces employer ownership."""
    return employer_service.delete_job(db, job_id, current_user)


@router.post("/jobs/{job_id}/publish", response_model=JobPostingResponse)
def publish_job_posting(
    job_id: int,
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    """Publish a draft job posting to the live state intelligence feed."""
    job = employer_service.set_job_status(db, job_id, current_user, "published")
    return _to_job_response(job)


@router.post("/jobs/{job_id}/close", response_model=JobPostingResponse)
def close_job_posting(
    job_id: int,
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    """Mark a published job posting as closed."""
    job = employer_service.set_job_status(db, job_id, current_user, "closed")
    return _to_job_response(job)


@router.post("/jobs/extract-skills", response_model=SkillExtractionResponse)
def extract_skills_ad_hoc(
    payload: SkillExtractionRequest,
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    """Ad-hoc extraction of canonical skills from raw job text without creating a job record."""
    extracted = skill_service.extract_skills_from_text(
        db, payload.title, payload.description, payload.additional_requirements
    )
    return SkillExtractionResponse(
        role_category=payload.title,
        extracted_skills=extracted,
        total_skills_found=len(extracted),
    )


# ---------------------------------------------------------------------------
# Canonical Skills Endpoints
# ---------------------------------------------------------------------------

@router.get("/skills", response_model=list[SkillRead])
def list_canonical_skills(
    category: str | None = Query(None, description="Category filter (e.g. 'Programming Language', 'Database', 'Manufacturing')"),
    search: str | None = Query(None, description="Search skill name"),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    """List canonical skills available in the statewide skill taxonomy."""
    query = select(Skill)
    if category:
        query = query.where(Skill.category == category)
    if search:
        query = query.where(Skill.name.ilike(f"%{search}%"))
    skills = db.execute(query.order_by(Skill.name).limit(limit)).scalars().all()
    return [SkillRead.model_validate(s) for s in skills]


@router.post("/skills/normalize", response_model=SkillNormalizeResponse)
def normalize_skill_name(
    payload: SkillNormalizeRequest,
    db: Session = Depends(get_db),
):
    """Normalize any raw skill variation (e.g. 'Postgres' -> 'PostgreSQL') to its canonical form."""
    return skill_service.normalize_skill(db, payload.raw_skill)


# ---------------------------------------------------------------------------
# Skill Gap Engine & Course Relevance Endpoints
# ---------------------------------------------------------------------------

@router.get("/jobs/{job_id}/skill-gap", response_model=SkillGapResponse)
def get_job_skill_gap_analysis(
    job_id: int,
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    """Calculate exact skill gap for an employer's job against Skill India Digital course offerings."""
    job = employer_service.get_job_by_id(db, job_id, current_user)
    return skill_gap_service.analyze_job_skill_gap(db, job)


@router.get("/jobs/{job_id}/course-matches", response_model=JobCourseMatchesResponse)
def get_matching_courses_for_job(
    job_id: int,
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    """Find and rank existing Skill India Digital courses according to percentage of job skills taught."""
    job = employer_service.get_job_by_id(db, job_id, current_user)
    return skill_gap_service.find_matching_courses_for_job(db, job, limit=limit)


# ---------------------------------------------------------------------------
# Employer Course Validations & Feedback Endpoints
# ---------------------------------------------------------------------------

@router.post("/validations", response_model=EmployerValidationResponse, status_code=status.HTTP_201_CREATED)
def submit_course_validation(
    payload: EmployerValidationCreate,
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    """Submit employer industry validation on whether a course adequately prepares candidates."""
    val = employer_service.submit_course_validation(db, current_user, payload)
    return EmployerValidationResponse(
        id=val.id,
        employer_id=val.employer_id,
        course_id=val.course_id,
        course_title=val.course.title if val.course else None,
        skill_id=val.skill_id,
        skill_name=val.skill.name if val.skill else None,
        validation_status=val.validation_status,
        rating=val.rating,
        feedback_text=val.feedback_text,
        curriculum_recommendation=val.curriculum_recommendation,
        industry_relevance_score=val.industry_relevance_score,
        created_at=val.created_at,
    )


@router.get("/validations", response_model=list[EmployerValidationResponse])
def list_course_validations(
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    """List validations submitted by authenticated employer."""
    rows = employer_service.list_validations(db, current_user)
    return [
        EmployerValidationResponse(
            id=v.id,
            employer_id=v.employer_id,
            course_id=v.course_id,
            course_title=v.course.title if v.course else None,
            skill_id=v.skill_id,
            skill_name=v.skill.name if v.skill else None,
            validation_status=v.validation_status,
            rating=v.rating,
            feedback_text=v.feedback_text,
            curriculum_recommendation=v.curriculum_recommendation,
            industry_relevance_score=v.industry_relevance_score,
            created_at=v.created_at,
        )
        for v in rows
    ]


@router.post("/feedback", response_model=EmployerFeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_employer_feedback(
    payload: EmployerFeedbackCreate,
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    """Submit structured feedback to Government / Training Providers."""
    fb = employer_service.submit_feedback(db, current_user, payload)
    return EmployerFeedbackResponse(
        id=fb.id,
        employer_id=fb.employer_id,
        company_name=fb.employer.company_name if fb.employer else None,
        feedback_category=fb.feedback_category,
        subject=fb.subject,
        district=fb.district,
        sector_id=fb.sector_id,
        detailed_comments=fb.detailed_comments,
        proposed_interventions=fb.proposed_interventions,
        urgency_level=fb.urgency_level,
        created_at=fb.created_at,
    )


@router.get("/feedback", response_model=list[EmployerFeedbackResponse])
def list_employer_feedback(
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    """List feedback submissions from authenticated employer."""
    rows = employer_service.list_feedbacks(db, current_user)
    return [
        EmployerFeedbackResponse(
            id=f.id,
            employer_id=f.employer_id,
            company_name=f.employer.company_name if f.employer else None,
            feedback_category=f.feedback_category,
            subject=f.subject,
            district=f.district,
            sector_id=f.sector_id,
            detailed_comments=f.detailed_comments,
            proposed_interventions=f.proposed_interventions,
            urgency_level=f.urgency_level,
            created_at=f.created_at,
        )
        for f in rows
    ]


# ---------------------------------------------------------------------------
# Employer Analytics & Intelligence Endpoints
# ---------------------------------------------------------------------------

@router.get("/analytics/overview", response_model=EmployerOverviewStats)
def get_employer_overview_analytics(
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    """Retrieve summary analytics and top skills in employer's active postings."""
    return employer_analytics_service.get_employer_overview(db, current_user)


@router.get("/analytics/skill-demand", response_model=SkillDemandAnalyticsResponse)
def get_market_skill_demand(
    district: str | None = Query(None, description="Filter demand by district (e.g. Pune, Mumbai)"),
    sector_id: int | None = Query(None, description="Filter demand by industry sector ID"),
    limit: int = Query(15, ge=1, le=50),
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    """Calculate dynamic skill demand rankings, postings count, and demand score from real database records."""
    return employer_analytics_service.get_skill_demand_analytics(
        db, district=district, sector_id=sector_id, limit=limit
    )


@router.get("/analytics/salary-benchmarks", response_model=SalaryBenchmarkResponse)
def get_salary_benchmarks(
    district: str | None = Query(None, description="Optional district filter"),
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    """Retrieve min, average, and max salary benchmarks by role category computed dynamically from job postings."""
    return employer_analytics_service.get_salary_benchmarks(db, district=district)


@router.post("/intelligence/query", response_model=EmployerIntelligenceResponse)
async def query_employer_intelligence_agent(
    payload: EmployerIntelligenceRequest,
    current_user: User = Depends(require_employer),
    db: Session = Depends(get_db),
):
    """Natural language intelligence query processed safely via deterministic read-only tool orchestration."""
    return await employer_intelligence_agent.execute_query(db, current_user, payload)


@router.post("/ingestion/adzuna")
async def trigger_adzuna_ingestion(
    query: str = Query("Developer", description="Role/Skill keyword to ingest"),
    district: str = Query("Pune", description="Target Maharashtra district"),
    pages: int = Query(1, ge=1, le=3),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Trigger job ingestion from Adzuna API into database with skill extraction and deduplication."""
    if current_user.role not in ["employer", "gov"]:
        raise HTTPException(status_code=403, detail="Only employers or government officials can trigger ingestion.")

    run = await ingestion_service.ingest_adzuna_jobs(
        db=db,
        query=query,
        district=district,
        pages=pages,
    )
    return {
        "status": "success",
        "ingestion_run_id": run.id,
        "records_fetched": run.records_fetched,
        "records_inserted": run.records_inserted,
        "records_skipped": run.records_skipped,
        "run_status": run.status,
    }

