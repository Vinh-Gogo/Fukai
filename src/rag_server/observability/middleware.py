from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from fastapi import HTTPException, Request as FastAPIRequest
from fastapi.responses import JSONResponse
from .logging import get_logger
from .middleware_config import (
    get_middleware_config,
    should_skip_authentication,
    should_skip_rate_limiting,
    should_skip_logging
)
from ..services.activities_service import log_activity
from ..services.auth_service import auth_service
import time
import re
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio
from collections import defaultdict

logger = get_logger("observability.middleware")
config = get_middleware_config()

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Enhanced request logging middleware with activity tracking."""

    def __init__(self, app, exclude_paths: Optional[list] = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or config.logging_exclude_paths

    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.time()
        response = await call_next(request)
        duration_ms = (time.time() - start) * 1000

        # Skip logging for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return response

        # Log to structured logger
        logger.info(
            f"{request.method} {request.url.path} completed_in={duration_ms:.2f}ms "
            f"status_code={response.status_code} client_ip={self._get_client_ip(request)}"
        )

        # Log API activity to database (only for API endpoints)
        if request.url.path.startswith("/api/"):
            await self._log_api_activity(request, response, duration_ms)

        return response

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request."""
        # Check X-Forwarded-For header first (for proxies/load balancers)
        x_forwarded_for = request.headers.get("X-Forwarded-For")
        if x_forwarded_for:
            # Take the first IP in case of multiple
            return x_forwarded_for.split(",")[0].strip()

        # Fall back to X-Real-IP
        x_real_ip = request.headers.get("X-Real-IP")
        if x_real_ip:
            return x_real_ip

        # Fall back to direct client
        return request.client.host if request.client else "unknown"

    async def _log_api_activity(self, request: Request, response: Response, duration_ms: float):
        """Log API activity to the activities database."""
        try:
            # Extract endpoint info
            path_parts = request.url.path.strip("/").split("/")
            if len(path_parts) >= 3 and path_parts[0] == "api" and path_parts[1] == "v1":
                api_module = path_parts[2] if len(path_parts) > 2 else "unknown"
                activity_type = f"api_{api_module}_accessed"
            else:
                activity_type = "api_accessed"

            # Determine success/failure
            success = 200 <= response.status_code < 400
            action = "succeeded" if success else "failed"

            # Extract details
            details = {
                "method": request.method,
                "path": request.url.path,
                "query_params": dict(request.query_params),
                "status_code": response.status_code,
                "duration_ms": round(duration_ms, 2),
                "user_agent": request.headers.get("User-Agent", ""),
            }

            # Add error details for failures
            if not success:
                details["error_category"] = self._categorize_error(response.status_code)

            await log_activity(
                activity_type=activity_type,
                entity_type="API",
                action=action,
                details=details,
                ip_address=self._get_client_ip(request),
                user_agent=request.headers.get("User-Agent", "")
            )
        except Exception as e:
            logger.error(f"Failed to log API activity: {e}")

    def _categorize_error(self, status_code: int) -> str:
        """Categorize HTTP error codes."""
        if status_code == 400:
            return "bad_request"
        elif status_code == 401:
            return "unauthorized"
        elif status_code == 403:
            return "forbidden"
        elif status_code == 404:
            return "not_found"
        elif status_code == 422:
            return "validation_error"
        elif status_code >= 500:
            return "server_error"
        else:
            return "client_error"

class AuthenticationMiddleware(BaseHTTPMiddleware):
    """Enhanced authentication middleware supporting both API keys and JWT tokens."""

    def __init__(self, app, api_key: Optional[str] = None, exclude_paths: Optional[list] = None):
        super().__init__(app)
        self.api_key = api_key or config.api_key
        self.exclude_paths = exclude_paths or config.auth_exclude_paths
        print(f"DEBUG: AuthenticationMiddleware initialized with api_key={self.api_key}, exclude_paths={self.exclude_paths}")

    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip authentication entirely if no API key is configured (development mode)
        if self.api_key is None:
            print(f"DEBUG: Authentication disabled (no API key configured) for {request.url.path}")
            # Add default user info for activity logging
            request.state.user_id = "anonymous"
            request.state.user_role = "user"
            request.state.auth_method = "none"
            return await call_next(request)

        # Skip authentication for excluded paths
        # For root path '/', use exact match. For others, use starts_with logic
        is_excluded = False
        matching_path = None
        for exclude_path in self.exclude_paths:
            if exclude_path == "/":
                # Exact match for root path
                is_excluded = request.url.path == "/"
            else:
                # Prefix match for other paths
                is_excluded = request.url.path.startswith(exclude_path)
            if is_excluded:
                matching_path = exclude_path
                break

        if is_excluded:
            print(f"DEBUG: Path {request.url.path} is excluded from authentication (matched: {matching_path})")
            return await call_next(request)

        print(f"DEBUG: Authenticating request to {request.url.path}")
        print(f"DEBUG: Headers: {dict(request.headers)}")

        # Try JWT token authentication first
        auth_header = request.headers.get("Authorization")
        user_info = None

        print(f"DEBUG: Authorization header: {auth_header}")

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]  # Remove "Bearer " prefix
            print(f"DEBUG: Trying JWT token: {token[:20]}...")
            user_info = auth_service.get_current_user(token)
            print(f"DEBUG: JWT result: {user_info}")

        # If JWT authentication failed or wasn't provided, try API key
        if not user_info:
            api_key = request.headers.get("X-API-Key")
            print(f"DEBUG: API key from header: {api_key}")
            print(f"DEBUG: Expected API key: {self.api_key}")
            print(f"DEBUG: API key match: {api_key == self.api_key if api_key and self.api_key else 'N/A'}")

            if api_key and self.api_key and api_key == self.api_key:
                # API key authentication successful
                print("DEBUG: API key authentication successful")
                user_info = {
                    "username": "api_key_user",
                    "role": "api_user",
                    "enabled": True,
                    "auth_method": "api_key"
                }
            elif api_key:
                # API key provided but invalid
                print("DEBUG: API key provided but invalid")
                return JSONResponse(
                    status_code=403,
                    content={"error": "Invalid API key", "message": "The provided API key is not valid"}
                )

        # If neither authentication method worked
        if not user_info:
            print("DEBUG: No authentication method worked")
            return JSONResponse(
                status_code=401,
                content={
                    "error": "Authentication required",
                    "message": "Please provide either Authorization header with Bearer token or X-API-Key header"
                }
            )

        # Add user info to request state for activity logging and dependency injection
        request.state.user_id = user_info["username"]
        request.state.user_role = user_info["role"]
        request.state.auth_method = user_info.get("auth_method", "jwt")

        print(f"DEBUG: Authentication successful for user: {user_info['username']}")
        return await call_next(request)

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Global error handling middleware."""

    async def dispatch(self, request: Request, call_next) -> Response:
        try:
            response = await call_next(request)
            return response
        except HTTPException as e:
            # Handle FastAPI HTTP exceptions
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "error": "HTTP Exception",
                    "message": e.detail,
                    "status_code": e.status_code
                }
            )
        except Exception as e:
            # Handle unexpected errors
            logger.error(f"Unexpected error: {e}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal Server Error",
                    "message": "An unexpected error occurred",
                    "status_code": 500
                }
            )

class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiting middleware."""

    def __init__(self, app, requests_per_minute: Optional[int] = None, exclude_paths: Optional[list] = None):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute or config.rate_limit_requests_per_minute
        self.exclude_paths = exclude_paths or config.rate_limit_exclude_paths
        self.requests = defaultdict(list)  # client_ip -> list of timestamps

    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip rate limiting for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        now = datetime.utcnow()

        # Clean old requests (older than 1 minute)
        self.requests[client_ip] = [
            timestamp for timestamp in self.requests[client_ip]
            if now - timestamp < timedelta(minutes=1)
        ]

        # Check rate limit
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests. Limit: {self.requests_per_minute} per minute",
                    "retry_after": 60
                },
                headers={"Retry-After": "60"}
            )

        # Add current request timestamp
        self.requests[client_ip].append(now)

        response = await call_next(request)
        return response

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address."""
        x_forwarded_for = request.headers.get("X-Forwarded-For")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Request validation and sanitization middleware."""

    def __init__(self, app, max_content_length: Optional[int] = None):
        super().__init__(app)
        self.max_content_length = max_content_length or config.max_content_length

    async def dispatch(self, request: Request, call_next) -> Response:
        # Check content length
        content_length = request.headers.get("Content-Length")
        if content_length:
            try:
                content_length_int = int(content_length)
                if content_length_int > self.max_content_length:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "error": "Payload too large",
                            "message": f"Request payload exceeds maximum size of {self.max_content_length} bytes"
                        }
                    )
            except ValueError:
                pass  # Invalid Content-Length header, let it pass

        # Validate URL path (prevent path traversal)
        if ".." in request.url.path or not request.url.path.startswith("/"):
            return JSONResponse(
                status_code=400,
                content={
                    "error": "Invalid request path",
                    "message": "Request path contains invalid characters"
                }
            )

        return await call_next(request)

# Pre-configured middleware instances
def create_cors_middleware(app):
    """Create CORS middleware with sensible defaults."""
    return CORSMiddleware(
        app,
        allow_origins=["*"],  # Configure this based on your needs
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

def create_trusted_host_middleware(app, allowed_hosts: Optional[list] = None):
    """Create trusted host middleware."""
    if allowed_hosts is None:
        allowed_hosts = ["*"]  # Allow all in development
    return TrustedHostMiddleware(app, allowed_hosts=allowed_hosts)

# Dependency injection helpers
def get_current_user_optional(request: Request) -> Optional[Dict[str, Any]]:
    """
    Get current user from request state (optional).

    Returns None if no user is authenticated.
    """
    if hasattr(request.state, 'user_id'):
        return {
            "username": getattr(request.state, 'user_id', None),
            "role": getattr(request.state, 'user_role', None),
            "auth_method": getattr(request.state, 'auth_method', 'unknown')
        }
    return None

def get_current_user(request: Request) -> Dict[str, Any]:
    """
    Get current user from request state (required).

    Raises HTTPException if no user is authenticated.
    """
    user = get_current_user_optional(request)
    if not user:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=401,
            detail={
                "error": "Authentication required",
                "message": "You must be authenticated to access this resource"
            }
        )
    return user
