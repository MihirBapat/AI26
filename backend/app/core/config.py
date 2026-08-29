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


    DATABASE_URL: str


    APP_NAME: str = "Skill Alignment Platform"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False


    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]


    EXCEL_PATH: str = "docs/SkillIndiaDigital_AllCourses.xlsx"


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
