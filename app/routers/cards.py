from fastapi import APIRouter, HTTPException, Depends
from typing import List
from .. import schemas, crud
from ..database import get_db

router = APIRouter(
    prefix="/cards",
    tags=["cards"]
)

@router.post("/", response_model=schemas.Card)
def create_card(card: schemas.CardCreate, db: str = Depends(get_db)):
    return crud.create_card(card, db)

@router.get("/{card_id}", response_model=schemas.Card)
def get_card(card_id: str, db: str = Depends(get_db)):
    card = crud.get_card(card_id, db)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card

@router.put("/{card_id}", response_model=schemas.Card)
def update_card(card_id: str, card_update: schemas.CardUpdate, db: str = Depends(get_db)):
    card = crud.update_card(card_id, card_update, db)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card

@router.delete("/{card_id}")
def delete_card(card_id: str, db: str = Depends(get_db)):
    success = crud.delete_card(card_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"detail": "Card deleted successfully"}

@router.get("/", response_model=List[schemas.Card])
def list_cards(skip: int = 0, limit: int = 10, db: str = Depends(get_db)):
    cards = crud.list_cards(skip, limit, db)
    return cards
