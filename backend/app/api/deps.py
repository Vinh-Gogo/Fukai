"""
FastAPI dependency functions for the Search RAG backend.

This module provides common dependencies used across API endpoints,
including database sessions, authentication, and request context.
"""

import uuid
from typing import Generator, Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import structlog

from app.config.database import get_db
from app.config.settings import settings
from app.core.security import get_token_subject, verify_token
from app.core.exceptions import AuthenticationError, AuthorizationError


# Security scheme for JWT tokens
security = HTTPBearer(auto_error=False)


def get_request_id(request: Request) -> str:
    """
    Generate or retrieve request ID for tracing.

    Args:
        request: FastAPI request object

    Returns:
        Request ID string
    """
    request_id = getattr(request.state, "request_id", None)
    if not request_id:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
    return request_id


def get_logger(request: Request) -> structlog.BoundLoggerLazyProxy:
    """
    Get a logger with request context.

    Args:
        request: FastAPI request object

    Returns:
        Structured logger with request context
    """
    request_id = get_request_id(request)
    return structlog.get_logger().bind(request_id=request_id)


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[str]:
    """
    Get current user from JWT token (optional authentication).

    Args:
        credentials: JWT token credentials

    Returns:
        User ID if authenticated, None otherwise
    """
    if not credentials:
        return None

    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        return None

    user_id = payload.get("sub")
    return user_id


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> str:
    """
    Get current user from JWT token (required authentication).

    Args:
        credentials: JWT token credentials

    Returns:
        User ID

    Raises:
        AuthenticationError: If authentication fails
    """
    if not credentials:
        raise AuthenticationError("Authentication credentials not provided")

    token = credentials.credentials
    user_id = get_token_subject(token)

    if not user_id:
        raise AuthenticationError("Invalid or expired token")

    return user_id


def get_current_user_with_permissions(
    required_permissions: Optional[list] = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """
    Get current user with permission checking.

    Args:
        required_permissions: List of required permissions
        credentials: JWT token credentials

    Returns:
        User info dictionary with permissions

    Raises:
        AuthenticationError: If authentication fails
        AuthorizationError: If permissions are insufficient
    """
    if not credentials:
        raise AuthenticationError("Authentication credentials not provided")

    token = credentials.credentials
    payload = verify_token(token)

    if not payload:
        raise AuthenticationError("Invalid or expired token")

    user_id = payload.get("sub")
    user_permissions = payload.get("permissions", [])
    user_role = payload.get("role", "user")

    if not user_id:
        raise AuthenticationError("Invalid token payload")

    # Check permissions if required
    if required_permissions:
        if not isinstance(user_permissions, list):
            user_permissions = [user_permissions]

        missing_permissions = set(required_permissions) - set(user_permissions)
        if missing_permissions and user_role != "admin":
            raise AuthorizationError(
                f"Missing required permissions: {list(missing_permissions)}"
            )

    return {
        "user_id": user_id,
        "permissions": user_permissions,
        "role": user_role,
    }


def get_db_session(
    request: Request,
    db: Session = Depends(get_db)
) -> Generator[Session, None, None]:
    """
    Get database session with request context logging.

    Args:
        request: FastAPI request object
        db: Database session

    Yields:
        Database session
    """
    logger = get_logger(request)

    try:
        # Log database operation start
        logger.debug("Database session started")

        yield db

        # Log successful completion
        logger.debug("Database session completed")

    except Exception as e:
        # Log database errors
        logger.error(
            "Database session error",
            error=str(e),
            exc_info=True
        )
        raise
    finally:
        # Session cleanup is handled by get_db dependency
        pass


def require_rate_limit(
    request: Request,
    max_requests: int = settings.RATE_LIMIT_REQUESTS,
    window_seconds: int = settings.RATE_LIMIT_WINDOW,
) -> None:
    """
    Rate limiting dependency (placeholder for implementation).

    This is a placeholder that should be replaced with a proper
    rate limiting implementation using Redis or similar.

    Args:
        request: FastAPI request object
        max_requests: Maximum requests allowed in window
        window_seconds: Time window in seconds
    """
    # TODO: Implement rate limiting with Redis
    # For now, this is a no-op
    pass


# Common dependencies for reuse
CommonDeps = dict(
    db=Depends(get_db_session),
    current_user=Depends(get_current_user),
    logger=Depends(get_logger),
    request_id=Depends(get_request_id),
)
