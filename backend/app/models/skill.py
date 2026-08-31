"""Canonical Skill Taxonomy, Aliases, and Course Skill Bridge Models."""

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base_model import TimestampMixin


class Skill(TimestampMixin, Base):
    """Canonical Skill entity."""

    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    normalized_name: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True, comment="Lowercase, stripped alphanumeric name"
    )
    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="General",
        index=True,
        comment="e.g. 'Programming Language', 'Database', 'Cloud & DevOps', 'Framework', 'Hardware & Embedded', 'Soft Skill'",
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_skill_id: Mapped[int | None] = mapped_column(ForeignKey("skills.id", ondelete="SET NULL"), nullable=True)
    is_emerging: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    parent_skill: Mapped["Skill | None"] = relationship("Skill", remote_side=[id], backref="child_skills")
    aliases: Mapped[list["SkillAlias"]] = relationship(
        "SkillAlias", back_populates="skill", cascade="all, delete-orphan"
    )
    job_skills: Mapped[list["JobPostingSkill"]] = relationship(
        "JobPostingSkill", back_populates="skill", cascade="all, delete-orphan"
    )
    course_skills: Mapped[list["CourseSkill"]] = relationship(
        "CourseSkill", back_populates="skill", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Skill(id={self.id}, name='{self.name}', category='{self.category}')>"


class SkillAlias(TimestampMixin, Base):
    """Alias variations mapped to canonical Skill (e.g. 'Postgres' -> 'PostgreSQL')."""

    __tablename__ = "skill_aliases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    alias: Mapped[str] = mapped_column(String(255), nullable=False)
    normalized_alias: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True, comment="Lowercase, stripped alias"
    )

    skill: Mapped[Skill] = relationship("Skill", back_populates="aliases")

    def __repr__(self) -> str:
        return f"<SkillAlias(id={self.id}, alias='{self.alias}', skill_id={self.skill_id})>"


class CourseSkill(TimestampMixin, Base):
    """Bridge table: Course ↔ Canonical Skill mapping."""

    __tablename__ = "course_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)

    proficiency_level: Mapped[str] = mapped_column(
        String(50), default="intermediate", nullable=False, comment="'beginner', 'intermediate', 'advanced'"
    )
    is_core: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    weight: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    course: Mapped["Course"] = relationship("Course", backref="course_skill_mappings")
    skill: Mapped[Skill] = relationship("Skill", back_populates="course_skills")

    def __repr__(self) -> str:
        return f"<CourseSkill(course_id={self.course_id}, skill_id={self.skill_id}, level='{self.proficiency_level}')>"

