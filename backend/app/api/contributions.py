from __future__ import annotations

from typing import Annotated
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_moderator_user
from app.db.session import get_db
from app.models.user import User
from app.models.contribution import ContributionFicheStatus, ContributionFicheType
from app.schemas.contribution import (
    ContributionModerationActionRequest,
    ContributionCreate,
    ContributionFicheCreate,
    ContributionFicheRead,
    ContributionFicheUpdate,
    ContributionModerationRead,
    ContributionProposalCreate,
    ContributionProposalRead,
    ContributionProposalUpdate,
    ContributionRead,
    RevisionHistoryRead,
)
from app.services.contribution_service import (
    approve_contribution,
    create_contribution,
    create_fiche,
    list_fiches,
    list_pending_contributions,
    list_user_contributions,
    moderate_contribution,
    read_fiche,
    run_fiche_ai_review,
    submit_fiche_for_moderation,
    update_fiche,
)
from app.services.proposal_service import (
    create_proposal,
    list_my_revision_history,
    list_my_proposals,
    read_proposal,
    run_proposal_ai_review,
    submit_proposal_for_moderation,
    update_proposal,
)

router = APIRouter(prefix="/contributions", tags=["contributions"])


@router.post("", response_model=ContributionRead)
def submit_contribution(
    payload: ContributionCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContributionRead:
    return create_contribution(db, payload, current_user)


@router.post("/fiches", response_model=ContributionFicheRead)
def create_contribution_fiche(
    payload: ContributionFicheCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContributionFicheRead:
    return create_fiche(db, payload, current_user)


@router.get("/fiches", response_model=list[ContributionFicheRead])
def read_contribution_fiches(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    status_filter: Optional[ContributionFicheStatus] = Query(default=None, alias="status"),
    type_filter: Optional[ContributionFicheType] = Query(default=None, alias="type"),
    city: Optional[str] = Query(default=None),
) -> list[ContributionFicheRead]:
    return list_fiches(
        db,
        current_user,
        status_filter=status_filter,
        type_filter=type_filter,
        city=city,
    )


@router.get("/fiches/{fiche_id}", response_model=ContributionFicheRead)
def read_contribution_fiche(
    fiche_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContributionFicheRead:
    try:
        return read_fiche(db, fiche_id, current_user)
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.put("/fiches/{fiche_id}", response_model=ContributionFicheRead)
def update_contribution_fiche(
    fiche_id: str,
    payload: ContributionFicheUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContributionFicheRead:
    try:
        return update_fiche(db, fiche_id, payload, current_user)
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.post("/fiches/{fiche_id}/ai-review", response_model=ContributionFicheRead)
def review_contribution_fiche_with_ai(
    fiche_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContributionFicheRead:
    try:
        return run_fiche_ai_review(db, fiche_id, current_user)
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.post("/fiches/{fiche_id}/submit", response_model=ContributionFicheRead)
def submit_contribution_fiche_for_moderation(
    fiche_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContributionFicheRead:
    try:
        return submit_fiche_for_moderation(db, fiche_id, current_user)
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.post("/proposals", response_model=ContributionProposalRead)
def create_contribution_proposal(
    payload: ContributionProposalCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContributionProposalRead:
    return create_proposal(db, payload, current_user)


@router.get("/proposals/my", response_model=list[ContributionProposalRead])
def read_my_proposals(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[ContributionProposalRead]:
    return list_my_proposals(db, current_user)


@router.get("/revisions/my", response_model=list[RevisionHistoryRead])
def read_my_revisions(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[RevisionHistoryRead]:
    return list_my_revision_history(db, current_user)


@router.get("/proposals/{proposal_id}", response_model=ContributionProposalRead)
def read_contribution_proposal(
    proposal_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContributionProposalRead:
    try:
        return read_proposal(db, proposal_id, current_user)
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.put("/proposals/{proposal_id}", response_model=ContributionProposalRead)
def update_contribution_proposal(
    proposal_id: str,
    payload: ContributionProposalUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContributionProposalRead:
    try:
        return update_proposal(db, proposal_id, payload, current_user)
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.post("/proposals/{proposal_id}/ai-review", response_model=ContributionProposalRead)
def review_contribution_proposal_with_ai(
    proposal_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContributionProposalRead:
    try:
        return run_proposal_ai_review(db, proposal_id, current_user)
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.post("/proposals/{proposal_id}/submit", response_model=ContributionProposalRead)
def submit_contribution_proposal_for_moderation(
    proposal_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContributionProposalRead:
    try:
        return submit_proposal_for_moderation(db, proposal_id, current_user)
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.get("", response_model=list[ContributionModerationRead])
def read_contributions(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_moderator_user)],
    status_filter: Optional[str] = Query(default="pending", alias="status"),
) -> list[ContributionModerationRead]:
    if status_filter != "pending":
        return []

    return list_pending_contributions(db)


@router.get("/mine", response_model=list[ContributionModerationRead])
def read_my_contributions(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[ContributionModerationRead]:
    return list_user_contributions(db, current_user)


@router.post("/{contribution_id}/approve", response_model=ContributionRead)
def approve_pending_contribution(
    contribution_id: str,
    db: Annotated[Session, Depends(get_db)],
    moderator: Annotated[User, Depends(get_moderator_user)],
) -> ContributionRead:
    try:
        return approve_contribution(db, contribution_id, moderator)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.post("/{contribution_id}/moderate", response_model=ContributionRead)
def moderate_pending_contribution(
    contribution_id: str,
    payload: ContributionModerationActionRequest,
    db: Annotated[Session, Depends(get_db)],
    moderator: Annotated[User, Depends(get_moderator_user)],
) -> ContributionRead:
    try:
        return moderate_contribution(db, contribution_id, payload, moderator)
    except ValueError as error:
        detail = str(error)
        status_code = (
            status.HTTP_404_NOT_FOUND
            if detail == "Contribution introuvable."
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=status_code, detail=detail) from error
