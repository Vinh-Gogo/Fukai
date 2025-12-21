"""
Database connection and migration management
"""
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings
from app.models.base import Base

logger = logging.getLogger(__name__)

# Optional async SQLite support
try:
    import aiosqlite
    AIOSQLITE_AVAILABLE = True
except ImportError:
    AIOSQLITE_AVAILABLE = False
    logger.warning("aiosqlite not available, async database features disabled")


class DatabaseManager:
    """Database connection and migration manager"""

    def __init__(self):
        self.engine = None
        self.async_engine = None
        self.SessionLocal = None
        self.AsyncSessionLocal = None

    def init_db(self):
        """Initialize synchronous database connection"""
        self.engine = create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
            echo=settings.DATABASE_ECHO,
        )

        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )

        # Create tables if they don't exist
        Base.metadata.create_all(bind=self.engine)
        logger.info("Database initialized successfully")

    async def init_async_db(self):
        """Initialize asynchronous database connection"""
        if not AIOSQLITE_AVAILABLE:
            logger.warning("aiosqlite not available, skipping async database initialization")
            return

        # Convert SQLite URL to async format if needed
        database_url = settings.DATABASE_URL
        if database_url.startswith("sqlite://"):
            database_url = database_url.replace("sqlite://", "sqlite+aiosqlite://", 1)

        self.async_engine = create_async_engine(
            database_url,
            echo=settings.DATABASE_ECHO,
            pool_pre_ping=True,
        )

        self.AsyncSessionLocal = async_sessionmaker(
            self.async_engine,
            class_=AsyncSession,
            expire_on_commit=False
        )

        # Create tables if they don't exist
        async with self.async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        logger.info("Async database initialized successfully")

    def get_db(self) -> Session:
        """Get synchronous database session"""
        if self.SessionLocal is None:
            raise RuntimeError("Database not initialized. Call init_db() first.")
        return self.SessionLocal()

    async def get_async_db(self) -> AsyncGenerator[AsyncSession, None]:
        """Get asynchronous database session"""
        if self.AsyncSessionLocal is None:
            raise RuntimeError("Async database not initialized. Call init_async_db() first.")

        async with self.AsyncSessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    @asynccontextmanager
    async def get_db_context(self):
        """Context manager for database sessions"""
        if self.AsyncSessionLocal:
            async with self.AsyncSessionLocal() as session:
                try:
                    yield session
                    await session.commit()
                except Exception:
                    await session.rollback()
                    raise
                finally:
                    await session.close()
        else:
            # Fallback to sync session
            db = self.get_db()
            try:
                yield db
                db.commit()
            except Exception:
                db.rollback()
                raise
            finally:
                db.close()

    async def health_check(self) -> dict:
        """Perform database health check"""
        try:
            if self.async_engine:
                async with self.async_engine.connect() as conn:
                    result = await conn.execute(text("SELECT 1"))
                    row = result.fetchone()
                    return {"status": "healthy", "type": "async"}
            elif self.engine:
                with self.engine.connect() as conn:
                    result = conn.execute(text("SELECT 1"))
                    result.fetchone()
                    return {"status": "healthy", "type": "sync"}
            else:
                return {"status": "unhealthy", "error": "Database not initialized"}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

    async def close(self):
        """Close database connections"""
        if self.async_engine:
            await self.async_engine.dispose()
        if self.engine:
            self.engine.dispose()
        logger.info("Database connections closed")


# Global database manager instance
db_manager = DatabaseManager()


# Dependency for FastAPI
def get_db():
    """FastAPI dependency for database session"""
    db = db_manager.get_db()
    try:
        yield db
    finally:
        db.close()


async def get_async_db():
    """FastAPI async dependency for database session"""
    async for session in db_manager.get_async_db():
        yield session


# Migration management functions
async def run_migrations():
    """Run database migrations"""
    import subprocess
    import sys

    try:
        # Run alembic upgrade head
        result = subprocess.run([
            sys.executable, "-m", "alembic", "upgrade", "head"
        ], cwd=".", capture_output=True, text=True)

        if result.returncode == 0:
            logger.info("Database migrations completed successfully")
            return {"status": "success", "output": result.stdout}
        else:
            logger.error(f"Migration failed: {result.stderr}")
            return {"status": "error", "output": result.stderr}
    except Exception as e:
        logger.error(f"Migration error: {e}")
        return {"status": "error", "output": str(e)}


async def create_migration(message: str):
    """Create a new migration"""
    import subprocess
    import sys

    try:
        result = subprocess.run([
            sys.executable, "-m", "alembic", "revision", "--autogenerate", "-m", message
        ], cwd=".", capture_output=True, text=True)

        if result.returncode == 0:
            logger.info(f"Migration created: {message}")
            return {"status": "success", "output": result.stdout}
        else:
            logger.error(f"Migration creation failed: {result.stderr}")
            return {"status": "error", "output": result.stderr}
    except Exception as e:
        logger.error(f"Migration creation error: {e}")
        return {"status": "error", "output": str(e)}


async def get_migration_status():
    """Get current migration status"""
    import subprocess
    import sys

    try:
        result = subprocess.run([
            sys.executable, "-m", "alembic", "current"
        ], cwd=".", capture_output=True, text=True)

        return {"status": "success", "output": result.stdout.strip()}
    except Exception as e:
        logger.error(f"Migration status error: {e}")
        return {"status": "error", "output": str(e)}


# Initialize database on import
def init_database():
    """Initialize database connections"""
    try:
        db_manager.init_db()
        # Note: Async database initialization is handled separately
        # in async contexts where needed
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


async def init_database_async():
    """Initialize both sync and async database connections"""
    try:
        # Initialize sync database first
        db_manager.init_db()

        # Initialize async database if aiosqlite is available
        if AIOSQLITE_AVAILABLE:
            await db_manager.init_async_db()
        else:
            logger.warning("aiosqlite not available, async database features disabled")

        logger.info("Database initialized successfully (sync + async)")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
