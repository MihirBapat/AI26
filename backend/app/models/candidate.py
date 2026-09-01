"""Candidate Profile model."""

import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base_model import TimestampMixin


class CandidateProfile(TimestampMixin, Base):
    """Candidate profile database model."""

    __tablename__ = "candidate_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True
    )

    full_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    district: Mapped[str] = mapped_column(String(50), nullable=False)
    primary_goal: Mapped[str] = mapped_column(String(30), nullable=False, default="undecided")
    current_education_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    field_of_interest: Mapped[str | None] = mapped_column(Text, nullable=True)
    current_skills: Mapped[str | None] = mapped_column(Text, nullable=True)
    employment_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    preferred_course_mode: Mapped[str] = mapped_column(String(20), default="no_preference")
    willing_to_relocate: Mapped[bool] = mapped_column(Boolean, default=False)
    preferred_language: Mapped[str] = mapped_column(String(5), default="mr")

    user = relationship("User", backref="candidate_profile")

    def __repr__(self) -> str:
        return f"<CandidateProfile(id='{self.id}', user_id={self.user_id}, district='{self.district}')>"
