"""Course model and bridge (many-to-many) tables.

The `courses` table holds all 38 scalar fields from the Excel.
Each multi-value field (Sector(s), Domain(s), Tags, …) is normalised into
a lookup table (in lookups.py) linked through a bridge table defined here.
"""

from sqlalchemy import (
    Column,
    Computed,
    Date,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base_model import TimestampMixin


class CourseSector(Base):
    """Bridge: course ↔ sector."""

    __tablename__ = "course_sectors"

    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
    sector_id: Mapped[int] = mapped_column(ForeignKey("sectors.id", ondelete="CASCADE"), primary_key=True)

    course: Mapped["Course"] = relationship(back_populates="course_sectors")
    sector: Mapped["Sector"] = relationship(back_populates="course_sectors")


class CourseDomain(Base):
    """Bridge: course ↔ domain."""

    __tablename__ = "course_domains"

    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
    domain_id: Mapped[int] = mapped_column(ForeignKey("domains.id", ondelete="CASCADE"), primary_key=True)

    course: Mapped["Course"] = relationship(back_populates="course_domains")
    domain: Mapped["Domain"] = relationship(back_populates="course_domains")


class CourseOccupation(Base):
    """Bridge: course ↔ occupation."""

    __tablename__ = "course_occupations"

    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
    occupation_id: Mapped[int] = mapped_column(ForeignKey("occupations.id", ondelete="CASCADE"), primary_key=True)

    course: Mapped["Course"] = relationship(back_populates="course_occupations")
    occupation: Mapped["Occupation"] = relationship(back_populates="course_occupations")


class CourseTag(Base):
    """Bridge: course ↔ tag."""

    __tablename__ = "course_tags"

    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
    tag_id: Mapped[int] = mapped_column(ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

    course: Mapped["Course"] = relationship(back_populates="course_tags")
    tag: Mapped["Tag"] = relationship(back_populates="course_tags")


class CourseNosCode(Base):
    """Bridge: course ↔ NOS code."""

    __tablename__ = "course_nos_codes"

    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
    nos_code_id: Mapped[int] = mapped_column(ForeignKey("nos_codes.id", ondelete="CASCADE"), primary_key=True)

    course: Mapped["Course"] = relationship(back_populates="course_nos_codes")
    nos_code: Mapped["NosCode"] = relationship(back_populates="course_nos_codes")


class CourseQpCode(Base):
    """Bridge: course ↔ QP code."""

    __tablename__ = "course_qp_codes"

    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
    qp_code_id: Mapped[int] = mapped_column(ForeignKey("qp_codes.id", ondelete="CASCADE"), primary_key=True)

    course: Mapped["Course"] = relationship(back_populates="course_qp_codes")
    qp_code: Mapped["QpCode"] = relationship(back_populates="course_qp_codes")


class CourseProgram(Base):
    """Bridge: course ↔ program."""

    __tablename__ = "course_programs"

    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id", ondelete="CASCADE"), primary_key=True)

    course: Mapped["Course"] = relationship(back_populates="course_programs")
    program: Mapped["Program"] = relationship(back_populates="course_programs")


class CourseInitiative(Base):
    """Bridge: course ↔ initiative."""

    __tablename__ = "course_initiatives"

    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
    initiative_id: Mapped[int] = mapped_column(ForeignKey("initiatives.id", ondelete="CASCADE"), primary_key=True)

    course: Mapped["Course"] = relationship(back_populates="course_initiatives")
    initiative: Mapped["Initiative"] = relationship(back_populates="course_initiatives")


class CourseProductType(Base):
    """Bridge: course ↔ product type."""

    __tablename__ = "course_product_types"

    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
    product_type_id: Mapped[int] = mapped_column(ForeignKey("product_types.id", ondelete="CASCADE"), primary_key=True)

    course: Mapped["Course"] = relationship(back_populates="course_product_types")
    product_type: Mapped["ProductType"] = relationship(back_populates="course_product_types")


class CourseSkillSet(Base):
    """Bridge: course ↔ skill set."""

    __tablename__ = "course_skill_sets"

    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
    skill_set_id: Mapped[int] = mapped_column(ForeignKey("skill_sets.id", ondelete="CASCADE"), primary_key=True)

    course: Mapped["Course"] = relationship(back_populates="course_skill_sets")
    skill_set: Mapped["SkillSet"] = relationship(back_populates="course_skill_sets")


class Course(TimestampMixin, Base):
    """Core course entity — one row per course (1,898 total)."""

    __tablename__ = "courses"


    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)


    sid_course_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True, comment="Original Course ID from Skill India Digital (UUID for online, numeric string for offline)")
    readable_code: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    course_code: Mapped[str | None] = mapped_column(String(500), nullable=True)


    title: Mapped[str] = mapped_column(String(1000), nullable=False, index=True)
    short_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    long_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    learning_outcome: Mapped[str | None] = mapped_column(Text, nullable=True)


    course_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True, comment="'Online' or 'Offline'")
    course_mode: Mapped[str | None] = mapped_column(String(100), nullable=True)
    type_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    availability: Mapped[str | None] = mapped_column(String(100), nullable=True)
    language: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)


    price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)


    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)


    assessment_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    certificate_enabled: Mapped[bool | None] = mapped_column(nullable=True)
    certificate_type: Mapped[str | None] = mapped_column(String(500), nullable=True)
    credit: Mapped[str | None] = mapped_column(String(255), nullable=True)


    provider_id: Mapped[int | None] = mapped_column(ForeignKey("providers.id"), nullable=True, index=True)
    provider_sid_id: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="Original provider UUID for cross-reference")
    created_by: Mapped[str | None] = mapped_column(String(500), nullable=True)


    program_sponsor_id: Mapped[int | None] = mapped_column(ForeignKey("program_sponsors.id"), nullable=True, index=True)


    age_requirement: Mapped[str | None] = mapped_column(Text, nullable=True)
    educational_qualification: Mapped[str | None] = mapped_column(Text, nullable=True)
    industry_experience: Mapped[str | None] = mapped_column(Text, nullable=True)


    enrollment_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rating_average: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_ratings: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


    nsqf_level: Mapped[str | None] = mapped_column(String(100), nullable=True)
    job_role: Mapped[str | None] = mapped_column(String(500), nullable=True)
    scheme_id: Mapped[str | None] = mapped_column(String(255), nullable=True)


    course_created_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    course_updated_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    start_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    end_date: Mapped[str | None] = mapped_column(String(50), nullable=True)


    course_status_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    learner_identifier: Mapped[str | None] = mapped_column(String(50), nullable=True)


    course_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    course_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    course_video_url: Mapped[str | None] = mapped_column(Text, nullable=True)


    external_payment: Mapped[str | None] = mapped_column(Text, nullable=True)
    sub_sector: Mapped[str | None] = mapped_column(String(500), nullable=True)


    search_vector: Mapped[str | None] = mapped_column(
        TSVECTOR,
        Computed(
            "to_tsvector('english', coalesce(title, '') || ' ' || coalesce(short_description, '') || ' ' || coalesce(job_role, ''))",
            persisted=True,
        ),
        nullable=True,
    )


    provider: Mapped["Provider | None"] = relationship(back_populates="courses")
    program_sponsor: Mapped["ProgramSponsor | None"] = relationship(back_populates="courses")

    course_sectors: Mapped[list[CourseSector]] = relationship(back_populates="course", cascade="all, delete-orphan")
    course_domains: Mapped[list[CourseDomain]] = relationship(back_populates="course", cascade="all, delete-orphan")
    course_occupations: Mapped[list[CourseOccupation]] = relationship(back_populates="course", cascade="all, delete-orphan")
    course_tags: Mapped[list[CourseTag]] = relationship(back_populates="course", cascade="all, delete-orphan")
    course_nos_codes: Mapped[list[CourseNosCode]] = relationship(back_populates="course", cascade="all, delete-orphan")
    course_qp_codes: Mapped[list[CourseQpCode]] = relationship(back_populates="course", cascade="all, delete-orphan")
    course_programs: Mapped[list[CourseProgram]] = relationship(back_populates="course", cascade="all, delete-orphan")
    course_initiatives: Mapped[list[CourseInitiative]] = relationship(back_populates="course", cascade="all, delete-orphan")
    course_product_types: Mapped[list[CourseProductType]] = relationship(back_populates="course", cascade="all, delete-orphan")
    course_skill_sets: Mapped[list[CourseSkillSet]] = relationship(back_populates="course", cascade="all, delete-orphan")


    __table_args__ = (
        Index("ix_courses_search_vector", "search_vector", postgresql_using="gin"),
        Index("ix_courses_type_availability", "course_type", "availability"),
        Index("ix_courses_price", "price"),
        Index("ix_courses_enrollment", "enrollment_count"),
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
    QpCode,
    Sector,
    SkillSet,
    Tag,
)
