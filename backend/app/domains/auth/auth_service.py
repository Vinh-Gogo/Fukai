"""
Authentication service with JWT tokens
"""
from typing import Optional, Dict, Any
import logging
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt

from ...core.config import settings
from ...models.user import User
from ...repositories.user_repository import UserRepository
from ...services.shared.cache_service import CacheService
from .auth_interface import IAuthService

logger = logging.getLogger(__name__)


class AuthService(IAuthService):
    """Service for user authentication and JWT token management"""

    def __init__(self, user_repository: Optional[UserRepository] = None,
                 cache_service: Optional[CacheService] = None):
        # Password hashing context
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        # Repository for data access
        self.user_repository = user_repository
        # Cache service for performance optimization
        self.cache_service = cache_service

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verify a password against its hash

        Args:
            plain_password: Plain text password
            hashed_password: Hashed password from database

        Returns:
            True if password matches
        """
        return self.pwd_context.verify(plain_password, hashed_password)

    def hash_password(self, password: str) -> str:
        """
        Hash a password for storing in database

        Args:
            password: Plain text password

        Returns:
            Hashed password string
        """
        return self.pwd_context.hash(password)

    def create_access_token(self, data: Dict[str, Any]) -> str:
        """
        Create JWT access token

        Args:
            data: Data to encode in token (should include user_id)

        Returns:
            JWT token string
        """
        to_encode = data.copy()

        # Add expiration
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
        to_encode.update({"exp": expire, "type": "access"})

        # Create token
        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )

        return encoded_jwt

    def decode_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Decode and validate JWT token

        Args:
            token: JWT token string

        Returns:
            Decoded token data, or None if invalid
        """
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )

            # Check token type
            if payload.get("type") != "access":
                logger.warning("Invalid token type")
                return None

            return payload

        except JWTError as e:
            logger.warning(f"JWT decode error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error decoding token: {e}")
            return None

    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """
        Authenticate a user with email and password

        Args:
            email: User email
            password: User password

        Returns:
            User object if authentication successful, None otherwise
        """
        if not self.user_repository:
            logger.error("User repository not provided to AuthService")
            return None

        try:
            # Get user by email
            user = await self.user_repository.get_by_email(email)
            if not user:
                logger.warning(f"User not found: {email}")
                return None

            # Verify password
            if not self.verify_password(password, user.hashed_password):
                logger.warning(f"Invalid password for user: {email}")
                return None

            return user

        except Exception as e:
            logger.error(f"Authentication failed for {email}: {e}")
            return None

    async def get_current_user(self, token: str) -> Optional[User]:
        """
        Get current user from JWT token with caching

        Args:
            token: JWT access token

        Returns:
            User object if token valid, None otherwise
        """
        if not self.user_repository:
            logger.error("User repository not provided to AuthService")
            return None

        payload = self.decode_token(token)
        if not payload:
            return None

        user_id = payload.get("sub")
        if not user_id:
            return None

        # Try to get from cache first
        if self.cache_service:
            cache_key = f"token:{token[:32]}"  # Use first 32 chars of token as key
            cached_user_data = await self.cache_service.get(cache_key, "token")
            if cached_user_data:
                logger.debug(f"User {user_id} found in token cache")
                # Convert cached dict back to User object (simplified)
                try:
                    from ...models.user import User
                    user = User(
                        id=cached_user_data["id"],
                        email=cached_user_data["email"],
                        hashed_password="",  # Not needed for cached user
                        full_name=cached_user_data.get("full_name")
                    )
                    return user
                except Exception as e:
                    logger.warning(f"Failed to reconstruct user from cache: {e}")

        try:
            user = await self.user_repository.get_by_id(user_id)
            if not user:
                logger.warning(f"User not found for token: {user_id}")
                return None

            # Cache the user data for future token validations
            if self.cache_service:
                user_data = {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name
                }
                cache_key = f"token:{token[:32]}"
                await self.cache_service.set(cache_key, user_data, ttl=1800, prefix="token")  # 30 min TTL

            return user

        except Exception as e:
            logger.error(f"Failed to get current user {user_id}: {e}")
            return None

    async def register_user(self, email: str, password: str, full_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Register a new user

        Args:
            email: User email
            password: User password
            full_name: Optional full name

        Returns:
            Dict with registration result
        """
        if not self.user_repository:
            logger.error("User repository not provided to AuthService")
            return {
                "success": False,
                "error": "Service configuration error"
            }

        try:
            # Check if user already exists
            existing_user = await self.user_repository.exists_by_email(email)
            if existing_user:
                return {
                    "success": False,
                    "error": "User with this email already exists"
                }

            # Hash password
            hashed_password = self.hash_password(password)

            # Create user
            user = User.create(
                email=email,
                hashed_password=hashed_password,
                full_name=full_name
            )

            # Save user to database
            saved_user = await self.user_repository.create(user)

            # Create access token
            access_token = self.create_access_token({"sub": saved_user.id})

            return {
                "success": True,
                "user": {
                    "id": saved_user.id,
                    "email": saved_user.email,
                    "full_name": saved_user.full_name
                },
                "access_token": access_token,
                "token_type": "bearer"
            }

        except Exception as e:
            logger.error(f"User registration failed: {e}")
            return {
                "success": False,
                "error": f"Registration failed: {str(e)}"
            }

    async def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """
        Login user with email and password

        Args:
            email: User email
            password: User password

        Returns:
            Dict with login result
        """
        try:
            # Authenticate user
            user = await self.authenticate_user(email, password)
            if not user:
                return {
                    "success": False,
                    "error": "Invalid email or password"
                }

            # Create access token
            access_token = self.create_access_token({"sub": user.id})

            return {
                "success": True,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name
                },
                "access_token": access_token,
                "token_type": "bearer"
            }

        except Exception as e:
            logger.error(f"User login failed: {e}")
            return {
                "success": False,
                "error": f"Login failed: {str(e)}"
            }

    def validate_token_format(self, token: str) -> bool:
        """
        Validate JWT token format (without decoding)

        Args:
            token: JWT token string

        Returns:
            True if token format is valid
        """
        try:
            # Basic JWT format check (header.payload.signature)
            parts = token.split('.')
            if len(parts) != 3:
                return False

            # Check if parts are valid base64url
            import base64
            for part in parts:
                # Add padding if needed
                missing_padding = len(part) % 4
                if missing_padding:
                    part += '=' * (4 - missing_padding)
                base64.urlsafe_b64decode(part)

            return True

        except Exception:
            return False
