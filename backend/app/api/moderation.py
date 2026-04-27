from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_moderator_user
from app.db.session import get_db
from app.models.contribution import (
    CardCategoryMetadata,
    ContributionFicheStatus,
    ProposalStatus,
    ProposalType,
)
from app.models.user import User
from app.schemas.contribution import (
    ContributionFicheRead,
    ContributionProposalRead,
    FicheModerationRequest,
    ProposalModerationRequest,
)
from app.services.contribution_service import moderate_fiche
from app.services.proposal_service import list_moderation_proposals, moderate_proposal

router = APIRouter(prefix="/moderation", tags=["moderation"])


@router.get("/proposals", response_model=list[ContributionProposalRead])
def read_moderation_proposals(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_moderator_user)],
    status_filter: Optional[ProposalStatus] = Query(default=ProposalStatus.PENDING_MODERATION, alias="status"),
    type_filter: Optional[ProposalType] = Query(default=None, alias="type"),
    city: Optional[str] = Query(default=None),
    min_score: Optional[int] = Query(default=None, ge=0, le=100),
    duplicate_risk: Optional[int] = Query(default=None, ge=0, le=100),
    category: Optional[CardCategoryMetadata] = Query(default=None),
    contributor: Optional[str] = Query(default=None),
    date: Optional[str] = Query(default=None),
) -> list[ContributionProposalRead]:
    return list_moderation_proposals(
        db,
        status_filter=status_filter,
        type_filter=type_filter,
        city=city,
        min_score=min_score,
        duplicate_risk=duplicate_risk,
        category_metadata=category,
        contributor=contributor,
        selected_date=date,
    )


@router.get("/proposals/{proposal_id}", response_model=ContributionProposalRead)
def read_moderation_proposal(
    proposal_id: str,
    db: Annotated[Session, Depends(get_db)],
    moderator: Annotated[User, Depends(get_moderator_user)],
) -> ContributionProposalRead:
    from app.services.proposal_service import read_proposal

    try:
        return read_proposal(db, proposal_id, moderator)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.post("/proposals/{proposal_id}/approve", response_model=ContributionProposalRead)
def approve_proposal(
    proposal_id: str,
    payload: ProposalModerationRequest,
    db: Annotated[Session, Depends(get_db)],
    moderator: Annotated[User, Depends(get_moderator_user)],
) -> ContributionProposalRead:
    try:
        return moderate_proposal(db, proposal_id, moderator, ProposalStatus.APPROVED, payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.post("/proposals/{proposal_id}/reject", response_model=ContributionProposalRead)
def reject_proposal(
    proposal_id: str,
    payload: ProposalModerationRequest,
    db: Annotated[Session, Depends(get_db)],
    moderator: Annotated[User, Depends(get_moderator_user)],
) -> ContributionProposalRead:
    try:
        return moderate_proposal(db, proposal_id, moderator, ProposalStatus.REJECTED, payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.post("/proposals/{proposal_id}/needs-changes", response_model=ContributionProposalRead)
def request_proposal_changes(
    proposal_id: str,
    payload: ProposalModerationRequest,
    db: Annotated[Session, Depends(get_db)],
    moderator: Annotated[User, Depends(get_moderator_user)],
) -> ContributionProposalRead:
    try:
        return moderate_proposal(db, proposal_id, moderator, ProposalStatus.NEEDS_CHANGES, payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.post("/fiches/{fiche_id}/approve", response_model=ContributionFicheRead)
def approve_fiche(
    fiche_id: str,
    payload: FicheModerationRequest,
    db: Annotated[Session, Depends(get_db)],
    moderator: Annotated[User, Depends(get_moderator_user)],
) -> ContributionFicheRead:
    try:
        return moderate_fiche(
            db,
            fiche_id,
            moderator,
            ContributionFicheStatus.APPROVED,
            payload,
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.post("/fiches/{fiche_id}/reject", response_model=ContributionFicheRead)
def reject_fiche(
    fiche_id: str,
    payload: FicheModerationRequest,
    db: Annotated[Session, Depends(get_db)],
    moderator: Annotated[User, Depends(get_moderator_user)],
) -> ContributionFicheRead:
    try:
        return moderate_fiche(
            db,
            fiche_id,
            moderator,
            ContributionFicheStatus.REJECTED,
            payload,
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.post("/fiches/{fiche_id}/needs-changes", response_model=ContributionFicheRead)
def request_fiche_changes(
    fiche_id: str,
    payload: FicheModerationRequest,
    db: Annotated[Session, Depends(get_db)],
    moderator: Annotated[User, Depends(get_moderator_user)],
) -> ContributionFicheRead:
    try:
        return moderate_fiche(
            db,
            fiche_id,
            moderator,
            ContributionFicheStatus.NEEDS_CHANGES,
            payload,
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
