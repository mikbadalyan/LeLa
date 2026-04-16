from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class UserRole(str, enum.Enum):
    CONTRIBUTOR = "contributor"
    MODERATOR = "moderator"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    city: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    avatar_url: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), default=UserRole.CONTRIBUTOR
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    editorial_objects = relationship("EditorialObject", back_populates="contributor")
    contributions = relationship("Contribution", back_populates="user")
    likes = relationship("Like", back_populates="user")
    chat_feedback = relationship("ChatFeedback", back_populates="user")
    sent_friendships = relationship(
        "Friendship",
        foreign_keys="Friendship.user_id",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    received_friendships = relationship(
        "Friendship",
        foreign_keys="Friendship.friend_id",
        back_populates="friend",
        cascade="all, delete-orphan",
    )
    sent_shares = relationship(
        "Share",
        foreign_keys="Share.sender_id",
        back_populates="sender",
        cascade="all, delete-orphan",
    )
    received_shares = relationship(
        "Share",
        foreign_keys="Share.recipient_id",
        back_populates="recipient",
        cascade="all, delete-orphan",
    )
    sent_messages = relationship(
        "DirectMessage",
        foreign_keys="DirectMessage.sender_id",
        back_populates="sender",
        cascade="all, delete-orphan",
    )
    received_messages = relationship(
        "DirectMessage",
        foreign_keys="DirectMessage.recipient_id",
        back_populates="recipient",
        cascade="all, delete-orphan",
    )
