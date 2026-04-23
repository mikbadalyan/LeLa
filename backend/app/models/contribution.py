from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class ContributionType(str, enum.Enum):
    MULTI_MEDIA = "multi_media"
    SINGLE_MEDIA = "single_media"
    EVENT = "event"
    MAGAZINE = "magazine"
    PLACE = "place"
    PERSON = "person"


class ContributionStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    CHANGES_REQUESTED = "changes_requested"
    REJECTED = "rejected"


class ContributionModerationAction(str, enum.Enum):
    APPROVED = "approved"
    CHANGES_REQUESTED = "changes_requested"
    REJECTED = "rejected"


class Contribution(Base):
    __tablename__ = "contributions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    type: Mapped[ContributionType] = mapped_column(Enum(ContributionType))
    title: Mapped[str] = mapped_column(String(255))
    subtitle: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[ContributionStatus] = mapped_column(
        Enum(ContributionStatus), default=ContributionStatus.PENDING
    )
    media_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    moderation_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_by_user_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    submitted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user = relationship("User", foreign_keys=[user_id], back_populates="contributions")
    reviewer = relationship("User", foreign_keys=[reviewed_by_user_id])
    moderation_events = relationship(
        "ContributionModerationEvent",
        back_populates="contribution",
        cascade="all, delete-orphan",
        order_by="desc(ContributionModerationEvent.created_at)",
    )


class ContributionModerationEvent(Base):
    __tablename__ = "contribution_moderation_events"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    contribution_id: Mapped[str] = mapped_column(ForeignKey("contributions.id"))
    moderator_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    action: Mapped[ContributionModerationAction] = mapped_column(
        Enum(ContributionModerationAction)
    )
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    contribution = relationship("Contribution", back_populates="moderation_events")
    moderator = relationship("User", foreign_keys=[moderator_id])
