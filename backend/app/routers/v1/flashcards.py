from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from backend.app.models import FlashcardCreate, FlashcardUpdate, FlashcardInDB
from backend.app.database import flashcards_collection, decks_collection
from bson.objectid import ObjectId

router = APIRouter(prefix="/flashcards", tags=["Flashcards"])


@router.post("/", response_model=FlashcardInDB, status_code=status.HTTP_201_CREATED)
async def create_flashcard(flashcard: FlashcardCreate):
    for deck_title in flashcard.decks:
        deck = await decks_collection.find_one({"title": deck_title})
        if not deck:
            raise HTTPException(
                status_code=404, detail=f"Deck '{deck_title}' not found"
            )

    flashcard_dict = flashcard.dict()
    result = await flashcards_collection.insert_one(flashcard_dict)

    for deck_title in flashcard.decks:
        await decks_collection.update_one(
            {"title": deck_title}, {"$inc": {"numberOfCards": 1}}
        )

    created_flashcard = await flashcards_collection.find_one(
        {"_id": result.inserted_id}
    )
    return created_flashcard


@router.get("/", response_model=List[FlashcardInDB])
async def get_flashcards(
    deck: Optional[str] = Query(None, description="Filter by Deck Title"),
    search: Optional[str] = Query(None, description="Search by front or back content"),
):
    query = {}
    if deck:
        query["decks"] = deck
    if search:
        query["$or"] = [
            {"front": {"$regex": search, "$options": "i"}},
            {"back": {"$regex": search, "$options": "i"}},
        ]
    flashcards = []
    async for flashcard in flashcards_collection.find(query):
        flashcards.append(flashcard)
    return flashcards


@router.get("/{flashcard_id}", response_model=FlashcardInDB)
async def get_flashcard(flashcard_id: str):
    flashcard = await flashcards_collection.find_one({"_id": ObjectId(flashcard_id)})
    if flashcard is None:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    return flashcard


@router.put("/{flashcard_id}", response_model=FlashcardInDB)
async def update_flashcard(flashcard_id: str, flashcard: FlashcardUpdate):
    existing_flashcard = await flashcards_collection.find_one(
        {"_id": ObjectId(flashcard_id)}
    )
    if existing_flashcard is None:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    update_data = {k: v for k, v in flashcard.dict().items() if v is not None}

    if "decks" in update_data:
        old_decks = existing_flashcard.get("decks", [])
        new_decks = update_data["decks"]

        for deck_title in new_decks:
            deck = await decks_collection.find_one({"title": deck_title})
            if not deck:
                raise HTTPException(
                    status_code=404, detail=f"Deck '{deck_title}' not found"
                )

        decks_to_add = set(new_decks) - set(old_decks)
        decks_to_remove = set(old_decks) - set(new_decks)

        for deck_title in decks_to_add:
            await decks_collection.update_one(
                {"title": deck_title}, {"$inc": {"numberOfCards": 1}}
            )
        for deck_title in decks_to_remove:
            await decks_collection.update_one(
                {"title": deck_title}, {"$inc": {"numberOfCards": -1}}
            )

    if update_data:
        await flashcards_collection.update_one(
            {"_id": ObjectId(flashcard_id)}, {"$set": update_data}
        )

    updated_flashcard = await flashcards_collection.find_one(
        {"_id": ObjectId(flashcard_id)}
    )
    return updated_flashcard


@router.delete("/{flashcard_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_flashcard(flashcard_id: str):
    flashcard = await flashcards_collection.find_one({"_id": ObjectId(flashcard_id)})
    if flashcard is None:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    for deck_title in flashcard.decks:
        await decks_collection.update_one(
            {"title": deck_title}, {"$inc": {"numberOfCards": -1}}
        )

    result = await flashcards_collection.delete_one({"_id": ObjectId(flashcard_id)})
    if result.deleted_count == 1:
        return
    raise HTTPException(status_code=404, detail="Flashcard not found")
