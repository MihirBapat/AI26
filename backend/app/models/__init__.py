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

__all__ = [
    "TimestampMixin",

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
]
