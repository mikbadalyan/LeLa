from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Share(Base):
    __tablename__ = "shares"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    sender_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    recipient_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    editorial_object_id: Mapped[str] = mapped_column(ForeignKey("editorial_objects.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_shares")
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="received_shares")
    editorial_object = relationship("EditorialObject")
