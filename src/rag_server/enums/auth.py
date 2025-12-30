"""
Authentication-related enumerations for the RAG Server.

This module contains all enums related to user authentication, roles, and permissions.
"""

from enum import Enum

class UserRole(str, Enum):
    """Enumeration of user roles."""
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"
    API_USER = "api_user"

class AuthMethod(str, Enum):
    """Enumeration of authentication methods."""
    JWT = "jwt"
    API_KEY = "api_key"
    SESSION = "session"
    BASIC = "basic"

class UserStatus(str, Enum):
    """Enumeration of user account statuses."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"
    LOCKED = "locked"

class Permission(str, Enum):
    """Enumeration of system permissions."""
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    ADMIN = "admin"
    UPLOAD = "upload"
    DOWNLOAD = "download"
    SEARCH = "search"
    CRAWL = "crawl"

class TokenType(str, Enum):
    """Enumeration of token types."""
    ACCESS = "access"
    REFRESH = "refresh"
    API_KEY = "api_key"
