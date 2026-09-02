"""Application configuration using pydantic-settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application settings loaded from environment variables / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/skill_platform"

    # JWT Authentication & Authorization Settings
    JWT_SECRET_KEY: str = "dev-secret-key-change-in-production-1234567890"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

    APP_NAME: str = "Skill Alignment Platform"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
    ]

    EXCEL_PATH: str = "docs/SkillIndiaDigital_AllCourses.xlsx"

    # Adzuna API Settings
    ADZUNA_APP_ID: str = ""
    ADZUNA_APP_KEY: str = ""
    ADZUNA_COUNTRY: str = "in"
    ADZUNA_BASE_URL: str = "https://api.adzuna.com/v1/api/jobs"
    ADZUNA_TIMEOUT_SECONDS: float = 12.0
    ADZUNA_CACHE_TTL_SECONDS: int = 3600

    # Redis Settings
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_ENABLED: bool = True

    # Email & SMTP Settings
    EMAIL_USER: str = ""
    EMAIL_PASS: str = ""
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 465
    SMTP_USE_SSL: bool = True
    EMAIL_FROM_NAME: str = "Security Verification"

    # OTP Security Configuration
    OTP_EXPIRE_MINUTES: int = 10
    OTP_MAX_ATTEMPTS: int = 5
    OTP_RESEND_COOLDOWN_SECONDS: int = 30



@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
