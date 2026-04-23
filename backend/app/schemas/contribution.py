from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.contribution import (
    ContributionModerationAction,
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
