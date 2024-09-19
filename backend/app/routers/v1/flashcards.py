from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from datamodel import FlashcardCreate, FlashcardUpdate, FlashcardInDB
from database import flashcards_collection  # Corrected import
from bson.objectid import ObjectId

router = APIRouter(prefix="/flashcards", tags=["Flashcards"])


@router.post("/", response_model=FlashcardInDB, status_code=status.HTTP_201_CREATED)
async def create_flashcard(flashcard: FlashcardCreate):
    flashcard_dict = flashcard.dict()
    result = await flashcards_collection.insert_one(flashcard_dict)
    created_flashcard = await flashcards_collection.find_one(
        {"_id": result.inserted_id}
    )
    return created_flashcard


@router.get("/", response_model=List[FlashcardInDB])
async def get_flashcards(
    deck_id: Optional[str] = Query(None, description="Filter by Deck ID"),
    search: Optional[str] = Query(None, description="Search by German or English word"),
):
    query = {}
    if deck_id:
        query["deck_id"] = ObjectId(deck_id)
    if search:
        # Check if search query is a single word (no spaces)
        if " " not in search.strip():
            # Exact match on German or English field
            query["$or"] = [
                {"german": {"$regex": f"^{search}$", "$options": "i"}},
                {"english": {"$regex": f"^{search}$", "$options": "i"}},
            ]
        else:
            # Partial match as before
            query["$or"] = [
                {"german": {"$regex": search, "$options": "i"}},
                {"english": {"$regex": search, "$options": "i"}},
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
    update_data = {k: v for k, v in flashcard.dict().items() if v is not None}
    if update_data:
        result = await flashcards_collection.update_one(
            {"_id": ObjectId(flashcard_id)}, {"$set": update_data}
        )
        if result.modified_count == 1:
            flashcard_updated = await flashcards_collection.find_one(
                {"_id": ObjectId(flashcard_id)}
            )
            if flashcard_updated:
                return flashcard_updated
    existing_flashcard = await flashcards_collection.find_one(
        {"_id": ObjectId(flashcard_id)}
    )
    if existing_flashcard is None:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    return existing_flashcard


@router.delete("/{flashcard_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_flashcard(flashcard_id: str):
    result = await flashcards_collection.delete_one({"_id": ObjectId(flashcard_id)})
    if result.deleted_count == 1:
        return
    raise HTTPException(status_code=404, detail="Flashcard not found")
