"""Pydantic schemas for authentication and authorization."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserRole(str, Enum):
    """Supported system roles."""

    GOV = "gov"
    PROVIDER = "provider"
    EMPLOYER = "employer"
    CANDIDATE = "candidate"


class UserRegister(BaseModel):
    """User registration request payload."""

    full_name: str = Field(..., min_length=2, max_length=100, description="Full name of the user")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=6, max_length=100, description="Password (min 6 characters)")
    role: UserRole = Field(..., description="Role: 'gov', 'provider', 'employer', or 'candidate'")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        """Normalize email address to lowercase and stripped."""
        return v.strip().lower()

    @field_validator("full_name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        """Clean whitespace in name."""
        return " ".join(v.split())


class UserLogin(BaseModel):
    """User login request payload."""

    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserResponse(BaseModel):
    """Safe user profile response schema (no password hash exposed)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: datetime | None = None


class TokenResponse(BaseModel):
    """Authentication token response payload."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    """Generic status/message response."""

    message: str

