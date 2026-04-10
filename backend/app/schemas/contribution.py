from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.contribution import ContributionStatus, ContributionType


class ContributionCreate(BaseModel):
    type: ContributionType
    title: str
    subtitle: Optional[str] = None
    description: str
    city: Optional[str] = None
    address: Optional[str] = None
    event_date: Optional[str] = None
    media_name: Optional[str] = None
    external_url: Optional[str] = None


class ContributionRead(BaseModel):
    id: str
    status: ContributionStatus
    created_at: datetime
    type: ContributionType
    title: str
