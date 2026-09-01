"""Candidate profile schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class CandidateProfileBase(BaseModel):
    """Base schema for candidate profile."""

    full_name: str | None = None
    age: int | None = Field(None, ge=14, le=100)
    district: str
    primary_goal: str = Field(default="undecided")
    current_education_level: str | None = None
    field_of_interest: str | None = None
    current_skills: str | None = None
    employment_status: str | None = None
    preferred_course_mode: str = Field(default="no_preference")
    willing_to_relocate: bool = Field(default=False)
    preferred_language: str = Field(default="mr")


class CandidateProfileCreate(CandidateProfileBase):
    """Schema for creating a candidate profile."""
    pass


class CandidateProfileUpdate(BaseModel):
    """Schema for updating a candidate profile."""

    full_name: str | None = None
    age: int | None = Field(None, ge=14, le=100)
    district: str | None = None
    primary_goal: str | None = None
    current_education_level: str | None = None
    field_of_interest: str | None = None
    current_skills: str | None = None
    employment_status: str | None = None
    preferred_course_mode: str | None = None
    willing_to_relocate: bool | None = None
    preferred_language: str | None = None


class CandidateProfileResponse(CandidateProfileBase):
    """Schema for returning a candidate profile."""

    id: str
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
