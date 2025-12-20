"""
Base repository with common functionality
"""
from abc import ABC, abstractmethod
from typing import List, Optional, TypeVar, Generic, Any, Type
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload

from ..core.database import get_db

T = TypeVar('T')


class BaseRepository(ABC, Generic[T]):
    """Abstract base repository with common CRUD operations"""

    def __init__(self, session: Optional[AsyncSession] = None):
        """Initialize repository with optional session"""
        self._session = session

    async def _get_session(self) -> AsyncSession:
        """Get database session (create if not provided)"""
        if self._session:
            return self._session
        # This would be injected via dependency injection in production
        # For now, create a session (this pattern will be improved)
        async for session in get_db():
            return session

    @property
    @abstractmethod
    def model_class(self) -> Type[T]:
        """Return the model class this repository manages"""
        pass

    async def get_by_id(self, id: str) -> Optional[T]:
        """
        Get entity by ID

        Args:
            id: Entity ID

        Returns:
            Entity if found, None otherwise
        """
        session = await self._get_session()
        result = await session.execute(
            select(self.model_class).where(self.model_class.id == id)
        )
        return result.scalar_one_or_none()

    async def get_all(self, limit: Optional[int] = None, offset: Optional[int] = 0) -> List[T]:
        """
        Get all entities with optional pagination

        Args:
            limit: Maximum number of entities to return
            offset: Number of entities to skip

        Returns:
            List of entities
        """
        session = await self._get_session()
        query = select(self.model_class)

        if offset:
            query = query.offset(offset)
        if limit:
            query = query.limit(limit)

        result = await session.execute(query)
        return list(result.scalars().all())

    async def create(self, entity: T) -> T:
        """
        Create a new entity

        Args:
            entity: Entity to create

        Returns:
            Created entity with ID and timestamps
        """
        session = await self._get_session()
        session.add(entity)
        await session.flush()  # Get the ID without committing
        await session.refresh(entity)  # Refresh to get all fields
        return entity

    async def update(self, id: str, **kwargs) -> Optional[T]:
        """
        Update entity by ID

        Args:
            id: Entity ID
            **kwargs: Fields to update

        Returns:
            Updated entity if found, None otherwise
        """
        session = await self._get_session()
        result = await session.execute(
            update(self.model_class)
            .where(self.model_class.id == id)
            .values(**kwargs)
            .returning(self.model_class)
        )
        entity = result.scalar_one_or_none()
        if entity:
            await session.refresh(entity)
        return entity

    async def delete(self, id: str) -> bool:
        """
        Delete entity by ID

        Args:
            id: Entity ID

        Returns:
            True if deleted, False if not found
        """
        session = await self._get_session()
        result = await session.execute(
            delete(self.model_class).where(self.model_class.id == id)
        )
        return result.rowcount > 0

    async def exists(self, id: str) -> bool:
        """
        Check if entity exists by ID

        Args:
            id: Entity ID

        Returns:
            True if exists, False otherwise
        """
        session = await self._get_session()
        result = await session.execute(
            select(self.model_class.id).where(self.model_class.id == id)
        )
        return result.scalar_one_or_none() is not None

    async def count(self) -> int:
        """
        Count total entities

        Returns:
            Total count of entities
        """
        session = await self._get_session()
        result = await session.execute(
            select(self.model_class).with_only_columns([self.model_class.id])
        )
        return len(result.scalars().all())
