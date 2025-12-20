"""
User model for authentication
"""
from typing import Optional
import uuid
from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship

from .base import BaseModel


class User(BaseModel):
    """User model for authentication and authorization"""

    __tablename__ = "users"

    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    full_name = Column(String, nullable=True)

    # Relationships
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")

    @classmethod
    def create(cls, email: str, hashed_password: str, full_name: Optional[str] = None) -> "User":
        """Create a new user with generated ID"""
        return cls(
            id=str(uuid.uuid4()),
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            is_active=True
        )

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
