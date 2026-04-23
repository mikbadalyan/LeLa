from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, String
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
    interface_language: Mapped[str] = mapped_column(String(8), default="fr")
    theme_preference: Mapped[str] = mapped_column(String(16), default="system")
    compact_mode: Mapped[bool] = mapped_column(Boolean, default=True)
    autoplay_previews: Mapped[bool] = mapped_column(Boolean, default=False)
    reduce_motion: Mapped[bool] = mapped_column(Boolean, default=False)
    large_text: Mapped[bool] = mapped_column(Boolean, default=False)
    high_contrast: Mapped[bool] = mapped_column(Boolean, default=False)
    sound_effects: Mapped[bool] = mapped_column(Boolean, default=True)
    data_saver: Mapped[bool] = mapped_column(Boolean, default=False)
    profile_visibility: Mapped[str] = mapped_column(String(16), default="public")
    show_email: Mapped[bool] = mapped_column(Boolean, default=False)
    show_city: Mapped[bool] = mapped_column(Boolean, default=True)
    show_activity_status: Mapped[bool] = mapped_column(Boolean, default=True)
    searchable_by_email: Mapped[bool] = mapped_column(Boolean, default=True)
    allow_friend_requests: Mapped[bool] = mapped_column(Boolean, default=True)
    allow_direct_messages: Mapped[str] = mapped_column(String(16), default="friends")
    allow_tagging: Mapped[bool] = mapped_column(Boolean, default=True)
    profile_indexing_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    two_factor_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    login_alerts: Mapped[bool] = mapped_column(Boolean, default=True)
    security_reminders: Mapped[bool] = mapped_column(Boolean, default=True)
    marketing_emails: Mapped[bool] = mapped_column(Boolean, default=False)
    product_updates: Mapped[bool] = mapped_column(Boolean, default=True)
    weekly_digest: Mapped[bool] = mapped_column(Boolean, default=False)
    message_notifications: Mapped[bool] = mapped_column(Boolean, default=True)
    friend_request_notifications: Mapped[bool] = mapped_column(Boolean, default=True)
    moderation_notifications: Mapped[bool] = mapped_column(Boolean, default=True)
    last_password_changed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), default=UserRole.CONTRIBUTOR
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    editorial_objects = relationship("EditorialObject", back_populates="contributor")
    contributions = relationship(
        "Contribution",
        foreign_keys="Contribution.user_id",
        back_populates="user",
    )
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
