from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime, timezone
from back.app.schemas.flashcard import (
    FlashcardCreate,
    FlashcardResponse,
    FlashcardUpdate, RequiredFilters,
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

from back.app.schemas.pagination import Pagination
from back.app.utils.db import get_database

logger = get_logger()

router = APIRouter()


@router.post("/", response_model=FlashcardResponse, status_code=status.HTTP_201_CREATED)
async def create_flashcard_endpoint(
    flashcard: FlashcardCreate, db=Depends(get_database)
):
    logger.info(f"Attempting to create flashcard: {flashcard.german_word}")
    try:
        decks = []
        for deck_title in flashcard.decks:
            deck = await get_deck_by_title(deck_title, db)
            if deck:
                decks.append(deck_title)
            else:
                logger.warning(f"Deck not found: {deck_title}")
                raise HTTPException(
                    status_code=400, detail=f"Deck not found: {deck_title}"
                )
        flashcard_dict = flashcard.model_dump()
        flashcard_dict["_id"] = str(ObjectId())
        flashcard_dict["decks"] = decks
        flashcard_dict["date_created"] = datetime.now(timezone.utc)
        flashcard_dict["date_modified"] = datetime.now(timezone.utc)
        flashcard_dict["last_studied_time"] = datetime.now(timezone.utc)
        created_flashcard = await create_flashcard(flashcard_dict, db)
        created_flashcard["id"] = str(created_flashcard["_id"])
        return FlashcardResponse(**created_flashcard)
    except Exception as e:
        logger.exception(
            f"Unexpected error while creating flashcard '{flashcard.german_word}': {e}"
        )
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/", response_model=List[FlashcardResponse])
async def get_flashcards_endpoint(
        required: RequiredFilters = Depends(),
        pagination: Pagination = Depends(),
        db=Depends(get_database),
):
    logger.info("Fetching flashcards with filters and pagination")
    try:
        filters = {}
        if required.status:
            filters["status"] = required.status
        if required.deck:
            filters["decks"] = required.deck

        skip = (pagination.page - 1) * pagination.page_size
        flashcards = await get_all_flashcards(db, filters, skip=skip, limit=pagination.page_size)
        for flashcard in flashcards:
            flashcard["id"] = str(flashcard["_id"])
        return [FlashcardResponse(**flashcard) for flashcard in flashcards]
    except Exception as e:
        logger.exception(f"Error fetching flashcards: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/{id}", response_model=FlashcardResponse)
async def get_flashcard_endpoint(id: str, db=Depends(get_database)):
    logger.info(f"Fetching flashcard with id: {id}")
    try:
        flashcard = await get_flashcard_by_id(id, db)
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
async def update_flashcard_endpoint(
    id: str, flashcard_update: FlashcardUpdate, db=Depends(get_database)
):
    logger.info(f"Updating flashcard with id: {id}")
    try:
        update_data = flashcard_update.model_dump(exclude_unset=True)
        if not update_data:
            logger.warning(f"No update data provided for flashcard '{id}'")
            raise HTTPException(status_code=400, detail="No update data provided")
        if "decks" in update_data:
            decks = []
            for deck_title in update_data["decks"]:
                deck = await get_deck_by_title(deck_title, db)
                if deck:
                    decks.append(deck_title)
                else:
                    logger.warning(f"Deck not found: {deck_title}")
                    raise HTTPException(
                        status_code=400, detail=f"Deck not found: {deck_title}"
                    )
            update_data["decks"] = decks
        update_data["date_modified"] = datetime.now(timezone.utc)
        updated_flashcard = await update_flashcard(id, update_data, db)
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
async def delete_flashcard_endpoint(id: str, db=Depends(get_database)):
    logger.info(f"Deleting flashcard with id: {id}")
    try:
        deleted_count = await delete_flashcard(id, db)
        if deleted_count:
            logger.info(f"Flashcard deleted successfully: {id}")
            return {"message": "Flashcard deleted successfully"}
        else:
            logger.warning(f"Flashcard not found: {id}")
            raise HTTPException(status_code=404, detail="Flashcard not found")
    except Exception as e:
        logger.exception(f"Unexpected error while deleting flashcard '{id}': {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
