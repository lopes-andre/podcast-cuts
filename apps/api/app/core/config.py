"""
Application configuration using Pydantic settings.
"""
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str

    # LLM Providers
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    DEFAULT_LLM_PROVIDER: str = "openai"
    DEFAULT_LLM_MODEL: str = "gpt-4o-mini"

    # ML Models
    HUGGINGFACE_TOKEN: str = ""

    # App Config
    ENVIRONMENT: str = "development"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]


settings = Settings()

