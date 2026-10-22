from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "AI Mock Interview Platform API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    VERSION: str = "1.0.0"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://ai-mock-interview.onrender.com",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database (Supabase PostgreSQL / local PostgreSQL)
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/mock_interview"

    # Supabase Credentials
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""  # Anon / public key
    SUPABASE_SERVICE_ROLE_KEY: str = ""  # Strictly server-side only
    SUPABASE_JWT_SECRET: str = ""

    # AI Providers Configuration
    TEXT_AI_PROVIDER: str = "gemini"  # gemini, groq
    LIVE_AI_PROVIDER: str = "gemini_live"
    EVALUATION_AI_PROVIDER: str = "gemini"

    # Gemini Settings
    GEMINI_API_KEY: str = ""
    GEMINI_TEXT_MODEL: str = "gemini-2.5-flash"
    GEMINI_LIVE_MODEL: str = "gemini-2.0-flash-exp"

    # Groq Settings (optional fallback)
    GROQ_API_KEY: str = ""
    GROQ_TEXT_MODEL: str = "llama-3.3-70b-versatile"

    # Storage and Recording Configuration
    RECORDING_BUCKET_NAME: str = "interview-recordings"
    MAX_RECORDING_SIZE_MB: int = 50
    MAX_RESUME_SIZE_MB: int = 10


settings = Settings()
