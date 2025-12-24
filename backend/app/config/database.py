"""
Database configuration and session management.

This module handles database connections, session management, and database initialization
for the Search RAG backend.
"""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.config.settings import settings


# Create SQLAlchemy engine
if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite specific configuration
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=settings.DEBUG,
    )
else:
    # PostgreSQL/MySQL configuration
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        echo=settings.DEBUG,
    )

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get database session.

    Yields:
        Database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables() -> None:
    """
    Create all database tables.

    This function should be called during application startup.
    """
    Base.metadata.create_all(bind=engine)


def drop_tables() -> None:
    """
    Drop all database tables.

    WARNING: This will delete all data. Use with caution.
    """
    Base.metadata.drop_all(bind=engine)


def reset_database() -> None:
    """
    Reset the database by dropping and recreating all tables.

    WARNING: This will delete all data.
    """
    drop_tables()
    create_tables()
