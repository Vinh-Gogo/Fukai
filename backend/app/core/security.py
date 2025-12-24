"""
Security utilities for authentication and authorization.

This module provides JWT token handling, password hashing, and authentication utilities
for the Search RAG backend.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union
from passlib.context import CryptContext
from jose import jwt, JWTError
import secrets

from app.config.settings import settings


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
    additional_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Create a JWT access token.

    Args:
        subject: The subject of the token (usually user ID)
        expires_delta: Optional expiration time delta
        additional_claims: Additional claims to include in the token

    Returns:
        JWT access token string
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {
        "exp": expire,
        "iat": datetime.utcnow(),
        "sub": str(subject),
        "type": "access",
        "jti": secrets.token_urlsafe(16),  # Unique token ID
    }

    # Add additional claims if provided
    if additional_claims:
        to_encode.update(additional_claims)

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode a JWT token.

    Args:
        token: JWT token string

    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        # Check token type
        if payload.get("type") != "access":
            return None

        return payload
    except JWTError:
        return None


def get_token_subject(token: str) -> Optional[str]:
    """
    Extract the subject from a JWT token.

    Args:
        token: JWT token string

    Returns:
        Token subject or None if invalid
    """
    payload = verify_token(token)
    if payload:
        return payload.get("sub")
    return None


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.

    Args:
        password: Plain text password

    Returns:
        Hashed password string
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.

    Args:
        plain_password: Plain text password
        hashed_password: Hashed password

    Returns:
        True if password matches hash, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def generate_password_reset_token(email: str) -> str:
    """
    Generate a password reset token.

    Args:
        email: User email address

    Returns:
        Password reset token
    """
    expires = timedelta(hours=24)  # 24 hours for password reset
    return create_access_token(
        subject=email,
        expires_delta=expires,
        additional_claims={"type": "password_reset"}
    )


def verify_password_reset_token(token: str) -> Optional[str]:
    """
    Verify a password reset token.

    Args:
        token: Password reset token

    Returns:
        Email address if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        if payload.get("type") != "password_reset":
            return None

        email = payload.get("sub")
        return email
    except JWTError:
        return None


def create_api_key() -> str:
    """
    Generate a secure API key.

    Returns:
        Random API key string
    """
    return secrets.token_urlsafe(32)


def hash_api_key(api_key: str) -> str:
    """
    Hash an API key for storage.

    Args:
        api_key: Plain API key

    Returns:
        Hashed API key
    """
    # Use a different context for API keys (no salt needed for verification)
    return pwd_context.hash(api_key, scheme="bcrypt")


def verify_api_key(plain_api_key: str, hashed_api_key: str) -> bool:
    """
    Verify an API key against its hash.

    Args:
        plain_api_key: Plain API key
        hashed_api_key: Hashed API key

    Returns:
        True if API key matches hash, False otherwise
    """
    return pwd_context.verify(plain_api_key, hashed_api_key)
