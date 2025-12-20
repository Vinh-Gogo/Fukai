"""
User repository for database operations
"""
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .base import BaseRepository
from ..models.user import User


class UserRepository(BaseRepository[User]):
    """Repository for User model operations"""

    @property
    def model_class(self):
        return User

    async def get_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email address

        Args:
            email: User email

        Returns:
            User if found, None otherwise
        """
        session = await self._get_session()
        result = await session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def exists_by_email(self, email: str) -> bool:
        """
        Check if user exists by email

        Args:
            email: User email

        Returns:
            True if exists, False otherwise
        """
        session = await self._get_session()
        result = await session.execute(
            select(User.id).where(User.email == email)
        )
        return result.scalar_one_or_none() is not None

    async def get_users_by_full_name(self, full_name: str, limit: Optional[int] = None) -> List[User]:
        """
        Get users by full name (partial match)

        Args:
            full_name: Full name to search for
            limit: Maximum number of results

        Returns:
            List of matching users
        """
        session = await self._get_session()
        query = select(User).where(User.full_name.ilike(f"%{full_name}%"))

        if limit:
            query = query.limit(limit)

        result = await session.execute(query)
        return list(result.scalars().all())
