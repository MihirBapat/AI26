"""Job Posting and Job Required Skills models."""

from datetime import datetime
from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base_model import TimestampMixin


class JobPosting(TimestampMixin, Base):
    """Job vacancy posting created directly by an Employer or ingested from external feeds."""

    __tablename__ = "job_postings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employer_id: Mapped[int | None] = mapped_column(
        ForeignKey("employers.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        comment="Null if externally ingested from Adzuna / Open Datasets without direct employer account",
    )

    # Data Provenance
    source: Mapped[str] = mapped_column(
        String(50),
        default="EMPLOYER",
        nullable=False,
        index=True,
        comment="'EMPLOYER', 'ADZUNA', 'GOVERNMENT', 'INTERNAL'",
    )
    source_job_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True, comment="External Job ID from Adzuna etc for deduplication"
    )
    company_name_raw: Mapped[str | None] = mapped_column(
        String(255), nullable=True, comment="Raw company name string for external postings"
    )

    # Job Details
    title: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    normalized_title: Mapped[str | None] = mapped_column(String(500), nullable=True, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    role_category: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True, comment="e.g. 'Software Engineer', 'CNC Operator', 'Data Analyst'"
    )
    industry: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    sector_id: Mapped[int | None] = mapped_column(ForeignKey("sectors.id", ondelete="SET NULL"), nullable=True)

    # Location & Work Modality
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    state: Mapped[str] = mapped_column(String(100), default="Maharashtra", nullable=False)
    employment_type: Mapped[str] = mapped_column(
        String(50), default="Full-time", nullable=False, comment="'Full-time', 'Part-time', 'Contract', 'Internship'"
    )
    work_mode: Mapped[str] = mapped_column(
        String(50), default="On-site", nullable=False, comment="'On-site', 'Remote', 'Hybrid'"
    )

    # Experience & Compensation
    min_experience_years: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_experience_years: Mapped[float | None] = mapped_column(Float, nullable=True)
    min_salary: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    max_salary: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)

    # Lifecycle & Status
    status: Mapped[str] = mapped_column(
        String(50),
        default="published",
        nullable=False,
        index=True,
        comment="'draft', 'published', 'paused', 'closed', 'expired'",
    )
    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    raw_data: Mapped[str | None] = mapped_column(Text, nullable=True, comment="JSON string of external raw payload")

    # Relationships
    employer: Mapped["Employer | None"] = relationship("Employer", back_populates="job_postings")
    sector: Mapped["Sector | None"] = relationship("Sector")
    skills: Mapped[list["JobPostingSkill"]] = relationship(
        "JobPostingSkill", back_populates="job_posting", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_job_postings_source_external_id", "source", "source_job_id"),
        Index("ix_job_postings_district_sector", "district", "sector_id"),
        Index("ix_job_postings_status_posted_at", "status", "posted_at"),
    )

    def __repr__(self) -> str:
        return f"<JobPosting(id={self.id}, title='{self.title}', status='{self.status}')>"


class JobPostingSkill(TimestampMixin, Base):
    """Bridge table: Job Posting ↔ Canonical Required/Preferred Skills."""

    __tablename__ = "job_posting_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job_posting_id: Mapped[int] = mapped_column(
        ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    skill_id: Mapped[int] = mapped_column(
        ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True
    )

    requirement_type: Mapped[str] = mapped_column(
        String(50), default="required", nullable=False, comment="'required', 'preferred'"
    )
    proficiency_level: Mapped[str] = mapped_column(
        String(50), default="intermediate", nullable=False, comment="'beginner', 'intermediate', 'advanced', 'expert'"
    )
    importance_weight: Mapped[float] = mapped_column(
        Float, default=1.0, nullable=False, comment="0.0 to 1.0 weight for gap scoring"
    )
    confidence_score: Mapped[float] = mapped_column(
        Float, default=1.0, nullable=False, comment="Confidence of AI/rule extraction (0.0 to 1.0)"
    )
    extraction_source: Mapped[str] = mapped_column(
        String(50), default="rule_extracted", nullable=False, comment="'manual', 'rule_extracted', 'ai_extracted'"
    )

    job_posting: Mapped[JobPosting] = relationship("JobPosting", back_populates="skills")
    skill: Mapped["Skill"] = relationship("Skill", back_populates="job_skills")

    __table_args__ = (
        Index("ix_jps_job_skill", "job_posting_id", "skill_id", unique=True),
    )

    def __repr__(self) -> str:
        return f"<JobPostingSkill(job_id={self.job_posting_id}, skill_id={self.skill_id}, req='{self.requirement_type}')>"

