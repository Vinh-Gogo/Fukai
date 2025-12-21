"""
Application configuration using Pydantic settings with centralized validation
"""
import os
import secrets
from pathlib import Path
from typing import Dict, Any, List, Optional, Union, Literal
from pydantic import field_validator, ValidationInfo, Field, model_validator
from pydantic_settings import BaseSettings
import logging

logger = logging.getLogger(__name__)

# Environment types
Environment = Literal["development", "staging", "production"]


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables with centralized validation
    """

    # Environment
    ENVIRONMENT: Environment = "development"

    # Project
    PROJECT_NAME: str = "FastAPI Backend"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32), min_length=32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, gt=0, le=1440)

    # Server
    SERVER_NAME: str = "FastAPI Backend"
    SERVER_HOST: str = "http://localhost"
    DEBUG: bool = True

    # CORS
    BACKEND_CORS_ORIGINS_STR: str = "http://localhost:3000,http://localhost:8000"

    @property
    def BACKEND_CORS_ORIGINS(self) -> List[str]:
        """Get CORS origins as a list"""
        if hasattr(self, '_cors_origins_cache'):
            return self._cors_origins_cache

        origins_str = self.BACKEND_CORS_ORIGINS_STR
        if origins_str.startswith("["):
            # JSON array format
            import json
            try:
                self._cors_origins_cache = json.loads(origins_str)
            except json.JSONDecodeError:
                raise ValueError(f"Invalid JSON format for BACKEND_CORS_ORIGINS: {origins_str}")
        else:
            # Comma-separated format
            self._cors_origins_cache = [i.strip() for i in origins_str.split(",") if i.strip()]

        return self._cors_origins_cache

    # Trusted hosts
    ALLOWED_HOSTS_STR: str = "localhost,127.0.0.1"

    @property
    def ALLOWED_HOSTS(self) -> Optional[List[str]]:
        """Get allowed hosts as a list"""
        if hasattr(self, '_allowed_hosts_cache'):
            return self._allowed_hosts_cache

        hosts_str = self.ALLOWED_HOSTS_STR
        if not hosts_str:
            self._allowed_hosts_cache = None
        else:
            self._allowed_hosts_cache = [i.strip() for i in hosts_str.split(",") if i.strip()]

        return self._allowed_hosts_cache

    # Database
    DATABASE_URL: str = "sqlite:///./app.db"
    DATABASE_ECHO: bool = False

    # File storage
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS_STR: str = ".pdf"

    @property
    def ALLOWED_EXTENSIONS(self) -> List[str]:
        """Get allowed extensions as a list"""
        if hasattr(self, '_allowed_extensions_cache'):
            return self._allowed_extensions_cache

        extensions_str = self.ALLOWED_EXTENSIONS_STR
        if extensions_str.startswith("["):
            # JSON array format
            import json
            try:
                self._allowed_extensions_cache = json.loads(extensions_str)
            except json.JSONDecodeError:
                raise ValueError(f"Invalid JSON format for ALLOWED_EXTENSIONS: {extensions_str}")
        else:
            # Comma-separated format
            self._allowed_extensions_cache = [i.strip() for i in extensions_str.split(",") if i.strip()]

        return self._allowed_extensions_cache

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
        """Validate QDrant configuration - only required in production"""
        # Only require QDrant in production environment
        if cls().ENVIRONMENT == "production":
            if info.field_name == "QDRANT_API_KEY" and v is None:
                raise ValueError("QDRANT_API_KEY is required for RAG functionality in production")
            if info.field_name == "QDRANT_URL" and v is None:
                raise ValueError("QDRANT_URL is required for RAG functionality in production")
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

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Validate database URL format"""
        if not v:
            raise ValueError("DATABASE_URL cannot be empty")

        # Basic validation for common database schemes
        valid_schemes = ["sqlite://", "postgresql://", "mysql://", "mongodb://"]
        if not any(v.startswith(scheme) for scheme in valid_schemes):
            raise ValueError(f"DATABASE_URL must start with one of: {', '.join(valid_schemes)}")

        return v

    @field_validator("MAX_UPLOAD_SIZE", mode="after")
    @classmethod
    def validate_max_upload_size(cls, v: int) -> int:
        """Validate maximum upload size"""
        min_size = 1024  # 1KB minimum
        max_size = 500 * 1024 * 1024  # 500MB maximum

        if v < min_size:
            raise ValueError(f"MAX_UPLOAD_SIZE must be at least {min_size} bytes (1KB)")
        if v > max_size:
            raise ValueError(f"MAX_UPLOAD_SIZE cannot exceed {max_size} bytes (500MB)")

        return v

    @field_validator("JWT_SECRET_KEY", mode="after")
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        """Validate JWT secret key strength"""
        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters long")
        return v

    @field_validator("OPENAI_BASE_URL_EMBED", mode="after")
    @classmethod
    def validate_embedding_url(cls, v: str) -> str:
        """Validate embedding service URL"""
        if not v.startswith(("http://", "https://")):
            raise ValueError("OPENAI_BASE_URL_EMBED must be a valid HTTP/HTTPS URL")
        return v

    @field_validator("BIWASE_BASE_URL", mode="after")
    @classmethod
    def validate_biwase_url(cls, v: str) -> str:
        """Validate Biwase base URL"""
        if not v.startswith(("http://", "https://")):
            raise ValueError("BIWASE_BASE_URL must be a valid HTTP/HTTPS URL")
        return v

    @model_validator(mode="after")
    def validate_environment_config(self) -> "Settings":
        """Validate environment-specific configuration"""
        if self.ENVIRONMENT == "production":
            # Production-specific validations
            if self.DEBUG:
                raise ValueError("DEBUG must be False in production")

            if "your-" in self.SECRET_KEY.lower():
                raise ValueError("SECRET_KEY must be changed from default in production")

            if "your-" in self.JWT_SECRET_KEY.lower():
                raise ValueError("JWT_SECRET_KEY must be changed from default in production")

            # Validate required URLs
            required_urls = [
                ("QDRANT_URL", self.QDRANT_URL),
                ("QDRANT_API_KEY", self.QDRANT_API_KEY),
            ]

            for name, value in required_urls:
                if not value:
                    raise ValueError(f"{name} is required in production environment")

        # Validate directory paths exist or can be created
        dirs_to_check = [
            ("UPLOAD_DIR", self.UPLOAD_DIR),
            ("PDF_PROCESSING_DIR", self.PDF_PROCESSING_DIR),
            ("MARKDOWN_OUTPUT_DIR", self.MARKDOWN_OUTPUT_DIR),
        ]

        for name, path_str in dirs_to_check:
            path = Path(path_str)
            if not path.exists():
                try:
                    path.mkdir(parents=True, exist_ok=True)
                    logger.info(f"Created directory: {path}")
                except Exception as e:
                    logger.warning(f"Could not create {name} directory {path}: {e}")

        return self

    def get_environment_config(self) -> Dict[str, Any]:
        """Get environment-specific configuration"""
        base_config = {
            "debug": self.DEBUG,
            "cors_origins": self.BACKEND_CORS_ORIGINS,
            "database_echo": self.DATABASE_ECHO,
        }

        if self.ENVIRONMENT == "development":
            return {
                **base_config,
                "debug": True,
                "cors_origins": ["http://localhost:3000", "http://localhost:8000", "http://127.0.0.1:3000"],
                "database_echo": True,  # Enable SQL logging in development
            }
        elif self.ENVIRONMENT == "staging":
            return {
                **base_config,
                "debug": False,
                "cors_origins": self.BACKEND_CORS_ORIGINS,  # Use configured origins
                "database_echo": False,
            }
        elif self.ENVIRONMENT == "production":
            return {
                **base_config,
                "debug": False,
                "cors_origins": self.BACKEND_CORS_ORIGINS,
                "database_echo": False,
            }

        return base_config

    def validate_configuration(self) -> Dict[str, Any]:
        """Comprehensive configuration validation and health check"""
        validation_results = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "checks": {}
        }

        # Check directory permissions
        dirs_to_check = [
            ("upload_dir", self.UPLOAD_DIR),
            ("pdf_processing_dir", self.PDF_PROCESSING_DIR),
            ("markdown_output_dir", self.MARKDOWN_OUTPUT_DIR),
        ]

        for name, path_str in dirs_to_check:
            path = Path(path_str)
            try:
                path.mkdir(parents=True, exist_ok=True)
                # Test write permissions
                test_file = path / ".test_write"
                test_file.write_text("test")
                test_file.unlink()
                validation_results["checks"][name] = "OK"
            except Exception as e:
                validation_results["errors"].append(f"{name}: {str(e)}")
                validation_results["valid"] = False

        # Check database connectivity (basic check)
        try:
            if self.DATABASE_URL.startswith("sqlite://"):
                db_path = self.DATABASE_URL.replace("sqlite:///", "")
                if db_path != ":memory:":
                    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
            validation_results["checks"]["database"] = "OK"
        except Exception as e:
            validation_results["errors"].append(f"Database configuration: {str(e)}")
            validation_results["valid"] = False

        # Check external service URLs
        external_urls = [
            ("embedding_service", self.OPENAI_BASE_URL_EMBED),
            ("biwase_base", self.BIWASE_BASE_URL),
            ("nextjs_api", self.NEXTJS_API_URL),
        ]

        for name, url in external_urls:
            if not url.startswith(("http://", "https://")):
                validation_results["errors"].append(f"{name}: Invalid URL format")
                validation_results["valid"] = False
            else:
                validation_results["checks"][name] = "URL format OK"

        # Security checks
        if self.ENVIRONMENT == "production":
            if len(self.SECRET_KEY) < 32:
                validation_results["errors"].append("SECRET_KEY too short for production")
                validation_results["valid"] = False

            if len(self.JWT_SECRET_KEY) < 32:
                validation_results["errors"].append("JWT_SECRET_KEY too short for production")
                validation_results["valid"] = False

        # Performance warnings
        if self.MAX_CONCURRENT_PDF_JOBS > 10:
            validation_results["warnings"].append("High MAX_CONCURRENT_PDF_JOBS may impact performance")

        if self.CRAWL_MAX_CONCURRENT > 20:
            validation_results["warnings"].append("High CRAWL_MAX_CONCURRENT may trigger rate limits")

        return validation_results

    class Config:
        # Load environment files in order of precedence
        # In test environment, only load .env.test to avoid conflicts
        env_file = (".env.test",) if os.getenv("PYTEST_CURRENT_TEST") else (".env.test", ".env")
        case_sensitive = True


# Create lazy-loaded settings instance
def get_settings() -> Settings:
    """Get the global settings instance"""
    if not hasattr(get_settings, '_settings'):
        get_settings._settings = Settings()
    return get_settings._settings

# For backward compatibility, keep a settings instance
settings = get_settings()
