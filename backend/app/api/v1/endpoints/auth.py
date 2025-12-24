"""
Authentication endpoints for the Search RAG backend.

This module provides endpoints for user authentication, registration, and token management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Optional

from app.api.deps import get_current_user, get_logger
from app.core.security import (
    create_access_token,
    verify_password,
    get_token_subject,
    hash_password,
)
from app.config.settings import settings


router = APIRouter()


@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    logger=Depends(get_logger),
):
    """
    Authenticate user and return access token.

    This endpoint verifies user credentials and returns a JWT access token.
    """
    logger.info("Login attempt", username=form_data.username)

    # TODO: Replace with actual user database lookup
    # For now, accept any username/password combination
    user = {
        "id": "demo-user",
        "username": form_data.username,
        "email": f"{form_data.username}@example.com",
        "is_active": True,
        "role": "user",
    }

    # In real implementation, verify password hash
    # if not verify_password(form_data.password, user.hashed_password):
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Incorrect username or password",
    #     )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user["id"],
        expires_delta=access_token_expires,
        additional_claims={
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
        }
    )

    logger.info("Login successful", username=form_data.username, user_id=user["id"])

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
        }
    }


@router.post("/register")
async def register(
    username: str,
    email: str,
    password: str,
    logger=Depends(get_logger),
):
    """
    Register a new user.

    Creates a new user account with the provided credentials.
    """
    logger.info("User registration attempt", username=username, email=email)

    # TODO: Implement actual user registration with database
    # Check if user already exists
    # Hash password
    # Save to database

    # For demo purposes
    hashed_password = hash_password(password)

    logger.info("User registration successful", username=username, email=email)

    return {
        "message": "User registered successfully",
        "user": {
            "username": username,
            "email": email,
        }
    }


@router.post("/refresh")
async def refresh_token(
    current_user: str = Depends(get_current_user),
    logger=Depends(get_logger),
):
    """
    Refresh access token.

    Generates a new access token for the authenticated user.
    """
    logger.info("Token refresh requested", user_id=current_user)

    # Create new access token
    access_token = create_access_token(subject=current_user)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.get("/me")
async def get_current_user_info(
    current_user: str = Depends(get_current_user),
    logger=Depends(get_logger),
):
    """
    Get current user information.

    Returns information about the currently authenticated user.
    """
    logger.info("Current user info requested", user_id=current_user)

    # TODO: Fetch actual user data from database
    return {
        "user": {
            "id": current_user,
            "username": "demo-user",
            "email": "demo@example.com",
            "role": "user",
            "is_active": True,
        }
    }


@router.post("/logout")
async def logout(
    current_user: str = Depends(get_current_user),
    logger=Depends(get_logger),
):
    """
    Logout user.

    Invalidate the current session/token.
    """
    logger.info("User logout", user_id=current_user)

    # TODO: Implement token blacklisting if needed
    # For JWT, client-side token removal is usually sufficient

    return {"message": "Logged out successfully"}
