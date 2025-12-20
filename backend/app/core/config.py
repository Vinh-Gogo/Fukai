"""
Application configuration using Pydantic settings
"""
from typing import List, Optional, Union
from pydantic import field_validator, ValidationInfo, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables
    """

    # Project
    PROJECT_NAME: str = "FastAPI Backend"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your-secret-key-here"  # Change in production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Server
    SERVER_NAME: str = "FastAPI Backend"
    SERVER_HOST: str = "http://localhost"
    DEBUG: bool = True

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # Next.js frontend
        "http://localhost:8000",  # FastAPI docs
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(
        cls, v: Union[str, List[str]], info: ValidationInfo
    ) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Trusted hosts
    ALLOWED_HOSTS: Optional[List[str]] = ["localhost", "127.0.0.1"]

    # Database
    DATABASE_URL: str = "sqlite:///./app.db"
    DATABASE_ECHO: bool = False

    # File storage
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS: List[str] = [".pdf"]

    # Crawling
    CRAWL_USER_AGENT: str = "FastAPI-Crawler/1.0"
    CRAWL_TIMEOUT: int = 30
    CRAWL_MAX_CONCURRENT: int = 5
    CRAWL_DELAY: float = 1.0  # seconds between requests

    # Biwase specific
    BIWASE_BASE_URL: str = "https://biwase.com.vn/tin-tuc/ban-tin-biwase"
    BIWASE_MAX_PAGES: int = 10
    BIWASE_MAX_DEPTH: int = 2

    # External APIs (for future integration)
    NEXTJS_API_URL: str = "http://localhost:3000"

    # HuggingFace (optional)
    HF_TOKEN: Optional[str] = Field(default=None, description="HuggingFace API Token (optional)")

    # QDrant Vector Database
    QDRANT_API_KEY: Optional[str] = Field(default=None, description="QDrant Cloud API Key")
    QDRANT_URL: Optional[str] = Field(default=None, description="QDrant Cloud URL")

    @field_validator("QDRANT_API_KEY", "QDRANT_URL", mode="after")
    @classmethod
    def validate_qdrant_config(cls, v, info: ValidationInfo):
        """Validate QDrant configuration is complete"""
        if info.field_name == "QDRANT_API_KEY" and v is None:
            raise ValueError("QDRANT_API_KEY is required for RAG functionality")
        if info.field_name == "QDRANT_URL" and v is None:
            raise ValueError("QDRANT_URL is required for RAG functionality")
        return v

    # Embedding Service Configuration
    OPENAI_API_MODEL_NAME_EMBED: str = "Qwen/Qwen3-Embedding-0.6B"
    OPENAI_BASE_URL_EMBED: str = "http://localhost:8080/v1"
    OPENAI_API_KEY_EMBED: str = "text"

    # JWT Authentication
    JWT_SECRET_KEY: str = "your-jwt-secret-key-here-change-in-production-secure-random-key"  # Change in production
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24 hours

    # PDF Processing
    PDF_PROCESSING_DIR: str = "./processed_pdfs"
    MARKDOWN_OUTPUT_DIR: str = "./markdown_output"
    MAX_CONCURRENT_PDF_JOBS: int = 2
    PDF_PROCESSING_TIMEOUT: int = 300  # 5 minutes

    # RAG Configuration
    QDRANT_COLLECTION_NAME: str = "rag_documents"
    EMBEDDING_DIMENSION: int = 1024  # Qwen3-Embedding-0.6B dimension
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    MAX_RETRIEVED_DOCS: int = 5

    class Config:
        env_file = ".env"
        case_sensitive = True


# Create global settings instance
settings = Settings()
