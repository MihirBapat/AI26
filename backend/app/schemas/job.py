"""Pydantic schemas for Adzuna Labour Market Intelligence, Google Trends fallback, and District Job Demand."""

from pydantic import BaseModel, ConfigDict, Field


class _OrmBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# 1. Adzuna Raw & Normalized Schemas
# ---------------------------------------------------------------------------

class AdzunaLocation(BaseModel):
    """Location info from Adzuna."""
    area: list[str] = Field(default_factory=list, description="Hierarchy of location nodes broad -> narrow")
    display_name: str | None = Field(default=None, description="Human readable location text")


class AdzunaCompany(BaseModel):
    """Company display info from Adzuna."""
    display_name: str | None = Field(default=None, description="Employer name")


class AdzunaCategory(BaseModel):
    """Adzuna category tag and label."""
    label: str | None = Field(default=None, description="Display category name")
    tag: str | None = Field(default=None, description="Normalized category slug/tag")


class AdzunaJobItem(BaseModel):
    """Individual live job posting item from Adzuna search."""
    id: str = Field(..., description="Unique job ID from Adzuna")
    title: str = Field(..., description="Job posting title")
    description: str | None = Field(default=None, description="Snippet description of posting")
    company: AdzunaCompany | None = Field(default=None, description="Hiring company")
    location: AdzunaLocation | None = Field(default=None, description="Location hierarchy and display name")
    latitude: float | None = Field(default=None, description="Latitude coordinate")
    longitude: float | None = Field(default=None, description="Longitude coordinate")
    salary_min: float | None = Field(default=None, description="Minimum stated or predicted annual salary")
    salary_max: float | None = Field(default=None, description="Maximum stated or predicted annual salary")
    salary_is_predicted: int | bool | None = Field(default=0, description="1 if modeled/predicted, 0 if stated")
    category: AdzunaCategory | None = Field(default=None, description="Job category taxonomy")
    contract_type: str | None = Field(default=None, description="e.g. permanent, contract")
    contract_time: str | None = Field(default=None, description="e.g. full_time, part_time")
    created: str | None = Field(default=None, description="ISO timestamp of posting")
    redirect_url: str | None = Field(default=None, description="Direct URL to view/apply")


class JobSearchResponse(BaseModel):
    """Paginated search response for live job postings."""
    results: list[AdzunaJobItem] = Field(default_factory=list)
    total_count: int = Field(default=0, description="Total matching postings")
    page: int = Field(default=1, description="Current page number")
    results_per_page: int = Field(default=20, description="Results per page")
    query_what: str | None = Field(default=None, description="Keyword/role query")
    query_where: str | None = Field(default=None, description="District/location query")
    data_source: str = Field(default="adzuna", description="Source identifier (adzuna, adzuna_mock, pytrends_proxy)")
    is_fallback: bool = Field(default=False, description="True if fallback provider was invoked")
    cached: bool = Field(default=False, description="True if served from cache")
    warning: str | None = Field(default=None, description="Optional diagnostic or disclaimer note")


# ---------------------------------------------------------------------------
# 2. Geodata (Regional Drill-down) Schemas
# ---------------------------------------------------------------------------

class GeodataLocationItem(BaseModel):
    """Regional posting count and area hierarchy."""
    count: int = Field(..., description="Job count in this region")
    location: AdzunaLocation = Field(..., description="Region details")


class GeodataResponse(BaseModel):
    """Geodata drill-down response for verifying district hierarchy depth."""
    locations: list[GeodataLocationItem] = Field(default_factory=list)
    level: int = Field(default=0, description="Location hierarchy depth")
    parent_location: str | None = Field(default=None, description="Parent location queried")
    data_source: str = Field(default="adzuna")
    cached: bool = Field(default=False)
    has_district_depth: bool = Field(default=True, description="Whether data resolves below state level")


# ---------------------------------------------------------------------------
# 3. Salary History & Salary Histogram Schemas
# ---------------------------------------------------------------------------

class SalaryHistoryPoint(BaseModel):
    """Average salary for a specific month."""
    period: str = Field(..., description="Month in YYYY-MM format")
    average_salary: float = Field(..., description="Average salary in INR")


class SalaryHistoryResponse(BaseModel):
    """Historical salary trend series over time."""
    location: str | None = Field(default=None, description="Target district or state")
    category: str | None = Field(default=None, description="Job category tag")
    what: str | None = Field(default=None, description="Role/keyword queried")
    history: list[SalaryHistoryPoint] = Field(default_factory=list)
    trend_direction: str = Field(default="stable", description="upward, downward, stable")
    data_source: str = Field(default="adzuna")
    demand_granularity: str = Field(default="district_or_state")
    cached: bool = Field(default=False)


class SalaryHistogramBand(BaseModel):
    """Salary bucket with vacancy count."""
    min_salary: float = Field(..., description="Lower bound of salary band")
    max_salary: float | None = Field(default=None, description="Upper bound of salary band")
    count: int = Field(..., description="Number of vacancies in this band")
    label: str = Field(..., description="Formatted band label (e.g. ₹20k - ₹30k)")


class SalaryHistogramResponse(BaseModel):
    """Salary distribution histogram for a role/location."""
    what: str | None = None
    location: str | None = None
    bands: list[SalaryHistogramBand] = Field(default_factory=list)
    total_vacancies: int = 0
    median_salary_estimate: float | None = None
    data_source: str = Field(default="adzuna")
    cached: bool = Field(default=False)


# ---------------------------------------------------------------------------
# 4. Top Companies & Categories Schemas
# ---------------------------------------------------------------------------

class TopCompanyItem(BaseModel):
    """Leaderboard entry for top hiring company."""
    canonical_name: str = Field(..., description="Standardized company name")
    count: int = Field(..., description="Active vacancy count")
    average_salary: float | None = Field(default=None, description="Average salary offered if available")


class TopCompaniesResponse(BaseModel):
    """Top 5 hiring employers for a role & district."""
    what: str | None = None
    where: str | None = None
    leaderboard: list[TopCompanyItem] = Field(default_factory=list)
    data_source: str = Field(default="adzuna")
    cached: bool = Field(default=False)


class JobCategoryItem(BaseModel):
    """Standard Adzuna job taxonomy category."""
    label: str = Field(..., description="Category display label")
    tag: str = Field(..., description="Category taxonomy tag")


class JobCategoriesResponse(BaseModel):
    """Taxonomy of job categories."""
    categories: list[JobCategoryItem] = Field(default_factory=list)
    data_source: str = Field(default="adzuna")
    cached: bool = Field(default=False)


# ---------------------------------------------------------------------------
# 5. Salary Predictor (Jobsworth) Schemas
# ---------------------------------------------------------------------------

class SalaryPredictionRequest(BaseModel):
    """Request payload for estimating role salary."""
    title: str = Field(..., description="Job role title (e.g. Electrician, Python Developer)")
    description: str = Field(..., description="Job description or required skill list")
    district: str | None = Field(default=None, description="Optional target district (e.g. Pune)")


class SalaryPredictionResponse(BaseModel):
    """Predicted salary estimate."""
    title: str
    predicted_salary: float | None = Field(default=None, description="Estimated annual salary in INR")
    salary_range_low: float | None = None
    salary_range_high: float | None = None
    currency: str = "INR"
    confidence: float = Field(default=0.85, description="Confidence score (0.0 - 1.0)")
    data_source: str = Field(default="adzuna_jobsworth")
    cached: bool = Field(default=False)


# ---------------------------------------------------------------------------
# 6. Google Trends (Fallback) Schemas
# ---------------------------------------------------------------------------

class TrendsInterestPoint(BaseModel):
    """Search interest index over time (0 - 100)."""
    date: str
    interest: int


class CityInterestPoint(BaseModel):
    """Search interest by city."""
    city: str
    interest_score: int


class TrendsResponse(BaseModel):
    """Google Trends search volume response (fallback signal)."""
    keyword: str
    geo: str = "IN-MH"
    timeline: list[TrendsInterestPoint] = Field(default_factory=list)
    city_rankings: list[CityInterestPoint] = Field(default_factory=list)
    rising_queries: list[str] = Field(default_factory=list)
    data_source: str = "google_trends"
    demand_granularity: str = "city_proxy"
    disclaimer: str = "City proxy only — Google Trends does not provide district-level resolution."


# ---------------------------------------------------------------------------
# 7. Integrated Labour Market & District Heatmap Schemas
# ---------------------------------------------------------------------------

class DistrictDemandSummary(BaseModel):
    """District-level labor demand overview with postings, salary, and top employers."""
    district: str
    state: str = "Maharashtra"
    total_vacancies: int = 0
    average_salary: float | None = None
    top_employers: list[TopCompanyItem] = Field(default_factory=list)
    top_categories: list[str] = Field(default_factory=list)
    demand_level: str = Field(default="Moderate", description="High, Moderate, Emerging, Low")
    demand_score: float = Field(default=50.0, description="0 to 100 demand index")
    growth_rate_pct: float | None = None
    data_source: str = "adzuna"
    demand_granularity: str = "district"
    fallback_used: bool = False
    warning: str | None = None


class DistrictHeatmapPoint(BaseModel):
    """District coordinate point and demand metrics for Maharashtra heatmap."""
    district: str
    district_code: str | None = None
    latitude: float
    longitude: float
    demand_score: float = Field(..., description="0 to 100 normalized score")
    total_vacancies: int = 0
    average_salary: float | None = None
    top_sectors: list[str] = Field(default_factory=list)
    top_roles: list[str] = Field(default_factory=list)
    demand_level: str = "Moderate"
    data_source: str = "adzuna"


class DistrictHeatmapResponse(BaseModel):
    """Maharashtra district skill and job demand heatmap."""
    state: str = "Maharashtra"
    sector_filter: str | None = None
    districts: list[DistrictHeatmapPoint] = Field(default_factory=list)
    total_state_vacancies: int = 0
    highest_demand_district: str = ""
    data_source: str = "adzuna"
    cached: bool = False


class MatchedCourseBrief(BaseModel):
    """Course from Skill India Digital matching the live job demand role."""
    id: int
    sid_course_id: str
    title: str
    course_type: str
    provider_name: str | None = None
    price: float | None = None
    rating_average: float | None = None
    enrollment_count: int = 0


class RoleMarketDemand(BaseModel):
    """In-depth role market intelligence connecting Adzuna live demand to SID courses."""
    role_name: str
    district: str | None = None
    total_postings: int = 0
    average_salary: float | None = None
    salary_min: float | None = None
    salary_max: float | None = None
    salary_distribution: list[SalaryHistogramBand] = Field(default_factory=list)
    top_hiring_companies: list[TopCompanyItem] = Field(default_factory=list)
    recent_postings: list[AdzunaJobItem] = Field(default_factory=list)
    matched_occupations: list[str] = Field(default_factory=list)
    matched_courses_count: int = 0
    matched_courses: list[MatchedCourseBrief] = Field(default_factory=list)
    demand_index: float = 50.0
    demand_level: str = "Moderate"
    data_source: str = "adzuna"
    fallback_used: bool = False
    warning: str | None = None


class ServiceStatusResponse(BaseModel):
    """Adzuna, Redis, and pytrends connection and configuration status."""
    adzuna_configured: bool
    adzuna_app_id_set: bool
    adzuna_status: str
    adzuna_api_version: dict | None = None
    redis_enabled: bool
    redis_connected: bool
    pytrends_available: bool
    primary_source: str = "adzuna"
    fallback_source: str = "pytrends"
