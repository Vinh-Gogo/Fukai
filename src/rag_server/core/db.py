from typing import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.exc import SQLAlchemyError

from ..constants import DATABASE_URL
from ..models.models import Base

# Create async engine and session factory
engine: AsyncEngine = create_async_engine(DATABASE_URL, future=True, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

async def init_db() -> None:
    """Create database tables (if they don't exist)."""
    async with engine.begin() as conn:
        # run_sync will call the sync create_all on the connection
        await conn.run_sync(Base.metadata.create_all)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an AsyncSession for dependency injection in FastAPI routes."""
    async with AsyncSessionLocal() as session:
        yield session

async def test_connection() -> bool:
    """Simple helper to test DB connectivity."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except SQLAlchemyError:
        return False
