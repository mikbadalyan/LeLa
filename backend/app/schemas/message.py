from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.auth import UserRead


class MessageCreate(BaseModel):
    recipient_id: str = Field(min_length=1, max_length=80)
    content: Optional[str] = Field(default=None, max_length=4000)


class MessageEditorialAttachment(BaseModel):
    id: str
    title: str
    subtitle: Optional[str] = None
    media_url: str
    media_kind: str = "image"
    poster_url: Optional[str] = None
    href: str


class MessageRead(BaseModel):
    id: str
    content: Optional[str] = None
    created_at: datetime
    is_mine: bool
    sender: UserRead
    recipient: UserRead
    editorial: Optional[MessageEditorialAttachment] = None


class ConversationSummaryRead(BaseModel):
    participant: UserRead
    last_message_preview: str
    last_message_at: datetime
    unread_count: int = 0
    last_message_kind: str = "text"
