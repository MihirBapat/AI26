"""Schemas for Sector & District Curriculum Intelligence Report Generation (SIH PS 26134)."""

from pydantic import BaseModel, Field
from app.schemas.course import DistrictDemandBreakdown


class SectorReportRequest(BaseModel):
    sector_id: int | None = None
    sector_name: str | None = None
    district: str | None = "All Maharashtra"


class NewCourseRecommendation(BaseModel):
    """A synthesized new course blueprint for skills that industry demands but no course covers."""

    skill_name: str
    recommended_course_title: str
    market_demand_openings: int
    avg_salary_inr: float
    target_nsqf_level: str
    suggested_duration_hours: int
    suggested_modules: list[str] = Field(default_factory=list)
    priority: str = Field(..., description="'Critical', 'High', 'Medium'")
    justification: str


class ExistingCourseAuditItem(BaseModel):
    """Audit summary for an existing course in the sector."""

    course_id: int
    title: str
    provider_name: str | None = None
    course_type: str = "Online"
    enrollment_count: int = 0
    rating_average: float | None = None
    overall_health_score: float = 75.0
    health_grade: str = "Grade B · Strong Alignment"
    obsolescence_risk_score: float = 20.0
    status: str = Field(..., description="'Highly Aligned', 'Needs Curriculum Refresh', 'High Obsolescence Risk'")
    missing_critical_skills: list[str] = Field(default_factory=list)


class SectorCurriculumReportResponse(BaseModel):
    """Full Sector & District Curriculum Gap Intelligence Report."""

    sector_name: str
    sector_id: int | None = None
    district_scope: str = "All Maharashtra (Statewide)"
    selected_district: str = "All Maharashtra"
    generated_at: str

    # Executive Sector KPIs
    total_active_vacancies: int
    total_courses_count: int
    courses_to_vacancies_ratio: str
    average_sector_salary: float
    sector_health_index: float
    curriculum_coverage_pct: float

    # Key Intelligence Sections
    new_courses_required: list[NewCourseRecommendation] = Field(default_factory=list)
    existing_courses_audit: list[ExistingCourseAuditItem] = Field(default_factory=list)
    district_capacity_allocation: list[DistrictDemandBreakdown] = Field(default_factory=list)

    ai_executive_summary: str
    policy_action_items: list[str] = Field(default_factory=list)
