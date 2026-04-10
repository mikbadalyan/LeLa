from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class EditorialType(str, enum.Enum):
    PLACE = "place"
    PERSON = "person"
    EVENT = "event"


class EditorialRelationType(str, enum.Enum):
    LOCATED_AT = "located_at"
    CREATED_BY = "created_by"
    MENTIONS = "mentions"
    HOSTS = "hosts"
    RELATED = "related"


class EditorialObject(Base):
    __tablename__ = "editorial_objects"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    type: Mapped[EditorialType] = mapped_column(Enum(EditorialType))
    title: Mapped[str] = mapped_column(String(255))
    subtitle: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text)
    narrative_text: Mapped[str] = mapped_column(Text)
    media_url: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    contributor_id: Mapped[str] = mapped_column(ForeignKey("users.id"))

    contributor = relationship("User", back_populates="editorial_objects")
    place = relationship("Place", back_populates="editorial_object", uselist=False)
    person = relationship("Person", back_populates="editorial_object", uselist=False)
    event = relationship(
        "Event",
        back_populates="editorial_object",
        uselist=False,
        foreign_keys="Event.editorial_object_id",
    )
    source_relations = relationship(
        "EditorialRelation",
        foreign_keys="EditorialRelation.source_id",
        back_populates="source",
    )
    target_relations = relationship(
        "EditorialRelation",
        foreign_keys="EditorialRelation.target_id",
        back_populates="target",
    )
    likes = relationship("Like", back_populates="editorial_object")


class Place(Base):
    __tablename__ = "places"

    editorial_object_id: Mapped[str] = mapped_column(
        ForeignKey("editorial_objects.id"), primary_key=True
    )
    address: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(120))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    opening_hours: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    editorial_object = relationship("EditorialObject", back_populates="place")


class Person(Base):
    __tablename__ = "persons"

    editorial_object_id: Mapped[str] = mapped_column(
        ForeignKey("editorial_objects.id"), primary_key=True
    )
    name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(255))
    biography: Mapped[str] = mapped_column(Text)

    editorial_object = relationship("EditorialObject", back_populates="person")


class Event(Base):
    __tablename__ = "events"

    editorial_object_id: Mapped[str] = mapped_column(
        ForeignKey("editorial_objects.id"), primary_key=True
    )
    event_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    location_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("editorial_objects.id"), nullable=True
    )

    editorial_object = relationship(
        "EditorialObject",
        back_populates="event",
        foreign_keys=[editorial_object_id],
    )
    location = relationship("EditorialObject", foreign_keys=[location_id])



class EditorialRelation(Base):
    __tablename__ = "editorial_relations"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    source_id: Mapped[str] = mapped_column(ForeignKey("editorial_objects.id"))
    target_id: Mapped[str] = mapped_column(ForeignKey("editorial_objects.id"))
    relation_type: Mapped[EditorialRelationType] = mapped_column(
        Enum(EditorialRelationType)
    )

    source = relationship(
        "EditorialObject",
        foreign_keys=[source_id],
        back_populates="source_relations",
    )
    target = relationship(
        "EditorialObject",
        foreign_keys=[target_id],
        back_populates="target_relations",
    )
