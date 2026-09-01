"""Pydantic schemas for the Course entity (list, detail, stats)."""

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.lookups import (
    DomainBrief,
    InitiativeRead,
    NosCodeRead,
    OccupationRead,
    ProductTypeRead,
    ProgramRead,
    ProgramSponsorBrief,
    ProviderBrief,
    QpCodeRead,
    SectorBrief,
    SkillSetRead,
    TagRead,
)


class _OrmBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class CourseListItem(_OrmBase):
    """Compact course representation for paginated lists."""

    id: int
    sid_course_id: str
    title: str
    course_type: str
    language: str | None = None
    price: float | None = None
    duration_minutes: int | None = None
    enrollment_count: int = 0
    rating_average: float | None = None
    total_ratings: int = 0
    availability: str | None = None
    certificate_enabled: bool | None = None
    course_image_url: str | None = None


    provider: ProviderBrief | None = None
    sectors: list[SectorBrief] = Field(default_factory=list)
    domains: list[DomainBrief] = Field(default_factory=list)

    @classmethod
    def from_course(cls, course) -> "CourseListItem":
        """Build from a Course ORM instance with eagerly loaded relations."""
        return cls(
            id=course.id,
            sid_course_id=course.sid_course_id,
            title=course.title,
            course_type=course.course_type,
            language=course.language,
            price=float(course.price) if course.price is not None else None,
            duration_minutes=course.duration_minutes,
            enrollment_count=course.enrollment_count,
            rating_average=course.rating_average,
            total_ratings=course.total_ratings,
            availability=course.availability,
            certificate_enabled=course.certificate_enabled,
            course_image_url=course.course_image_url,
            provider=ProviderBrief.model_validate(course.provider) if course.provider else None,
            sectors=[SectorBrief.model_validate(cs.sector) for cs in course.course_sectors],
            domains=[DomainBrief.model_validate(cd.domain) for cd in course.course_domains],
        )


class CourseDetail(_OrmBase):
    """Full course detail with all relations expanded."""

    id: int
    sid_course_id: str
    readable_code: str | None = None
    course_code: str | None = None
    title: str
    short_description: str | None = None
    long_description: str | None = None
    learning_outcome: str | None = None

    course_type: str
    course_mode: str | None = None
    type_id: str | None = None
    availability: str | None = None
    language: str | None = None

    price: float | None = None
    duration_minutes: int | None = None

    assessment_type: str | None = None
    certificate_enabled: bool | None = None
    certificate_type: str | None = None
    credit: str | None = None

    created_by: str | None = None
    age_requirement: str | None = None
    educational_qualification: str | None = None
    industry_experience: str | None = None

    enrollment_count: int = 0
    rating_average: float | None = None
    total_ratings: int = 0

    nsqf_level: str | None = None
    job_role: str | None = None
    scheme_id: str | None = None

    course_created_date: str | None = None
    course_updated_date: str | None = None
    start_date: str | None = None
    end_date: str | None = None

    course_status_id: str | None = None
    learner_identifier: str | None = None

    course_url: str | None = None
    course_image_url: str | None = None
    course_video_url: str | None = None

    external_payment: str | None = None
    sub_sector: str | None = None


    provider: ProviderBrief | None = None
    program_sponsor: ProgramSponsorBrief | None = None
    sectors: list[SectorBrief] = Field(default_factory=list)
    domains: list[DomainBrief] = Field(default_factory=list)
    occupations: list[OccupationRead] = Field(default_factory=list)
    tags: list[TagRead] = Field(default_factory=list)
    nos_codes: list[NosCodeRead] = Field(default_factory=list)
    qp_codes: list[QpCodeRead] = Field(default_factory=list)
    programs: list[ProgramRead] = Field(default_factory=list)
    initiatives: list[InitiativeRead] = Field(default_factory=list)
    product_types: list[ProductTypeRead] = Field(default_factory=list)
    skill_sets: list[SkillSetRead] = Field(default_factory=list)

    @classmethod
    def from_course(cls, course) -> "CourseDetail":
        """Build from a Course ORM instance with eagerly loaded relations."""
        return cls(
            id=course.id,
            sid_course_id=course.sid_course_id,
            readable_code=course.readable_code,
            course_code=course.course_code,
            title=course.title,
            short_description=course.short_description,
            long_description=course.long_description,
            learning_outcome=course.learning_outcome,
            course_type=course.course_type,
            course_mode=course.course_mode,
            type_id=course.type_id,
            availability=course.availability,
            language=course.language,
            price=float(course.price) if course.price is not None else None,
            duration_minutes=course.duration_minutes,
            assessment_type=course.assessment_type,
            certificate_enabled=course.certificate_enabled,
            certificate_type=course.certificate_type,
            credit=course.credit,
            created_by=course.created_by,
            age_requirement=course.age_requirement,
            educational_qualification=course.educational_qualification,
            industry_experience=course.industry_experience,
            enrollment_count=course.enrollment_count,
            rating_average=course.rating_average,
            total_ratings=course.total_ratings,
            nsqf_level=course.nsqf_level,
            job_role=course.job_role,
            scheme_id=course.scheme_id,
            course_created_date=course.course_created_date,
            course_updated_date=course.course_updated_date,
            start_date=course.start_date,
            end_date=course.end_date,
            course_status_id=course.course_status_id,
            learner_identifier=course.learner_identifier,
            course_url=course.course_url,
            course_image_url=course.course_image_url,
            course_video_url=course.course_video_url,
            external_payment=course.external_payment,
            sub_sector=course.sub_sector,
            provider=ProviderBrief.model_validate(course.provider) if course.provider else None,
            program_sponsor=ProgramSponsorBrief.model_validate(course.program_sponsor) if course.program_sponsor else None,
            sectors=[SectorBrief.model_validate(cs.sector) for cs in course.course_sectors],
            domains=[DomainBrief.model_validate(cd.domain) for cd in course.course_domains],
            occupations=[OccupationRead.model_validate(co.occupation) for co in course.course_occupations],
            tags=[TagRead.model_validate(ct.tag) for ct in course.course_tags],
            nos_codes=[NosCodeRead.model_validate(cn.nos_code) for cn in course.course_nos_codes],
            qp_codes=[QpCodeRead.model_validate(cq.qp_code) for cq in course.course_qp_codes],
            programs=[ProgramRead.model_validate(cp.program) for cp in course.course_programs],
            initiatives=[InitiativeRead.model_validate(ci.initiative) for ci in course.course_initiatives],
            product_types=[ProductTypeRead.model_validate(cpt.product_type) for cpt in course.course_product_types],
            skill_sets=[SkillSetRead.model_validate(css.skill_set) for css in course.course_skill_sets],
        )


class PaginatedCourses(BaseModel):
    """Paginated response for course listings."""

    items: list[CourseListItem]
    total: int
    page: int
    size: int
    pages: int


class CourseStats(BaseModel):
    """Aggregate course statistics."""

    total_courses: int
    online_courses: int
    offline_courses: int
    free_courses: int
    paid_courses: int
    total_enrollments: int
    unique_providers: int
    unique_sectors: int
    avg_rating: float | None = None
    with_certificate: int


# ---------------------------------------------------------------------------
# Course Health & Industry Alignment Intelligence Report Schemas
# ---------------------------------------------------------------------------

class SalaryBenchmarkBand(BaseModel):
    label: str
    min_salary: float
    max_salary: float | None = None
    count: int


class TopEmployerItem(BaseModel):
    name: str
    active_openings: int
    location: str | None = "Maharashtra"
    average_salary: float | None = None


class SkillMatchGapItem(BaseModel):
    skill_name: str
    status: str = Field(..., description="'taught', 'emerging_gap', or 'declining'")
    importance_weight: float = 1.0
    demand_growth_pct: float | None = None
    category: str = "Technical"


class CurriculumRecommendation(BaseModel):
    id: str
    category: str = Field(..., description="'add_module', 'update_tooling', 'capacity_adjustment', 'trainer_enablement'")
    title: str
    description: str
    priority: str = Field(..., description="'High', 'Medium', 'Low'")
    expected_impact: str


class DistrictDemandBreakdown(BaseModel):
    district: str
    openings_count: int
    demand_intensity: str = "Moderate"
    avg_salary: float | None = None


class CourseHealthReportResponse(BaseModel):
    """Comprehensive Course Health & Industry Alignment Report (SIH PS 26134)."""

    course_id: int
    sid_course_id: str
    title: str
    provider_name: str | None = None
    course_type: str = "Online"
    duration_minutes: int | None = None
    nsqf_level: str | None = None
    enrollment_count: int = 0
    rating_average: float | None = None
    certificate_enabled: bool = True
    course_url: str | None = None

    sectors: list[str] = Field(default_factory=list)
    domains: list[str] = Field(default_factory=list)
    occupations: list[str] = Field(default_factory=list)

    # Core Health Scores (0 to 100)
    overall_health_score: float = 85.0
    health_grade: str = "Grade A · Highly Aligned"
    health_status_label: str = "Optimal Alignment"
    industry_demand_score: float = 88.0
    curriculum_modernity_score: float = 82.0
    obsolescence_risk_score: float = 14.0
    placement_potential_score: float = 89.0
    skill_velocity: str = "High Demand Velocity (+28% YoY)"

    # Live Market Indicators
    total_state_openings: int = 1200
    avg_salary_inr: float = 650000.0
    entry_salary_inr: float = 380000.0
    senior_salary_inr: float = 1100000.0

    salary_bands: list[SalaryBenchmarkBand] = Field(default_factory=list)
    top_employers: list[TopEmployerItem] = Field(default_factory=list)
    skills_analysis: list[SkillMatchGapItem] = Field(default_factory=list)
    recommendations: list[CurriculumRecommendation] = Field(default_factory=list)
    district_demand: list[DistrictDemandBreakdown] = Field(default_factory=list)

    selected_district: str = "All Maharashtra"
    district_scope_label: str = "All Maharashtra (Statewide)"
    ai_executive_summary: str = ""
    evidence_basis: str = "Live Adzuna Maharashtra vacancies & Skill India Digital curriculum mapping"
    generated_at: str = ""

