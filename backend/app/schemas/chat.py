from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

from app.models.editorial import EditorialType


class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[ChatHistoryMessage] = Field(default_factory=list)
    conversation_id: Optional[str] = None
    current_path: Optional[str] = None
    current_focus: Optional[str] = None


class ChatRouteSuggestion(BaseModel):
    label: str
    href: str
    reason: str


class ChatEditorialSuggestion(BaseModel):
    id: str
    type: EditorialType
    title: str
    subtitle: Optional[str] = None
    description: str
    media_url: str
    media_kind: str = "image"
    poster_url: Optional[str] = None
    href: str


class ChatResponse(BaseModel):
    message: str
    response_id: Optional[str] = None
    mode: Literal["assistant", "fallback"] = "assistant"
    availability_message: Optional[str] = None
    suggested_routes: list[ChatRouteSuggestion]
    suggested_editorials: list[ChatEditorialSuggestion]
    follow_up_questions: list[str]


class ChatFeedbackCreate(BaseModel):
    conversation_id: str = Field(min_length=1, max_length=80)
    message_id: str = Field(min_length=1, max_length=80)
    rating: int = Field(ge=1, le=5)
    response_text: str = Field(min_length=1, max_length=8000)


class ChatFeedbackRead(BaseModel):
    id: str
    conversation_id: str
    message_id: str
    rating: int
