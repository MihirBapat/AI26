"""Lookup / reference-data models.

These correspond to the Excel lookup sheets (Sectors, Domains, Learning Providers,
Programs, Program Sponsors, Initiatives, Languages) plus additional normalised
entities extracted from comma-separated course columns (Occupations, Tags,
NOS Codes, QP Codes, Product Types, Skill Sets).
"""

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base_model import TimestampMixin


class Sector(TimestampMixin, Base):
    """Industry sectors (e.g. Agriculture, IT-ITeS, Power)."""

    __tablename__ = "sectors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sid_id: Mapped[int | None] = mapped_column(Integer, unique=True, nullable=True, comment="Original Skill India Digital numeric ID")
    code: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True, comment="Sector code from API")
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)


    domains: Mapped[list["Domain"]] = relationship(back_populates="sector")
    course_sectors: Mapped[list["CourseSector"]] = relationship(back_populates="sector")


class Domain(TimestampMixin, Base):
    """Sub-domains within a sector (e.g. Distribution under Power)."""

    __tablename__ = "domains"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sid_id: Mapped[int | None] = mapped_column(Integer, unique=True, nullable=True, comment="Original SID domain ID")
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    sector_id: Mapped[int | None] = mapped_column(ForeignKey("sectors.id"), nullable=True)

    sector: Mapped[Sector | None] = relationship(back_populates="domains")
    course_domains: Mapped[list["CourseDomain"]] = relationship(back_populates="domain")


class Provider(TimestampMixin, Base):
    """Course learning providers / training partners."""

    __tablename__ = "providers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sid_id: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True, comment="Original UUID from SID")
    name: Mapped[str] = mapped_column(String(500), nullable=False, unique=True, index=True)

    courses: Mapped[list["Course"]] = relationship(back_populates="provider")


class ProgramSponsor(TimestampMixin, Base):
    """Who sponsors the program (e.g. Govt. of India, State Govt.)."""

    __tablename__ = "program_sponsors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sid_id: Mapped[int | None] = mapped_column(Integer, unique=True, nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)

    courses: Mapped[list["Course"]] = relationship(back_populates="program_sponsor")


class Occupation(TimestampMixin, Base):
    """Occupation titles extracted from course data."""

    __tablename__ = "occupations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False, unique=True, index=True)

    course_occupations: Mapped[list["CourseOccupation"]] = relationship(back_populates="occupation")


class Tag(TimestampMixin, Base):
    """Tags extracted from course metadata."""

    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False, unique=True, index=True)

    course_tags: Mapped[list["CourseTag"]] = relationship(back_populates="tag")


class NosCode(TimestampMixin, Base):
    """National Occupational Standards codes."""

    __tablename__ = "nos_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)

    course_nos_codes: Mapped[list["CourseNosCode"]] = relationship(back_populates="nos_code")


class QpCode(TimestampMixin, Base):
    """Qualification Pack codes."""

    __tablename__ = "qp_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)

    course_qp_codes: Mapped[list["CourseQpCode"]] = relationship(back_populates="qp_code")


class Program(TimestampMixin, Base):
    """Programs (e.g. PMKVY-Short Term Training, NSDC Academy)."""

    __tablename__ = "programs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sid_id: Mapped[int | None] = mapped_column(Integer, unique=True, nullable=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False, unique=True, index=True)

    course_programs: Mapped[list["CourseProgram"]] = relationship(back_populates="program")


class Initiative(TimestampMixin, Base):
    """Initiatives (e.g. Ministry of Skill Development, NSDC International)."""

    __tablename__ = "initiatives"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sid_id: Mapped[int | None] = mapped_column(Integer, unique=True, nullable=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False, unique=True, index=True)

    course_initiatives: Mapped[list["CourseInitiative"]] = relationship(back_populates="initiative")


class ProductType(TimestampMixin, Base):
    """Learning product types (e.g. Skill Course, Diploma, Certificate Course)."""

    __tablename__ = "product_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sid_id: Mapped[int | None] = mapped_column(Integer, unique=True, nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)

    course_product_types: Mapped[list["CourseProductType"]] = relationship(back_populates="product_type")


class SkillSet(TimestampMixin, Base):
    """Skill sets associated with courses."""

    __tablename__ = "skill_sets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False, unique=True, index=True)

    course_skill_sets: Mapped[list["CourseSkillSet"]] = relationship(back_populates="skill_set")


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
