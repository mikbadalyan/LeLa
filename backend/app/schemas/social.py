from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.auth import UserRead


class FriendRead(UserRead):
    friendship_created_at: Optional[datetime] = None


class FriendGraphNodeRead(UserRead):
    depth: int = 0
    is_self: bool = False
    is_direct_friend: bool = False
    mutual_count: int = 0
    connection_count: int = 0
    path_parent_id: Optional[str] = None


class FriendGraphEdgeRead(BaseModel):
    source_id: str
    target_id: str
    weight: int = 1


class FriendGraphRead(BaseModel):
    nodes: list[FriendGraphNodeRead]
    edges: list[FriendGraphEdgeRead]
    total_nodes: int
    truncated: bool = False


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
