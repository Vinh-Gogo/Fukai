"""
Authentication API endpoints for login, logout, and token management.

This module provides:
- POST /api/v1/auth/login - User login with username/password
- POST /api/v1/auth/logout - User logout (token invalidation)
- GET /api/v1/auth/verify - Token verification
- GET /api/v1/auth/me - Current user information
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any

from .dtos import (
    LoginRequestDTO,
    LoginResponseDTO,
    TokenVerifyResponseDTO,
    LogoutResponseDTO,
    ErrorResponseDTO
)
from ...services.auth_service import auth_service
from ...observability.middleware import get_current_user_optional

# Create router
router = APIRouter(prefix="/auth", tags=["Authentication"])

# Security scheme for documentation
security = HTTPBearer(auto_error=False)

@router.post(
    "/login",
    response_model=LoginResponseDTO,
    summary="User Login",
    description="Authenticate user with username and password, returns JWT access token.",
    responses={
        200: {"description": "Login successful"},
        401: {"description": "Invalid credentials", "model": ErrorResponseDTO},
        422: {"description": "Validation error", "model": ErrorResponseDTO}
    }
)
async def login(login_data: LoginRequestDTO) -> LoginResponseDTO:
    """
    Authenticate user and return access token.

    **Credentials:**
    - **admin/admin123** - Administrator access
    - **user/user123** - Regular user access

    **Returns:**
    - JWT access token valid for 24 hours
    - User information
    - Token expiration details
    """
    result = auth_service.login_user(login_data.username, login_data.password)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "Invalid credentials",
                "message": "Username or password is incorrect"
            }
        )

    access_token, user_info, expires_in = result

    return LoginResponseDTO(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in,
        user=user_info
    )

@router.post(
    "/logout",
    response_model=LogoutResponseDTO,
    summary="User Logout",
    description="Logout user by invalidating the current session.",
    responses={
        200: {"description": "Logout successful"},
        401: {"description": "Not authenticated", "model": ErrorResponseDTO}
    }
)
async def logout(
    current_user: Dict[str, Any] = Depends(get_current_user_optional)
) -> LogoutResponseDTO:
    """
    Logout current user.

    Note: Since JWT tokens are stateless, this endpoint primarily serves
    as a confirmation that the client should discard the token.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "Not authenticated",
                "message": "No valid authentication provided"
            }
        )

    # In a stateless JWT system, logout is primarily client-side
    # The server could maintain a blacklist, but for simplicity we'll just confirm
    return LogoutResponseDTO(
        success=True,
        message=f"User {current_user['username']} logged out successfully"
    )

@router.get(
    "/verify",
    response_model=TokenVerifyResponseDTO,
    summary="Verify Token",
    description="Verify if the provided JWT token is valid and get token information.",
    responses={
        200: {"description": "Token verification result"},
        401: {"description": "Invalid token", "model": ErrorResponseDTO}
    }
)
async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TokenVerifyResponseDTO:
    """
    Verify JWT token validity.

    **Returns:**
    - Whether token is valid
    - User information if valid
    - Token expiration time
    """
    if not credentials:
        return TokenVerifyResponseDTO(
            valid=False,
            user=None,
            expires_at=None
        )

    token = credentials.credentials
    user = auth_service.get_current_user(token)

    if not user:
        return TokenVerifyResponseDTO(
            valid=False,
            user=None,
            expires_at=None
        )

    expires_at = auth_service.get_token_expiration(token)

    return TokenVerifyResponseDTO(
        valid=True,
        user=user,
        expires_at=expires_at
    )

@router.get(
    "/me",
    summary="Current User Info",
    description="Get information about the currently authenticated user.",
    responses={
        200: {"description": "Current user information"},
        401: {"description": "Not authenticated", "model": ErrorResponseDTO}
    }
)
async def get_current_user_info(
    current_user: Dict[str, Any] = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    """
    Get current authenticated user information.

    **Returns:**
    - Username
    - Role
    - Account status
    - Token information
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "Not authenticated",
                "message": "No valid authentication provided"
            }
        )

    return {
        "username": current_user["username"],
        "role": current_user["role"],
        "enabled": current_user["enabled"],
        "token_issued": current_user.get("token_issued"),
        "token_expires": current_user.get("token_expires")
    }

@router.get(
    "/users",
    summary="List Users",
    description="Get list of all users (admin only).",
    responses={
        200: {"description": "List of users"},
        401: {"description": "Not authenticated", "model": ErrorResponseDTO},
        403: {"description": "Insufficient permissions", "model": ErrorResponseDTO}
    }
)
async def list_users(
    current_user: Dict[str, Any] = Depends(get_current_user_optional)
) -> Dict[str, Dict[str, Any]]:
    """
    Get list of all users.

    **Requires:** Admin role

    **Returns:**
    - Dictionary of username -> user_info
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "Not authenticated",
                "message": "Authentication required"
            }
        )

    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "Insufficient permissions",
                "message": "Admin role required"
            }
        )

    return auth_service.get_all_users()
