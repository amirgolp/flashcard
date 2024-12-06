from fastapi import APIRouter, HTTPException, Depends
from typing import List
from .. import schemas, crud
from ..database import get_db

router = APIRouter(
    prefix="/decks",
    tags=["decks"]
)

@router.post("/", response_model=schemas.Deck)
def create_deck(deck: schemas.DeckCreate, db: str = Depends(get_db)):
    return crud.create_deck(deck, db)

@router.get("/{deck_id}", response_model=schemas.Deck)
def get_deck(deck_id: str, db: str = Depends(get_db)):
    deck = crud.get_deck(deck_id, db)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck

@router.put("/{deck_id}", response_model=schemas.Deck)
def update_deck(deck_id: str, deck_update: schemas.DeckUpdate, db: str = Depends(get_db)):
    deck = crud.update_deck(deck_id, deck_update, db)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck

@router.delete("/{deck_id}")
def delete_deck(deck_id: str, db: str = Depends(get_db)):
    success = crud.delete_deck(deck_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="Deck not found")
    return {"detail": "Deck deleted successfully"}

@router.get("/", response_model=List[schemas.Deck])
def list_decks(skip: int = 0, limit: int = 10, db: str = Depends(get_db)):
    decks = crud.list_decks(skip, limit, db)
    return decks
