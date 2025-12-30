"""
Middleware configuration for the RAG server.

This module provides configuration classes and utilities for setting up
middleware behavior through environment variables or configuration files.
"""
import os
from typing import List, Optional

# Load .env file if it exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # python-dotenv not available, try manual loading
    env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env')
    if os.path.exists(env_file):
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

class MiddlewareSettings:
    """Settings for all middlewares."""

    def __init__(self):
        # Authentication settings - temporarily disabled for development
        self.api_key: Optional[str] = None  # os.getenv("API_KEY") - disabled
        self.auth_exclude_paths: List[str] = [
            path.strip() for path in os.getenv("AUTH_EXCLUDE_PATHS", "/health,/docs,/redoc,/openapi.json,/api/v1/auth/login,/api/v1/auth/me").split(",")
        ]

        # CORS settings
        self.cors_allow_origins: List[str] = ["*"]
        self.cors_allow_credentials: bool = True
        self.cors_allow_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        self.cors_allow_headers: List[str] = ["*"]

        # Trusted host settings
        self.trusted_hosts: List[str] = ["*"]

        # Rate limiting settings
        self.rate_limit_requests_per_minute: int = 60
        self.rate_limit_exclude_paths: List[str] = ["/health"]

        # Request validation settings
        self.max_content_length: int = 10 * 1024 * 1024  # 10MB

        # Request logging settings
        self.logging_exclude_paths: List[str] = ["/health", "/docs", "/redoc", "/openapi.json"]

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
