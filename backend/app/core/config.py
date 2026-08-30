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

    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"]

    EXCEL_PATH: str = "docs/SkillIndiaDigital_AllCourses.xlsx"



@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
