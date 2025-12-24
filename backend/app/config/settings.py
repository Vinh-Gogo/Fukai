"""
Application settings and configuration using Pydantic BaseSettings.

This module handles all application configuration through environment variables
with sensible defaults for development.
"""

import secrets
from typing import List, Optional, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings with environment variable support.

    All settings can be overridden using environment variables.
    """

    # Project Information
    PROJECT_NAME: str = "Search RAG Backend"
    PROJECT_DESCRIPTION: str = "FastAPI backend for document search and RAG operations"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",  # Next.js dev server
        "http://localhost:8000",  # FastAPI dev server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(
        cls, v: Union[str, List[str]]
    ) -> Union[List[str], str]:
        """Parse CORS origins from environment variable."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Security Configuration (disabled for now)
    # SECRET_KEY: str = secrets.token_urlsafe(32)
    # ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    # ALGORITHM: str = "HS256"

    # Trusted Hosts (for production)
    ALLOWED_HOSTS: List[str] = ["*"]  # In production, specify actual hosts

    # Database Configuration
    DATABASE_URL: str = "sqlite:///./search_rag.db"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # Vector Database (Qdrant)
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: Optional[str] = None
    QDRANT_COLLECTION_NAME: str = "documents"

    # LLM Configuration
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    DEFAULT_LLM_PROVIDER: str = "openai"
    DEFAULT_EMBEDDING_MODEL: str = "text-embedding-ada-002"
    DEFAULT_LLM_MODEL: str = "gpt-4"

    # File Storage Configuration
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_FILE_TYPES: List[str] = [".pdf", ".txt", ".md", ".docx"]

    # Background Tasks (Celery)
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds

    # Search Configuration
    MAX_SEARCH_RESULTS: int = 20
    SEARCH_SIMILARITY_THRESHOLD: float = 0.7

    # RAG Configuration
    RAG_CONTEXT_WINDOW: int = 4000
    RAG_MAX_TOKENS: int = 1000
    RAG_TEMPERATURE: float = 0.1

    # Crawler Configuration
    CRAWLER_BASE_URL: str = 'https://biwase.com.vn/tin-tuc/ban-tin-biwase'
    CRAWLER_RATE_LIMIT_DELAY: int = 1  # seconds between requests
    CRAWLER_REQUEST_TIMEOUT: int = 30  # seconds
    CRAWLER_DOWNLOAD_TIMEOUT: int = 60  # seconds for downloads

    class Config:
        """Pydantic configuration."""
        env_file = ".env"
        case_sensitive = True


# Create global settings instance
settings = Settings()
