"""Pydantic schemas for Employer module — profiles, jobs, skills, validations, analytics, and intelligence."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, HttpUrl


# ---------------------------------------------------------------------------
# Employer Profile Schemas
# ---------------------------------------------------------------------------

class EmployerProfileBase(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=255, description="Registered or trade name of the company")
    legal_name: str | None = Field(None, max_length=255)
    industry: str | None = Field(None, max_length=100, description="e.g. 'Information Technology', 'Automotive', 'Healthcare'")
    sector_id: int | None = Field(None, description="Optional ID of industry sector from lookups")
    company_size: str | None = Field(None, description="'1-10', '11-50', '51-200', '201-500', '500+'")
    description: str | None = Field(None, max_length=2000)
    website: str | None = Field(None, max_length=255)
    contact_email: str | None = Field(None, max_length=255)
    contact_phone: str | None = Field(None, max_length=50)
    address: str | None = Field(None, max_length=500)
    city: str | None = Field(None, max_length=100)
    district: str | None = Field(None, max_length=100, description="Maharashtra District (e.g. Pune, Mumbai, Nagpur)")
    state: str = Field(default="Maharashtra", max_length=100)
    pincode: str | None = Field(None, max_length=20)
    logo_url: str | None = Field(None, max_length=1000)


class EmployerProfileCreate(EmployerProfileBase):
    pass


class EmployerProfileUpdate(BaseModel):
    company_name: str | None = Field(None, min_length=2, max_length=255)
    legal_name: str | None = None
    industry: str | None = None
    sector_id: int | None = None
    company_size: str | None = None
    description: str | None = None
    website: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    address: str | None = None
    city: str | None = None
    district: str | None = None
    state: str | None = None
    pincode: str | None = None
    logo_url: str | None = None


class EmployerProfileResponse(EmployerProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    verification_status: str
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Canonical Skill Schemas
# ---------------------------------------------------------------------------

class SkillBase(BaseModel):
    name: str = Field(..., max_length=255)
    category: str = Field(default="General", max_length=100)
    description: str | None = None
    is_emerging: bool = False


class SkillRead(SkillBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    normalized_name: str
    parent_skill_id: int | None = None


class SkillAliasRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    skill_id: int
    alias: str
    normalized_alias: str


class SkillNormalizeRequest(BaseModel):
    raw_skill: str = Field(..., min_length=1, max_length=255)


class SkillNormalizeResponse(BaseModel):
    raw_input: str
    canonical_skill: SkillRead | None = None
    matched_via: str = Field(..., description="'exact', 'alias', 'fuzzy', 'unmatched'")
    confidence: float = Field(..., ge=0.0, le=1.0)


# ---------------------------------------------------------------------------
# Skill Extraction Schemas
# ---------------------------------------------------------------------------

class ExtractedSkillItem(BaseModel):
    name: str
    canonical_id: int | None = None
    category: str = "General"
    requirement_type: str = Field(default="required", description="'required' or 'preferred'")
    proficiency_level: str = Field(default="intermediate", description="'beginner', 'intermediate', 'advanced', 'expert'")
    importance_weight: float = Field(default=1.0, ge=0.0, le=1.0)
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0)
    extraction_source: str = "rule_extracted"


class SkillExtractionRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=500)
    description: str = Field(..., min_length=10)
    additional_requirements: str | None = None


class SkillExtractionResponse(BaseModel):
    role_category: str | None
    extracted_skills: list[ExtractedSkillItem]
    total_skills_found: int


# ---------------------------------------------------------------------------
# Job Posting Schemas
# ---------------------------------------------------------------------------

class JobSkillInput(BaseModel):
    skill_name: str = Field(..., min_length=1, max_length=255)
    requirement_type: str = Field(default="required", description="'required' or 'preferred'")
    proficiency_level: str = Field(default="intermediate", description="'beginner', 'intermediate', 'advanced', 'expert'")
    importance_weight: float = Field(default=1.0, ge=0.1, le=1.0)


class JobPostingCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=500)
    description: str = Field(..., min_length=10)
    role_category: str | None = Field(None, max_length=255)
    industry: str | None = Field(None, max_length=255)
    sector_id: int | None = None
    location: str | None = Field(None, max_length=255)
    district: str | None = Field(None, max_length=100)
    state: str = "Maharashtra"
    employment_type: str = Field(default="Full-time", description="'Full-time', 'Part-time', 'Contract', 'Internship'")
    work_mode: str = Field(default="On-site", description="'On-site', 'Remote', 'Hybrid'")
    min_experience_years: float | None = Field(None, ge=0)
    max_experience_years: float | None = Field(None, ge=0)
    min_salary: float | None = Field(None, ge=0)
    max_salary: float | None = Field(None, ge=0)
    currency: str = "INR"
    status: str = Field(default="published", description="'draft', 'published'")
    skills: list[JobSkillInput] | None = Field(None, description="Optional manual skills list. If omitted or empty, skills will be auto-extracted.")


class JobPostingUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=500)
    description: str | None = Field(None, min_length=10)
    role_category: str | None = None
    industry: str | None = None
    sector_id: int | None = None
    location: str | None = None
    district: str | None = None
    state: str | None = None
    employment_type: str | None = None
    work_mode: str | None = None
    min_experience_years: float | None = None
    max_experience_years: float | None = None
    min_salary: float | None = None
    max_salary: float | None = None
    status: str | None = Field(None, description="'draft', 'published', 'paused', 'closed'")
    skills: list[JobSkillInput] | None = None


class JobSkillDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    skill_id: int
    skill_name: str
    category: str
    requirement_type: str
    proficiency_level: str
    importance_weight: float
    confidence_score: float
    extraction_source: str


class JobPostingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employer_id: int | None
    company_name: str | None = None
    source: str
    source_job_id: str | None = None
    title: str
    normalized_title: str | None = None
    description: str
    role_category: str | None
    industry: str | None
    sector_id: int | None
    location: str | None
    district: str | None
    state: str
    employment_type: str
    work_mode: str
    min_experience_years: float | None
    max_experience_years: float | None
    min_salary: float | None
    max_salary: float | None
    currency: str
    status: str
    posted_at: datetime | None
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime
    skills: list[JobSkillDetail] = []


class JobPostingListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    company_name: str | None = None
    district: str | None
    employment_type: str
    work_mode: str
    min_salary: float | None
    max_salary: float | None
    status: str
    posted_at: datetime | None
    skills_count: int = 0
    top_skills: list[str] = []


class PaginatedJobPostings(BaseModel):
    items: list[JobPostingListItem]
    total: int
    page: int
    size: int
    pages: int


# ---------------------------------------------------------------------------
# Skill Gap Engine & Course Match Schemas
# ---------------------------------------------------------------------------

class SkillCoverageDetail(BaseModel):
    skill_id: int
    skill_name: str
    category: str
    requirement_type: str
    importance_weight: float
    status: str = Field(..., description="'covered', 'partial', 'missing'")
    matching_course_ids: list[int] = []
    coverage_score: float = Field(..., ge=0.0, le=1.0)


class SkillGapResponse(BaseModel):
    job_id: int | None = None
    role_title: str
    district: str | None = None
    total_required_skills: int
    covered_skills_count: int
    partial_skills_count: int
    missing_skills_count: int
    overall_coverage_percentage: float = Field(..., ge=0.0, le=100.0)
    gap_severity: str = Field(..., description="'Low', 'Moderate', 'High', 'Critical'")
    skill_breakdown: list[SkillCoverageDetail]
    recommendations: list[str]


class CourseMatchItem(BaseModel):
    course_id: int
    sid_course_id: str
    title: str
    provider_name: str | None
    course_type: str
    price: float | None
    rating_average: float | None
    enrollment_count: int
    matched_skills: list[str]
    missing_skills: list[str]
    alignment_score: float = Field(..., ge=0.0, le=100.0, description="Percentage of job skills taught in course")


class JobCourseMatchesResponse(BaseModel):
    job_id: int
    job_title: str
    required_skills: list[str]
    matched_courses: list[CourseMatchItem]
    total_courses_evaluated: int


class SkillGapAnalysisRequest(BaseModel):
    role_title: str = Field(..., min_length=2, max_length=255)
    skills: list[str] = Field(..., min_length=1, description="List of required skill names")
    district: str | None = None


# ---------------------------------------------------------------------------
# Employer Course Validations & Feedback Schemas
# ---------------------------------------------------------------------------

class EmployerValidationCreate(BaseModel):
    course_id: int
    skill_id: int | None = None
    validation_status: str = Field(..., description="'adequate', 'partially_adequate', 'inadequate', 'obsolete'")
    rating: int = Field(..., ge=1, le=5)
    feedback_text: str | None = Field(None, max_length=2000)
    curriculum_recommendation: str | None = Field(None, max_length=2000)
    industry_relevance_score: float = Field(default=70.0, ge=0.0, le=100.0)


class EmployerValidationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employer_id: int
    course_id: int
    course_title: str | None = None
    skill_id: int | None
    skill_name: str | None = None
    validation_status: str
    rating: int
    feedback_text: str | None
    curriculum_recommendation: str | None
    industry_relevance_score: float
    created_at: datetime


class EmployerFeedbackCreate(BaseModel):
    feedback_category: str = Field(
        ...,
        description="'skill_gap', 'candidate_readiness', 'curriculum_quality', 'equipment_infrastructure', 'trainer_quality', 'emerging_skill', 'obsolete_skill'",
    )
    subject: str = Field(..., min_length=3, max_length=255)
    district: str | None = Field(None, max_length=100)
    sector_id: int | None = None
    detailed_comments: str = Field(..., min_length=10, max_length=5000)
    proposed_interventions: str | None = Field(None, max_length=2000)
    urgency_level: str = Field(default="medium", description="'low', 'medium', 'high', 'critical'")


class EmployerFeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employer_id: int
    company_name: str | None = None
    feedback_category: str
    subject: str
    district: str | None
    sector_id: int | None
    detailed_comments: str
    proposed_interventions: str | None
    urgency_level: str
    created_at: datetime


# ---------------------------------------------------------------------------
# Employer Analytics Schemas
# ---------------------------------------------------------------------------

class EmployerOverviewStats(BaseModel):
    total_jobs: int
    active_jobs: int
    draft_jobs: int
    closed_jobs: int
    total_validations_submitted: int
    total_feedback_submitted: int
    top_demanded_skills_in_company: list[str]
    average_skill_coverage_pct: float


class SkillDemandItem(BaseModel):
    skill_id: int
    skill_name: str
    category: str
    postings_count: int
    unique_employers_count: int
    demand_share_pct: float
    demand_index: float = Field(..., ge=0.0, le=100.0)
    is_emerging: bool


class SkillDemandAnalyticsResponse(BaseModel):
    district_filter: str | None
    sector_filter: str | None
    total_postings_analyzed: int
    top_demanded_skills: list[SkillDemandItem]


class SalaryBenchmarkItem(BaseModel):
    role_category: str
    district: str | None
    min_salary: float
    avg_salary: float
    max_salary: float
    sample_size: int


class SalaryBenchmarkResponse(BaseModel):
    district: str | None
    benchmarks: list[SalaryBenchmarkItem]


# ---------------------------------------------------------------------------
# Employer Intelligence Agent Schemas
# ---------------------------------------------------------------------------

class EmployerIntelligenceRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=1000, description="Natural language question about skills, jobs, or market gaps")
    district: str | None = None
    role_category: str | None = None


class ToolExecutionTrace(BaseModel):
    tool_name: str
    parameters: dict
    result_summary: str


class EmployerIntelligenceResponse(BaseModel):
    query: str
    answer: str
    tools_executed: list[ToolExecutionTrace]
    grounded_metrics: dict
    confidence: float

