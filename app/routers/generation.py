from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from .. import schemas, crud
from ..database import get_db
from ..models import User
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from ..utils.token import verify_token

router = APIRouter(prefix="/generate", tags=["generation"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: str = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = verify_token(token, credentials_exception)
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_username(token_data.username, db)
    if user is None:
        raise credentials_exception
    return user


# ---- Generation Endpoints ----

@router.post("/next-batch", response_model=schemas.GenerationResponse)
def generate_next_batch(
    request: schemas.GenerateNextBatchRequest,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    return crud.generate_next_batch(
        book_id=request.book_id,
        num_pages=request.num_pages,
        num_cards=request.num_cards,
        db=db,
        owner=current_user,
    )


@router.post("/from-range", response_model=schemas.GenerationResponse)
def generate_from_range(
    request: schemas.GenerateFromRangeRequest,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    return crud.generate_from_range(
        book_id=request.book_id,
        start_page=request.start_page,
        end_page=request.end_page,
        num_cards=request.num_cards,
        db=db,
        owner=current_user,
    )


# ---- Draft Review Endpoints ----

@router.get("/drafts", response_model=List[schemas.DraftCardResponse])
def list_drafts(
    book_id: Optional[str] = None,
    batch_id: Optional[str] = None,
    status: str = "pending",
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    return crud.list_drafts(book_id, batch_id, status, skip, limit, db, owner=current_user)


@router.put("/drafts/{draft_id}", response_model=schemas.DraftCardResponse)
def update_draft(
    draft_id: str,
    draft_update: schemas.DraftCardUpdate,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    draft = crud.update_draft(draft_id, draft_update, db, owner=current_user)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft


@router.post("/drafts/{draft_id}/approve", response_model=schemas.Card)
def approve_draft(
    draft_id: str,
    deck_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    card = crud.approve_draft(draft_id, deck_id, db, owner=current_user)
    if not card:
        raise HTTPException(status_code=404, detail="Draft not found")
    return card


@router.post("/drafts/bulk-approve", response_model=List[schemas.Card])
def bulk_approve_drafts(
    request: schemas.BulkApproveRequest,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    return crud.bulk_approve_drafts(
        request.draft_ids, request.deck_id, db, owner=current_user
    )


@router.post("/drafts/{draft_id}/reject")
def reject_draft(
    draft_id: str,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    success = crud.reject_draft(draft_id, db, owner=current_user)
    if not success:
        raise HTTPException(status_code=404, detail="Draft not found")
    return {"detail": "Draft rejected"}


@router.delete("/drafts/rejected")
def cleanup_rejected(
    book_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    count = crud.delete_rejected_drafts(book_id, db, owner=current_user)
    return {"detail": f"Deleted {count} rejected drafts"}
