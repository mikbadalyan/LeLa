from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.contribution import ContributionStatus, ContributionType
from app.schemas.auth import UserRead


class ContributionCreate(BaseModel):
    type: ContributionType
    title: str
    subtitle: Optional[str] = None
    description: str
    city: Optional[str] = None
    address: Optional[str] = None
    neighborhood: Optional[str] = None
    opening_hours: Optional[str] = None
    role: Optional[str] = None
    event_date: Optional[str] = None
    end_date: Optional[str] = None
    price: Optional[str] = None
    media_name: Optional[str] = None
    media_kind: Optional[str] = None
    external_url: Optional[str] = None
    linked_place_name: Optional[str] = None
    linked_person_name: Optional[str] = None
    linked_event_name: Optional[str] = None


class ContributionRead(BaseModel):
    id: str
    status: ContributionStatus
    created_at: datetime
    type: ContributionType
    title: str


class ContributionModerationRead(BaseModel):
    id: str
    status: ContributionStatus
    created_at: datetime
    type: ContributionType
    title: str
    subtitle: Optional[str] = None
    description: str
    media_name: Optional[str] = None
    payload: dict
    submitter: UserRead
