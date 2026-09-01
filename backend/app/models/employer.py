"""Employer model — 1-to-1 extension of User for employer accounts."""

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base_model import TimestampMixin


class Employer(TimestampMixin, Base):
    """Employer organization profile linked directly to a User account."""

    __tablename__ = "employers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    company_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    legal_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    sector_id: Mapped[int | None] = mapped_column(ForeignKey("sectors.id", ondelete="SET NULL"), nullable=True)

    company_size: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="'1-10', '11-50', '51-200', '201-500', '500+'"
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    state: Mapped[str] = mapped_column(String(100), default="Maharashtra", nullable=False)
    pincode: Mapped[str | None] = mapped_column(String(20), nullable=True)

    verification_status: Mapped[str] = mapped_column(
        String(50), default="pending", nullable=False, comment="'pending', 'verified', 'rejected'"
    )
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    sector: Mapped["Sector | None"] = relationship("Sector", foreign_keys=[sector_id])
    job_postings: Mapped[list["JobPosting"]] = relationship(
        "JobPosting", back_populates="employer", cascade="all, delete-orphan"
    )
    validations: Mapped[list["EmployerCourseValidation"]] = relationship(
        "EmployerCourseValidation", back_populates="employer", cascade="all, delete-orphan"
    )
    feedbacks: Mapped[list["EmployerFeedback"]] = relationship(
        "EmployerFeedback", back_populates="employer", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Employer(id={self.id}, company_name='{self.company_name}', user_id={self.user_id})>"

