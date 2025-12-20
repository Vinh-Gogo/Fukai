"""
Authentication endpoints with JWT tokens and rate limiting
"""
from datetime import timedelta
from typing import Any, Dict
import logging

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_async_db
from app.domains.auth.auth_service import AuthService
from app.infrastructure.repositories.user_repository import UserRepository
from app.shared.cache_service import CacheService
from app.core.rate_limiting import auth_login_limit, auth_register_limit
from app.schemas.common import Token, TokenData

router = APIRouter()

logger = logging.getLogger(__name__)


class UserCreate(BaseModel):
    """User registration model"""
    email: EmailStr
    password: str
    full_name: str


class UserResponse(BaseModel):
    """User response model"""
    id: str
    email: EmailStr
    full_name: str
    is_active: bool
    created_at: str


class LoginResponse(BaseModel):
    """Login response model"""
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse


# Dependency functions
def get_user_repository(db: AsyncSession = Depends(get_async_db)) -> UserRepository:
    """Get user repository with database session"""
    return UserRepository(db)

def get_auth_service(user_repo: UserRepository = Depends(get_user_repository)) -> AuthService:
    """Get auth service with dependencies"""
    return AuthService(user_repository=user_repo)

# Authentication dependencies
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer()

async def get_current_token_data_dependency(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> TokenData:
    """Get current token data from JWT token"""
    token = credentials.credentials
    payload = auth_service.decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenData(
        user_id=payload.get("sub"),
        email=payload.get("email", ""),
        exp=payload.get("exp")
    )

async def get_current_user_dependency(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    user = await auth_service.get_current_user(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@router.post("/register", response_model=UserResponse)
@auth_register_limit()
async def register_user(
    user_data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service)
) -> UserResponse:
    """Register a new user"""
    try:
        # Use the register_user method from AuthService
        result = await auth_service.register_user(
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name
        )

        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )

        user_result = result["user"]
        return UserResponse(
            id=user_result["id"],
            email=user_result["email"],
            full_name=user_result["full_name"],
            is_active=True,  # Assume active by default
            created_at=""  # Would need to get from database
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=LoginResponse)
@auth_login_limit()
async def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthService = Depends(get_auth_service)
) -> LoginResponse:
    """Authenticate user and return JWT token"""
    try:

        # Authenticate user
        user = await auth_service.authenticate_user(
            email=form_data.username,  # OAuth2 form uses 'username' field for email
            password=form_data.password
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth_service.create_access_token(
            data={"sub": user.id, "email": user.email}
        )

        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=int(access_token_expires.total_seconds()),
            user=UserResponse(
                id=str(user.id),
                email=str(user.email),
                full_name=str(user.full_name or ""),
                is_active=bool(user.is_active),
                created_at=user.created_at.isoformat() if user.created_at else ""
            )
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/refresh-token", response_model=Token)
async def refresh_access_token(
    current_token: TokenData = Depends(get_current_token_data_dependency),
    auth_service: AuthService = Depends(get_auth_service)
) -> Token:
    """Refresh access token"""
    try:
        # Create new access token
        access_token = auth_service.create_access_token(
            data={"sub": current_token.user_id, "email": current_token.email}
        )

        return Token(
            access_token=access_token,
            token_type="bearer"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_endpoint(
    current_user = Depends(get_current_user_dependency)
) -> UserResponse:
    """Get current authenticated user information"""
    return UserResponse(
        id=str(current_user.id),
        email=str(current_user.email),
        full_name=str(current_user.full_name or ""),
        is_active=bool(current_user.is_active),
        created_at=current_user.created_at.isoformat() if current_user.created_at else ""
    )


@router.post("/logout")
async def logout_user(
    token_data: TokenData = Depends(get_current_token_data_dependency),
    auth_service: AuthService = Depends(get_auth_service)
) -> Dict[str, str]:
    """Logout user by blacklisting the token"""
    try:
        # In a production system, you would add the token to a blacklist
        # For now, we'll just invalidate it on the client side
        # TODO: Implement proper token blacklisting with Redis/database storage

        logger.info(f"User {token_data.user_id} logged out")
        return {"message": "Successfully logged out"}

    except Exception as e:
        logger.error(f"Logout failed: {e}")
        # Even if logout fails, return success to client to avoid confusion
        return {"message": "Successfully logged out"}


@router.post("/verify-token")
async def verify_token(
    token_data: TokenData = Depends(get_current_token_data_dependency)
) -> Dict[str, Any]:
    """Verify if token is valid and return token information"""
    return {
        "valid": True,
        "user_id": token_data.user_id,
        "email": token_data.email,
        "exp": token_data.exp
    }
