from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.auth import UserRead


class FriendRead(UserRead):
    friendship_created_at: Optional[datetime] = None


class UserSearchResultRead(UserRead):
    is_friend: bool = False


class ShareCreate(BaseModel):
    editorial_id: str
    recipient_id: str


class ShareRead(BaseModel):
    id: str
    editorial_id: str
    recipient: UserRead
    created_at: datetime


class MapMarkerRead(BaseModel):
    editorial_id: str
    type: str
    title: str
    subtitle: Optional[str] = None
    latitude: float
    longitude: float
    href: str
    city: Optional[str] = None
    date: Optional[datetime] = None
