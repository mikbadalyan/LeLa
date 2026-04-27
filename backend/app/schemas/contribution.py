from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

from app.models.contribution import (
    CardCategoryMetadata,
    ContributionFicheStatus,
    ContributionFicheType,
    ContributionModerationAction,
    ProposalStatus,
    ProposalType,
    PublishedEntityStatus,
    RevisionEntityType,
    ContributionStatus,
    ContributionType,
)
from app.schemas.auth import UserRead


class ContributionCreate(BaseModel):
    type: ContributionType
    title: str
    subtitle: Optional[str] = None
    description: str
    city: Optional[str] = None
    address: Optional[str] = None
    event_date: Optional[str] = None
    end_date: Optional[str] = None
    price: Optional[str] = None
    external_url: Optional[str] = None
    linked_place_name: Optional[str] = None
    linked_person_name: Optional[str] = None
    linked_event_name: Optional[str] = None
    primary_media_kind: Optional[str] = None
    media_items: list[dict[str, str]] = Field(default_factory=list)
    text_content: Optional[str] = None


class ContributionRead(BaseModel):
    id: str
    status: ContributionStatus
    created_at: datetime
    type: ContributionType
    title: str
    moderation_note: Optional[str] = None
    reviewed_at: Optional[datetime] = None


class ContributionModerationEventRead(BaseModel):
    id: str
    action: ContributionModerationAction
    note: Optional[str] = None
    created_at: datetime
    moderator: UserRead


class ContributionModerationActionRequest(BaseModel):
    action: ContributionModerationAction
    note: Optional[str] = None


class ContributionModerationRead(BaseModel):
    id: str
    status: ContributionStatus
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime] = None
    type: ContributionType
    title: str
    subtitle: Optional[str] = None
    description: str
    media_name: Optional[str] = None
    media_url: Optional[str] = None
    payload: dict
    submitter: UserRead
    moderation_note: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[UserRead] = None
    history: list[ContributionModerationEventRead] = Field(default_factory=list)


class FicheMediaBlock(BaseModel):
    kind: str = Field(pattern="^(image|video|audio|text)$")
    name: Optional[str] = None
    url: Optional[str] = None
    text: Optional[str] = None
    caption: Optional[str] = None


class FicheAiEvaluation(BaseModel):
    global_score: int = 0
    grammar_score: int = 0
    clarity_score: int = 0
    completeness_score: int = 0
    editorial_value_score: int = 0
    relevance_score: int = 0
    duplicate_risk_score: int = 0
    source_quality_score: int = 0
    risk_score: int = 0
    content_type_recommendation: str = "manual_review"
    summary: str = ""
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    grammar_suggestions: list[str] = Field(default_factory=list)
    content_suggestions: list[str] = Field(default_factory=list)
    missing_information: list[str] = Field(default_factory=list)
    duplicate_warnings: list[str] = Field(default_factory=list)
    suggested_existing_cards: list[str] = Field(default_factory=list)
    moderator_recommendation: str = "manual_review"


class ContributionFicheBase(BaseModel):
    type: ContributionFicheType
    title: str = Field(min_length=2, max_length=255)
    short_description: str = Field(min_length=10)
    long_description: str = Field(min_length=20)
    city: Optional[str] = None
    location: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    historical_context: Optional[str] = None
    media_blocks: list[FicheMediaBlock] = Field(default_factory=list)
    source_reference: Optional[str] = None


class ContributionFicheCreate(ContributionFicheBase):
    pass


class ContributionFicheUpdate(BaseModel):
    type: Optional[ContributionFicheType] = None
    title: Optional[str] = Field(default=None, min_length=2, max_length=255)
    short_description: Optional[str] = Field(default=None, min_length=10)
    long_description: Optional[str] = Field(default=None, min_length=20)
    city: Optional[str] = None
    location: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category: Optional[str] = None
    tags: Optional[list[str]] = None
    historical_context: Optional[str] = None
    media_blocks: Optional[list[FicheMediaBlock]] = None
    source_reference: Optional[str] = None
    moderator_notes: Optional[str] = None


class FicheModerationRequest(BaseModel):
    moderator_notes: Optional[str] = None


class ContributionFicheRead(ContributionFicheBase):
    id: str
    status: ContributionFicheStatus
    author: UserRead
    moderator_notes: Optional[str] = None
    ai_evaluation_result: Optional[FicheAiEvaluation] = None
    editorial_object_id: Optional[str] = None
    reviewed_by: Optional[UserRead] = None
    reviewed_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ContributionFicheListFilters(BaseModel):
    status: Optional[ContributionFicheStatus] = None
    type: Optional[ContributionFicheType] = None
    city: Optional[str] = None


class CardBase(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    short_description: str = Field(min_length=10)
    category_metadata: CardCategoryMetadata = CardCategoryMetadata.AUTRE
    city: Optional[str] = None
    location: Optional[str] = None
    main_image: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    relations: list[dict[str, Any]] = Field(default_factory=list)
    why_exists: Optional[str] = None
    source_reference: Optional[str] = None


class CardCreate(CardBase):
    pass


class CardUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=255)
    short_description: Optional[str] = Field(default=None, min_length=10)
    category_metadata: Optional[CardCategoryMetadata] = None
    city: Optional[str] = None
    location: Optional[str] = None
    main_image: Optional[str] = None
    tags: Optional[list[str]] = None
    relations: Optional[list[dict[str, Any]]] = None
    why_exists: Optional[str] = None
    source_reference: Optional[str] = None


class CardRead(CardBase):
    id: str
    slug: str
    status: PublishedEntityStatus
    created_by: str
    editorial_object_id: Optional[str] = None
    current_published_version_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CardSearchResult(BaseModel):
    id: str
    title: str
    short_description: str
    city: Optional[str] = None
    image: Optional[str] = None
    status: str
    category_metadata: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    source: str = "card"


class PublishedFicheBase(BaseModel):
    card_id: str
    title: str = Field(min_length=2, max_length=255)
    sections: dict[str, Any] = Field(default_factory=dict)
    media_blocks: list[FicheMediaBlock] = Field(default_factory=list)
    sources: list[dict[str, Any]] = Field(default_factory=list)
    relations: list[dict[str, Any]] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)


class PublishedFicheRead(PublishedFicheBase):
    id: str
    status: PublishedEntityStatus
    created_by: str
    current_published_version_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ContributionProposalCreate(BaseModel):
    contribution_type: ProposalType
    target_card_id: Optional[str] = None
    target_fiche_id: Optional[str] = None
    proposed_data: dict[str, Any] = Field(default_factory=dict)
    previous_data_snapshot: Optional[dict[str, Any]] = None
    explanation: Optional[str] = None


class ContributionProposalUpdate(BaseModel):
    contribution_type: Optional[ProposalType] = None
    target_card_id: Optional[str] = None
    target_fiche_id: Optional[str] = None
    proposed_data: Optional[dict[str, Any]] = None
    previous_data_snapshot: Optional[dict[str, Any]] = None
    explanation: Optional[str] = None


class ContributionProposalRead(BaseModel):
    id: str
    contribution_type: ProposalType
    target_card_id: Optional[str] = None
    target_fiche_id: Optional[str] = None
    proposed_data: dict[str, Any]
    previous_data_snapshot: Optional[dict[str, Any]] = None
    contributor: UserRead
    explanation: Optional[str] = None
    ai_review: Optional[FicheAiEvaluation] = None
    status: ProposalStatus
    moderator: Optional[UserRead] = None
    moderator_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    target_card: Optional[CardRead] = None
    target_fiche: Optional[PublishedFicheRead] = None


class ProposalModerationRequest(BaseModel):
    moderator_notes: Optional[str] = None


class RevisionHistoryRead(BaseModel):
    id: str
    entity_type: RevisionEntityType
    entity_id: str
    version_number: int
    data_snapshot: dict[str, Any]
    contributor_id: Optional[str] = None
    approved_by: Optional[str] = None
    created_at: datetime
