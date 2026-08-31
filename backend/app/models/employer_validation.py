"""Employer Course Validation and Feedback Models."""

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base_model import TimestampMixin


class EmployerCourseValidation(TimestampMixin, Base):
    """Employer validation and rating of a specific Skill India Digital course for industry readiness."""

    __tablename__ = "employer_course_validations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employer_id: Mapped[int] = mapped_column(
        ForeignKey("employers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True
    )
    skill_id: Mapped[int | None] = mapped_column(
        ForeignKey("skills.id", ondelete="SET NULL"), nullable=True, index=True
    )

    validation_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="'adequate', 'partially_adequate', 'inadequate', 'obsolete'",
    )
    rating: Mapped[int] = mapped_column(
        Integer, default=3, nullable=False, comment="1 (Poor) to 5 (Excellent)"
    )
    feedback_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    curriculum_recommendation: Mapped[str | None] = mapped_column(Text, nullable=True)
    industry_relevance_score: Mapped[float] = mapped_column(
        Float, default=70.0, nullable=False, comment="0.0 to 100.0 relevance rating"
    )

    # Relationships
    employer: Mapped["Employer"] = relationship("Employer", back_populates="validations")
    course: Mapped["Course"] = relationship("Course")
    skill: Mapped["Skill | None"] = relationship("Skill")

    def __repr__(self) -> str:
        return f"<EmployerCourseValidation(id={self.id}, employer_id={self.employer_id}, course_id={self.course_id}, status='{self.validation_status}')>"


class EmployerFeedback(TimestampMixin, Base):
    """Structured high-level feedback submitted by employers to Government and Providers."""

    __tablename__ = "employer_feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employer_id: Mapped[int] = mapped_column(
        ForeignKey("employers.id", ondelete="CASCADE"), nullable=False, index=True
    )

    feedback_category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        comment="'skill_gap', 'candidate_readiness', 'curriculum_quality', 'equipment_infrastructure', 'trainer_quality', 'emerging_skill', 'obsolete_skill'",
    )
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    sector_id: Mapped[int | None] = mapped_column(ForeignKey("sectors.id", ondelete="SET NULL"), nullable=True)

    detailed_comments: Mapped[str] = mapped_column(Text, nullable=False)
    proposed_interventions: Mapped[str | None] = mapped_column(Text, nullable=True)
    urgency_level: Mapped[str] = mapped_column(
        String(50), default="medium", nullable=False, comment="'low', 'medium', 'high', 'critical'"
    )

    # Relationships
    employer: Mapped["Employer"] = relationship("Employer", back_populates="feedbacks")
    sector: Mapped["Sector | None"] = relationship("Sector")

    def __repr__(self) -> str:
        return f"<EmployerFeedback(id={self.id}, employer_id={self.employer_id}, category='{self.feedback_category}')>"

