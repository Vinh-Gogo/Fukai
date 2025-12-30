"""
Middleware configuration for the RAG server.

This module provides configuration classes and utilities for setting up
middleware behavior through environment variables or configuration files.
"""
import os
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class MiddlewareSettings(BaseSettings):
    """Settings for all middlewares."""

    # Authentication settings
    api_key: Optional[str] = Field(None, env="API_KEY")
    auth_exclude_paths: List[str] = Field(
        default=["/health", "/docs", "/redoc", "/openapi.json", "/api/v1/auth/login"],
        env="AUTH_EXCLUDE_PATHS"
    )

    # CORS settings
    cors_allow_origins: List[str] = Field(
        default=["*"],
        env="CORS_ALLOW_ORIGINS"
    )
    cors_allow_credentials: bool = Field(
        default=True,
        env="CORS_ALLOW_CREDENTIALS"
    )
    cors_allow_methods: List[str] = Field(
        default=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        env="CORS_ALLOW_METHODS"
    )
    cors_allow_headers: List[str] = Field(
        default=["*"],
        env="CORS_ALLOW_HEADERS"
    )

    # Trusted host settings
    trusted_hosts: List[str] = Field(
        default=["*"],
        env="TRUSTED_HOSTS"
    )

    # Rate limiting settings
    rate_limit_requests_per_minute: int = Field(
        default=60,
        env="RATE_LIMIT_REQUESTS_PER_MINUTE"
    )
    rate_limit_exclude_paths: List[str] = Field(
        default=["/health"],
        env="RATE_LIMIT_EXCLUDE_PATHS"
    )

    # Request validation settings
    max_content_length: int = Field(
        default=10 * 1024 * 1024,  # 10MB
        env="MAX_CONTENT_LENGTH"
    )

    # Request logging settings
    logging_exclude_paths: List[str] = Field(
        default=["/health", "/docs", "/redoc", "/openapi.json"],
        env="LOGGING_EXCLUDE_PATHS"
    )

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        "extra": "ignore"
    }


# Global settings instance
middleware_settings = MiddlewareSettings()


def get_middleware_config() -> MiddlewareSettings:
    """Get the current middleware configuration."""
    return middleware_settings


def is_path_excluded(path: str, exclude_list: List[str]) -> bool:
    """Check if a path is in the exclude list."""
    return any(path.startswith(excluded) for excluded in exclude_list)


def should_skip_authentication(path: str) -> bool:
    """Check if authentication should be skipped for this path."""
    return is_path_excluded(path, middleware_settings.auth_exclude_paths)


def should_skip_rate_limiting(path: str) -> bool:
    """Check if rate limiting should be skipped for this path."""
    return is_path_excluded(path, middleware_settings.rate_limit_exclude_paths)


def should_skip_logging(path: str) -> bool:
    """Check if request logging should be skipped for this path."""
    return is_path_excluded(path, middleware_settings.logging_exclude_paths)
