"""
Repository pattern implementations for data access
"""
from .base import BaseRepository
from .user_repository import UserRepository
from .document_repository import DocumentRepository

__all__ = ["BaseRepository", "UserRepository", "DocumentRepository"]
