from fastapi import APIRouter, HTTPException, status
from typing import List
from datetime import datetime
from back.app.schemas.flashcard import (
    FlashcardCreate,
    FlashcardResponse,
    FlashcardUpdate,
)
from back.app.models.flashcard import (
    create_flashcard,
    get_flashcard_by_id,
    get_all_flashcards,
    update_flashcard,
    delete_flashcard,
)
from back.app.models.deck import get_deck_by_title
from back.app.core.logger import get_logger
from bson.objectid import ObjectId

logger = get_logger()

router = APIRouter()


@router.post("/", response_model=FlashcardResponse, status_code=status.HTTP_201_CREATED)
async def create_flashcard_endpoint(flashcard: FlashcardCreate):
    logger.info(f"Attempting to create flashcard: {flashcard.german_word}")
    try:
        decks = []
        for deck_title in flashcard.decks:
            deck = await get_deck_by_title(deck_title)
            if deck:
                decks.append(deck_title)
            else:
                logger.warning(f"Deck not found: {deck_title}")
                raise HTTPException(
                    status_code=400, detail=f"Deck not found: {deck_title}"
                )
        flashcard_dict = flashcard.dict()
        flashcard_dict["_id"] = str(ObjectId())
        flashcard_dict["decks"] = decks
        flashcard_dict["date_created"] = datetime.utcnow()
        flashcard_dict["date_modified"] = datetime.utcnow()
        flashcard_dict["last_studied_time"] = datetime.utcnow()
        created_flashcard = await create_flashcard(flashcard_dict)
        created_flashcard["id"] = str(created_flashcard["_id"])
        return FlashcardResponse(**created_flashcard)
    except Exception as e:
        logger.exception(
            f"Unexpected error while creating flashcard '{flashcard.german_word}': {e}"
        )
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/", response_model=List[FlashcardResponse])
async def get_flashcards_endpoint():
    logger.info("Fetching all flashcards")
    try:
        flashcards = await get_all_flashcards()
        for flashcard in flashcards:
            flashcard["id"] = str(flashcard["_id"])
        return [FlashcardResponse(**flashcard) for flashcard in flashcards]
    except Exception as e:
        logger.exception(f"Error fetching flashcards: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/{id}", response_model=FlashcardResponse)
async def get_flashcard_endpoint(id: str):
    logger.info(f"Fetching flashcard with id: {id}")
    try:
        flashcard = await get_flashcard_by_id(id)
        if flashcard:
            flashcard["id"] = str(flashcard["_id"])
            return FlashcardResponse(**flashcard)
        else:
            logger.warning(f"Flashcard not found: {id}")
            raise HTTPException(status_code=404, detail="Flashcard not found")
    except Exception as e:
        logger.exception(f"Error fetching flashcard '{id}': {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.put("/{id}", response_model=FlashcardResponse)
async def update_flashcard_endpoint(id: str, flashcard_update: FlashcardUpdate):
    logger.info(f"Updating flashcard with id: {id}")
    try:
        update_data = flashcard_update.dict(exclude_unset=True)
        if not update_data:
            logger.warning(f"No update data provided for flashcard '{id}'")
            raise HTTPException(status_code=400, detail="No update data provided")
        if "decks" in update_data:
            decks = []
            for deck_title in update_data["decks"]:
                deck = await get_deck_by_title(deck_title)
                if deck:
                    decks.append(deck_title)
                else:
                    logger.warning(f"Deck not found: {deck_title}")
                    raise HTTPException(
                        status_code=400, detail=f"Deck not found: {deck_title}"
                    )
            update_data["decks"] = decks
        update_data["date_modified"] = datetime.utcnow()
        updated_flashcard = await update_flashcard(id, update_data)
        if updated_flashcard:
            updated_flashcard["id"] = str(updated_flashcard["_id"])
            logger.info(f"Flashcard updated successfully: {id}")
            return FlashcardResponse(**updated_flashcard)
        else:
            logger.warning(f"Flashcard not found: {id}")
            raise HTTPException(status_code=404, detail="Flashcard not found")
    except Exception as e:
        logger.exception(f"Unexpected error while updating flashcard '{id}': {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.delete("/{id}")
async def delete_flashcard_endpoint(id: str):
    logger.info(f"Deleting flashcard with id: {id}")
    try:
        deleted_count = await delete_flashcard(id)
        if deleted_count:
            logger.info(f"Flashcard deleted successfully: {id}")
            return {"message": "Flashcard deleted successfully"}
        else:
            logger.warning(f"Flashcard not found: {id}")
            raise HTTPException(status_code=404, detail="Flashcard not found")
    except Exception as e:
        logger.exception(f"Unexpected error while deleting flashcard '{id}': {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
