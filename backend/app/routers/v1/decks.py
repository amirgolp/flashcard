from fastapi import APIRouter, HTTPException, status
from typing import List
from datamodel import DeckCreate, DeckUpdate, DeckInDB
from database import decks_collection, flashcards_collection
from bson.objectid import ObjectId

router = APIRouter(prefix="/decks", tags=["Decks"])


@router.post("/", response_model=DeckInDB, status_code=status.HTTP_201_CREATED)
async def create_deck(deck: DeckCreate):
    deck_dict = deck.dict()
    result = await decks_collection.insert_one(deck_dict)
    created_deck = await decks_collection.find_one({"_id": result.inserted_id})
    return created_deck


@router.get("/", response_model=List[DeckInDB])
async def get_decks():
    decks = []
    async for deck in decks_collection.find():
        decks.append(deck)
    return decks


@router.get("/{deck_id}", response_model=DeckInDB)
async def get_deck(deck_id: str):
    deck = await decks_collection.find_one({"_id": ObjectId(deck_id)})
    if deck is None:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck


@router.put("/{deck_id}", response_model=DeckInDB)
async def update_deck(deck_id: str, deck: DeckUpdate):
    update_data = {k: v for k, v in deck.dict().items() if v is not None}
    if update_data:
        result = await decks_collection.update_one(
            {"_id": ObjectId(deck_id)}, {"$set": update_data}
        )
        if result.modified_count == 1:
            updated_deck = await decks_collection.find_one({"_id": ObjectId(deck_id)})
            if updated_deck:
                return updated_deck
    existing_deck = await decks_collection.find_one({"_id": ObjectId(deck_id)})
    if existing_deck is None:
        raise HTTPException(status_code=404, detail="Deck not found")
    return existing_deck


@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deck(deck_id: str):
    # Delete all associated flashcards
    await flashcards_collection.delete_many({"deck_id": ObjectId(deck_id)})
    result = await decks_collection.delete_one({"_id": ObjectId(deck_id)})
    if result.deleted_count == 1:
        return
    raise HTTPException(status_code=404, detail="Deck not found")
