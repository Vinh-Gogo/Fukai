"""
Rate limiting configuration and middleware
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse

from app.core.config import settings

# Create rate limiter instance
limiter = Limiter(key_func=get_remote_address)

# Rate limit configurations
RATE_LIMITS = {
    # General API limits
    "default": "100/minute",  # General API calls

    # Authentication endpoints
    "auth_login": "5/minute",  # Login attempts
    "auth_register": "3/minute",  # Registration attempts

    # File operations
    "file_upload": "10/minute",  # File uploads
    "file_download": "50/minute",  # File downloads

    # Crawling operations
    "crawl_start": "5/minute",  # Start crawling jobs
    "crawl_status": "30/minute",  # Check crawl status

    # Search operations
    "search_query": "20/minute",  # Search queries

    # Admin operations (stricter limits)
    "admin": "10/minute",  # Administrative operations
}


def get_rate_limit_for_endpoint(endpoint: str) -> str:
    """Get appropriate rate limit for an endpoint"""
    # Check for specific endpoint matches
    for key, limit in RATE_LIMITS.items():
        if key in endpoint:
            return limit

    # Default rate limit
    return RATE_LIMITS["default"]


def create_rate_limit_middleware():
    """Create SlowAPI middleware for rate limiting"""
    return SlowAPIMiddleware


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Handle rate limit exceeded errors"""
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "detail": "Too many requests. Please try again later.",
            "message": str(exc),
        },
        headers={
            "Retry-After": "60",  # Default retry after 60 seconds
        }
    )


# Rate limit decorators for specific endpoints
def auth_login_limit():
    """Rate limit for login attempts"""
    return limiter.limit(RATE_LIMITS["auth_login"])


def auth_register_limit():
    """Rate limit for registration attempts"""
    return limiter.limit(RATE_LIMITS["auth_register"])


def file_upload_limit():
    """Rate limit for file uploads"""
    return limiter.limit(RATE_LIMITS["file_upload"])


def file_download_limit():
    """Rate limit for file downloads"""
    return limiter.limit(RATE_LIMITS["file_download"])


def crawl_start_limit():
    """Rate limit for starting crawl jobs"""
    return limiter.limit(RATE_LIMITS["crawl_start"])


def crawl_status_limit():
    """Rate limit for checking crawl status"""
    return limiter.limit(RATE_LIMITS["crawl_status"])


def search_query_limit():
    """Rate limit for search queries"""
    return limiter.limit(RATE_LIMITS["search_query"])


def admin_limit():
    """Rate limit for administrative operations"""
    return limiter.limit(RATE_LIMITS["admin"])


def default_limit():
    """Default rate limit for API endpoints"""
    return limiter.limit(RATE_LIMITS["default"])
