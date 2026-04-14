from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.editorial import EditorialRelationType, EditorialType
from app.models.user import UserRole


class ContributorRead(BaseModel):
    id: str
    username: str
    display_name: str
    avatar_url: str
    city: Optional[str] = None
    role: UserRole = UserRole.CONTRIBUTOR


class RelatedEntitySummary(BaseModel):
    id: str
    type: EditorialType
    title: str
    subtitle: Optional[str] = None


class EditorialMetadata(BaseModel):
    city: Optional[str] = None
    address: Optional[str] = None
    opening_hours: Optional[str] = None
    date: Optional[datetime] = None
    price: Optional[int] = None
    role: Optional[str] = None


class EditorialCardRead(BaseModel):
    id: str
    type: EditorialType
    title: str
    subtitle: Optional[str] = None
    description: str
    narrative_text: str
    media_url: str
    created_at: datetime
    contributor: ContributorRead
    linked_entity: Optional[RelatedEntitySummary] = None
    like_count: int
    is_liked: bool
    metadata: EditorialMetadata


class EditorialRelationRead(BaseModel):
    id: str
    source_id: str
    target_id: str
    relation_type: EditorialRelationType


class EditorialDetailRead(EditorialCardRead):
    related: list[EditorialCardRead]
    relations: list[EditorialRelationRead]


class FeedResponse(BaseModel):
    items: list[EditorialCardRead]
    next_cursor: Optional[str]
    total: int
