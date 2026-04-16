from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class DirectMessage(Base):
    __tablename__ = "direct_messages"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    sender_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    recipient_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    editorial_object_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("editorial_objects.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    recipient = relationship(
        "User", foreign_keys=[recipient_id], back_populates="received_messages"
    )
    editorial_object = relationship("EditorialObject")
