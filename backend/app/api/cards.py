from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.contribution import CardCategoryMetadata
from app.models.user import User
from app.schemas.contribution import CardCreate, CardRead, CardSearchResult, PublishedFicheRead
from app.services.proposal_service import (
    create_card,
    list_card_fiches,
    list_editorial_fiches,
    read_card,
    read_card_by_editorial,
    search_cards,
)

router = APIRouter(prefix="/cards", tags=["cards"])


@router.get("/search", response_model=list[CardSearchResult])
def search_existing_cards(
    db: Annotated[Session, Depends(get_db)],
    q: Optional[str] = Query(default=None),
    city: Optional[str] = Query(default=None),
    tags: Optional[str] = Query(default=None),
    category: Optional[CardCategoryMetadata] = Query(default=None),
    limit: int = Query(default=12, ge=1, le=50),
) -> list[CardSearchResult]:
    return search_cards(db, query=q, city=city, tags=tags, category=category, limit=limit)


@router.post("", response_model=CardRead)
def create_draft_card(
    payload: CardCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> CardRead:
    return create_card(db, payload, current_user)


@router.get("/{card_id}", response_model=CardRead)
def get_card(
    card_id: str,
    db: Annotated[Session, Depends(get_db)],
) -> CardRead:
    card = read_card(db, card_id)
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carte introuvable.")
    return card


@router.get("/by-editorial/{editorial_id}", response_model=CardRead)
def get_card_by_editorial(
    editorial_id: str,
    db: Annotated[Session, Depends(get_db)],
) -> CardRead:
    card = read_card_by_editorial(db, editorial_id)
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carte introuvable.")
    return card


@router.get("/{card_id}/fiches", response_model=list[PublishedFicheRead])
def get_card_fiches(
    card_id: str,
    db: Annotated[Session, Depends(get_db)],
) -> list[PublishedFicheRead]:
    return list_card_fiches(db, card_id)


@router.get("/by-editorial/{editorial_id}/fiches", response_model=list[PublishedFicheRead])
def get_editorial_fiches(
    editorial_id: str,
    db: Annotated[Session, Depends(get_db)],
) -> list[PublishedFicheRead]:
    return list_editorial_fiches(db, editorial_id)
