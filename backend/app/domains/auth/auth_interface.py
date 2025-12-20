"""
Authentication service interface
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any

from ...models.user import User


class IAuthService(ABC):
    """Interface for authentication services"""

    @abstractmethod
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        pass

    @abstractmethod
    def hash_password(self, password: str) -> str:
        """Hash a password for storing in database"""
        pass

    @abstractmethod
    def create_access_token(self, data: Dict[str, Any]) -> str:
        """Create JWT access token"""
        pass

    @abstractmethod
    def decode_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Decode and validate JWT token"""
        pass

    @abstractmethod
    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate a user with email and password"""
        pass

    @abstractmethod
    async def get_current_user(self, token: str) -> Optional[User]:
        """Get current user from JWT token"""
        pass

    @abstractmethod
    async def register_user(self, email: str, password: str, full_name: Optional[str] = None) -> Dict[str, Any]:
        """Register a new user"""
        pass

    @abstractmethod
    async def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """Login user with email and password"""
        pass

    @abstractmethod
    def validate_token_format(self, token: str) -> bool:
        """Validate JWT token format"""
        pass
