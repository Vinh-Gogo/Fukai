"""
Authentication service for handling user login, JWT tokens, and password validation.

This service provides:
- User authentication with username/password
- JWT token generation and validation
- Password hashing and verification
- User session management
"""

import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple
import jwt
from passlib.context import CryptContext

from ..utils.helpers import utc_now_iso
from ..constants import JWT_SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRE_MINUTES

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Simple user storage loaded from environment variables
# Format: {username: {"password_hash": hash, "role": role, "enabled": bool}}
USERS_DB = {}

def _load_users_from_env():
    """Load user configuration from environment variables."""
    users = {}

    # Get all environment variables that start with USER_
    for key, value in os.environ.items():
        if key.startswith("USER_") and key.endswith("_PASSWORD"):
            # Extract username from key: USER_<USERNAME>_PASSWORD
            username_part = key[5:-9]  # Remove "USER_" prefix and "_PASSWORD" suffix
            username = username_part.lower()

            # Get other user properties
            role_key = f"USER_{username_part}_ROLE"
            enabled_key = f"USER_{username_part}_ENABLED"

            role = os.environ.get(role_key, "user")
            enabled_str = os.environ.get(enabled_key, "true")

            # Convert enabled string to boolean
            enabled = enabled_str.lower() in ("true", "1", "yes", "on")

            users[username] = {
                "password": value,  # Plain text password from env
                "role": role,
                "enabled": enabled,
                "created_at": utc_now_iso()
            }

    return users

def _init_users_db():
    """Initialize the users database from environment variables."""
    global USERS_DB
    users_config = _load_users_from_env()

    for username, config in users_config.items():
        try:
            # Try bcrypt first
            password_hash = pwd_context.hash(config["password"])
        except Exception as e:
            # Fallback to SHA256 if bcrypt fails
            import hashlib
            password_hash = hashlib.sha256(config["password"].encode()).hexdigest()

        USERS_DB[username] = {
            "password_hash": password_hash,
            "role": config["role"],
            "enabled": config["enabled"],
            "created_at": config["created_at"]
        }

# Initialize users database from environment
_init_users_db()

class AuthService:
    """Service for handling authentication operations."""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt."""
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        try:
            # Try bcrypt first
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            # Fallback to SHA256 if bcrypt fails
            import hashlib
            expected_hash = hashlib.sha256(plain_password.encode()).hexdigest()
            return expected_hash == hashed_password

    @staticmethod
    def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate a user with username and password.

        Args:
            username: The username to authenticate
            password: The plain text password

        Returns:
            User info dict if authentication successful, None otherwise
        """
        user = USERS_DB.get(username)
        if not user or not user.get("enabled", False):
            return None

        if not AuthService.verify_password(password, user["password_hash"]):
            return None

        # Return user info without sensitive data
        return {
            "username": username,
            "role": user["role"],
            "enabled": user["enabled"],
            "created_at": user["created_at"]
        }

    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """
        Create a JWT access token.

        Args:
            data: Data to encode in the token
            expires_delta: Optional expiration time delta

        Returns:
            JWT token string
        """
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)

        to_encode.update({"exp": expire, "iat": datetime.utcnow(), "type": "access"})
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        return encoded_jwt

    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """
        Verify and decode a JWT token.

        Args:
            token: JWT token to verify

        Returns:
            Decoded token data if valid, None otherwise
        """
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])

            # Check token type
            if payload.get("type") != "access":
                return None

            # Check if token has expired
            exp = payload.get("exp")
            if exp and datetime.fromtimestamp(exp) < datetime.utcnow():
                return None

            return payload
        except jwt.PyJWTError:
            return None

    @staticmethod
    def get_current_user(token: str) -> Optional[Dict[str, Any]]:
        """
        Get current user from JWT token.

        Args:
            token: JWT token

        Returns:
            User info if token is valid, None otherwise
        """
        payload = AuthService.verify_token(token)
        if not payload:
            return None

        username = payload.get("sub")
        if not username:
            return None

        user = USERS_DB.get(username)
        if not user or not user.get("enabled", False):
            return None

        return {
            "username": username,
            "role": user["role"],
            "enabled": user["enabled"],
            "token_expires": payload.get("exp"),
            "token_issued": payload.get("iat")
        }

    @staticmethod
    def login_user(username: str, password: str) -> Optional[Tuple[str, Dict[str, Any], int]]:
        """
        Login a user and return access token.

        Args:
            username: Username to login
            password: Password for authentication

        Returns:
            Tuple of (token, user_info, expires_in_seconds) if successful, None otherwise
        """
        user = AuthService.authenticate_user(username, password)
        if not user:
            return None

        # Create token data
        token_data = {
            "sub": username,
            "role": user["role"]
        }

        # Create token with default expiration
        access_token = AuthService.create_access_token(token_data)
        expires_in = JWT_EXPIRE_MINUTES * 60  # Convert to seconds

        return access_token, user, expires_in

    @staticmethod
    def get_token_expiration(token: str) -> Optional[datetime]:
        """
        Get token expiration time.

        Args:
            token: JWT token

        Returns:
            Expiration datetime if token is valid, None otherwise
        """
        payload = AuthService.verify_token(token)
        if not payload:
            return None

        exp = payload.get("exp")
        if not exp:
            return None

        return datetime.fromtimestamp(exp)

    @staticmethod
    def is_token_valid(token: str) -> bool:
        """
        Check if a token is valid.

        Args:
            token: JWT token to check

        Returns:
            True if token is valid, False otherwise
        """
        return AuthService.verify_token(token) is not None

    @staticmethod
    def get_all_users() -> Dict[str, Dict[str, Any]]:
        """
        Get all users (without password hashes).

        Returns:
            Dict of username -> user_info (without sensitive data)
        """
        users = {}
        for username, user_data in USERS_DB.items():
            users[username] = {
                "role": user_data["role"],
                "enabled": user_data["enabled"],
                "created_at": user_data["created_at"]
            }
        return users

    @staticmethod
    def change_password(username: str, old_password: str, new_password: str) -> bool:
        """
        Change a user's password.

        Args:
            username: Username
            old_password: Current password
            new_password: New password

        Returns:
            True if password changed successfully, False otherwise
        """
        user = USERS_DB.get(username)
        if not user or not user.get("enabled", False):
            return False

        if not AuthService.verify_password(old_password, user["password_hash"]):
            return False

        # Update password hash
        USERS_DB[username]["password_hash"] = AuthService.hash_password(new_password)
        return True

# Initialize the auth service
auth_service = AuthService()
