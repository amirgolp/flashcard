from fastapi import APIRouter, HTTPException, status
from typing import List
import logging
from pymongo.errors import DuplicateKeyError

from backend.app.models import DeckCreate, DeckUpdate, DeckInDB, Deck
from backend.app import database
from bson import ObjectId

router = APIRouter(prefix="/decks", tags=["Decks"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@router.post("/", response_model=DeckInDB, status_code=status.HTTP_201_CREATED)
async def create_deck(deck: DeckCreate):
    deck_dict = deck.model_dump()
    deck_dict["number_of_cards"] = 0
    deck_dict["_id"] = ObjectId()

    try:
        # Attempt to insert the new deck into the collection
        result = await database.decks_collection.insert_one(deck_dict)
        if not result.acknowledged:
            logger.error("Insertion not acknowledged")
            raise HTTPException(status_code=500, detail="Failed to create deck")

        # Retrieve the newly created deck using the inserted_id
        new_deck = await database.decks_collection.find_one({"_id": result.inserted_id})
        if new_deck is None:
            logger.error(f"Deck not found after creation: {result.inserted_id}")
            raise HTTPException(status_code=404, detail="Deck not found after creation")

        # Return the deck as a DeckInDB instance
        return DeckInDB(**new_deck)

    except DuplicateKeyError:
        logger.warning(f"Duplicate deck title attempted: {deck.title}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deck with this title already exists.",
        )
    except Exception as e:
        logger.error(f"Unexpected error during deck creation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred.",
        )


@router.get("/", response_model=List[DeckInDB])
async def get_decks():
    decks = []
    async for deck in database.decks_collection.find():
        decks.append(deck)
    return decks


@router.get("/{deck_id}", response_model=DeckInDB)
async def get_deck(deck_id: str):
    deck = await database.decks_collection.find_one({"_id": ObjectId(deck_id)})
    if deck is None:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck


@router.put("/{deck_id}", response_model=DeckInDB)
async def update_deck(deck_id: str, deck: DeckUpdate):
    update_data = {k: v for k, v in deck.dict().items() if v is not None}
    if update_data:
        result = await database.decks_collection.update_one(
            {"_id": ObjectId(deck_id)}, {"$set": update_data}
        )
        if result.modified_count == 1:
            updated_deck = await database.decks_collection.find_one(
                {"_id": ObjectId(deck_id)}
            )
            if updated_deck:
                return updated_deck
    existing_deck = await database.decks_collection.find_one({"_id": ObjectId(deck_id)})
    if existing_deck is None:
        raise HTTPException(status_code=404, detail="Deck not found")
    return existing_deck


@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deck(deck_id: str):
    # Delete all associated flashcards
    await database.flashcards_collection.update_many(
        {"decks": deck_id}, {"$pull": {"decks": deck_id}}
    )
    result = await database.decks_collection.delete_one({"_id": ObjectId(deck_id)})
    if result.deleted_count == 1:
        return
    raise HTTPException(status_code=404, detail="Deck not found")
