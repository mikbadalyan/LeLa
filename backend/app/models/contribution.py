from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, Float, ForeignKey, JSON, String, Text
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


class ContributionFicheType(str, enum.Enum):
    LIEU = "lieu"
    PERSONNE = "personne"
    EVENEMENT = "evenement"
    AUTRE = "autre"


class ContributionFicheStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    AI_REVIEWED = "ai_reviewed"
    PENDING_MODERATION = "pending_moderation"
    APPROVED = "approved"
    REJECTED = "rejected"
    NEEDS_CHANGES = "needs_changes"


class CardCategoryMetadata(str, enum.Enum):
    LIEU = "lieu"
    PERSONNE = "personne"
    EVENEMENT = "evenement"
    OBJET = "objet"
    THEME = "theme"
    AUTRE = "autre"


class PublishedEntityStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    PUBLISHED = "published"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class ProposalType(str, enum.Enum):
    CREATE_CARD = "create_card"
    CREATE_FICHE = "create_fiche"
    UPDATE_CARD = "update_card"
    UPDATE_FICHE = "update_fiche"
    CORRECTION = "correction"


class ProposalStatus(str, enum.Enum):
    DRAFT = "draft"
    AI_REVIEWED = "ai_reviewed"
    PENDING_MODERATION = "pending_moderation"
    APPROVED = "approved"
    REJECTED = "rejected"
    NEEDS_CHANGES = "needs_changes"


class RevisionEntityType(str, enum.Enum):
    CARD = "card"
    FICHE = "fiche"


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


class ContributionFiche(Base):
    __tablename__ = "contribution_fiches"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    type: Mapped[ContributionFicheType] = mapped_column(Enum(ContributionFicheType))
    title: Mapped[str] = mapped_column(String(255))
    short_description: Mapped[str] = mapped_column(Text)
    long_description: Mapped[str] = mapped_column(Text)
    city: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    historical_context: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    media_blocks: Mapped[list[dict]] = mapped_column(JSON, default=list)
    source_reference: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[ContributionFicheStatus] = mapped_column(
        Enum(ContributionFicheStatus), default=ContributionFicheStatus.DRAFT
    )
    moderator_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_evaluation_result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    editorial_object_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("editorial_objects.id"), nullable=True
    )
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

    user = relationship("User", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by_user_id])
    editorial_object = relationship("EditorialObject", foreign_keys=[editorial_object_id])


class Card(Base):
    __tablename__ = "cards"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    short_description: Mapped[str] = mapped_column(Text)
    category_metadata: Mapped[CardCategoryMetadata] = mapped_column(
        Enum(CardCategoryMetadata), default=CardCategoryMetadata.AUTRE
    )
    city: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    main_image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    relations: Mapped[list[dict]] = mapped_column(JSON, default=list)
    why_exists: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source_reference: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[PublishedEntityStatus] = mapped_column(
        Enum(PublishedEntityStatus), default=PublishedEntityStatus.DRAFT
    )
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    editorial_object_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("editorial_objects.id"), nullable=True
    )
    current_published_version_id: Mapped[Optional[str]] = mapped_column(
        String(36), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    creator = relationship("User", foreign_keys=[created_by])
    editorial_object = relationship("EditorialObject", foreign_keys=[editorial_object_id])
    fiches = relationship("Fiche", back_populates="card")


class Fiche(Base):
    __tablename__ = "fiches"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    card_id: Mapped[str] = mapped_column(ForeignKey("cards.id"))
    title: Mapped[str] = mapped_column(String(255))
    sections: Mapped[dict] = mapped_column(JSON, default=dict)
    media_blocks: Mapped[list[dict]] = mapped_column(JSON, default=list)
    sources: Mapped[list[dict]] = mapped_column(JSON, default=list)
    relations: Mapped[list[dict]] = mapped_column(JSON, default=list)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    status: Mapped[PublishedEntityStatus] = mapped_column(
        Enum(PublishedEntityStatus), default=PublishedEntityStatus.DRAFT
    )
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    current_published_version_id: Mapped[Optional[str]] = mapped_column(
        String(36), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    card = relationship("Card", back_populates="fiches")
    creator = relationship("User", foreign_keys=[created_by])


class ContributionProposal(Base):
    __tablename__ = "contribution_proposals"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    contribution_type: Mapped[ProposalType] = mapped_column(Enum(ProposalType))
    target_card_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("cards.id"), nullable=True
    )
    target_fiche_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("fiches.id"), nullable=True
    )
    proposed_data: Mapped[dict] = mapped_column(JSON, default=dict)
    previous_data_snapshot: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    contributor_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_review: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    status: Mapped[ProposalStatus] = mapped_column(
        Enum(ProposalStatus), default=ProposalStatus.DRAFT
    )
    moderator_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    moderator_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
    submitted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    target_card = relationship("Card", foreign_keys=[target_card_id])
    target_fiche = relationship("Fiche", foreign_keys=[target_fiche_id])
    contributor = relationship("User", foreign_keys=[contributor_id])
    moderator = relationship("User", foreign_keys=[moderator_id])


class RevisionHistory(Base):
    __tablename__ = "revision_history"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    entity_type: Mapped[RevisionEntityType] = mapped_column(Enum(RevisionEntityType))
    entity_id: Mapped[str] = mapped_column(String(36))
    version_number: Mapped[int] = mapped_column(default=1)
    data_snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    contributor_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    approved_by: Mapped[Optional[str]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    contributor = relationship("User", foreign_keys=[contributor_id])
    approver = relationship("User", foreign_keys=[approved_by])
