from fastapi import APIRouter, HTTPException, Depends
from typing import List
from .. import schemas, crud
from ..database import get_db
from ..models import User
from ..dependencies import get_current_user

router = APIRouter(prefix="/cards", tags=["cards"])

@router.post("/", response_model=schemas.Card)
def create_card(
    card: schemas.CardCreate,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    return crud.create_card(card, db, owner=current_user)


@router.get("/{card_id}", response_model=schemas.Card)
def get_card(
    card_id: str,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    card = crud.get_card(card_id, db, owner=current_user)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@router.put("/{card_id}", response_model=schemas.Card)
def update_card(
    card_id: str,
    card_update: schemas.CardUpdate,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    card = crud.update_card(card_id, card_update, db, owner=current_user)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@router.delete("/{card_id}")
def delete_card(
    card_id: str,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    success = crud.delete_card(card_id, db, owner=current_user)
    if not success:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"detail": "Card deleted successfully"}


@router.get("/", response_model=list[schemas.Card])
def list_cards(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    cards = crud.list_cards(skip, limit, db, owner=current_user)
    return cards
