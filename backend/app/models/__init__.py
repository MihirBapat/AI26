"""Models package — import all models so Alembic / Base.metadata sees them."""

from app.models.base_model import TimestampMixin
from app.models.course import (
    Course,
    CourseDomain,
    CourseInitiative,
    CourseNosCode,
    CourseOccupation,
    CourseProductType,
    CourseProgram,
    CourseQpCode,
    CourseSector,
    CourseSkillSet,
    CourseTag,
)
from app.models.employer import Employer
from app.models.employer_validation import EmployerCourseValidation, EmployerFeedback
from app.models.ingestion import IngestionRun
from app.models.job_posting import JobPosting, JobPostingSkill
from app.models.lookups import (
    Domain,
    Initiative,
    NosCode,
    Occupation,
    ProductType,
    Program,
    ProgramSponsor,
    Provider,
    Sector,
    SkillSet,
    Tag,
)
from app.models.skill import CourseSkill, Skill, SkillAlias
from app.models.user import User
from app.models.candidate import CandidateProfile
from app.models.otp import OtpVerification
__all__ = [
    "TimestampMixin",
    "User",
    "CandidateProfile",
    "OtpVerification",

    "Sector",
    "Domain",
    "Provider",
    "ProgramSponsor",
    "Occupation",
    "Tag",
    "NosCode",
    "QpCode",
    "Program",
    "Initiative",
    "ProductType",
    "SkillSet",
    "Course",
    "CourseSector",
    "CourseDomain",
    "CourseOccupation",
    "CourseTag",
    "CourseNosCode",
    "CourseQpCode",
    "CourseProgram",
    "CourseInitiative",
    "CourseProductType",
    "CourseSkillSet",
    "Employer",
    "Skill",
    "SkillAlias",
    "CourseSkill",
    "JobPosting",
    "JobPostingSkill",
    "EmployerCourseValidation",
    "EmployerFeedback",
    "IngestionRun",
]
