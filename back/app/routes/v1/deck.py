from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from back.app.schemas.deck import DeckCreate, DeckResponse, DeckUpdate
from back.app.models.deck import (
    create_deck,
    get_deck_by_title,
    get_all_decks,
    update_deck,
    delete_deck,
)
from pymongo.errors import DuplicateKeyError
from back.app.core.logger import get_logger
from back.app.utils.db import get_database

logger = get_logger()

router = APIRouter()


@router.post("/", response_model=DeckResponse, status_code=status.HTTP_201_CREATED)
async def create_deck_endpoint(deck: DeckCreate, db=Depends(get_database)):
    logger.info(f"Attempting to create deck with title: {deck.title}")
    try:
        created_deck = await create_deck(deck, db)
        created_deck["id"] = str(created_deck["_id"])
        return DeckResponse(**created_deck)
    except DuplicateKeyError:
        logger.error(f"Deck with title '{deck.title}' already exists.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Deck with title '{deck.title}' already exists.",
        )
    except Exception as e:
        logger.exception(f"Unexpected error while creating deck: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/", response_model=List[DeckResponse])
async def get_decks_endpoint(db=Depends(get_database)):
    logger.info("Fetching all decks")
    try:
        decks = await get_all_decks(db)
        for deck in decks:
            deck["id"] = str(deck["_id"])
        return [DeckResponse(**deck) for deck in decks]
    except Exception as e:
        logger.exception(f"Error fetching decks: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/{title}", response_model=DeckResponse)
async def get_deck_endpoint(title: str, db=Depends(get_database)):
    logger.info(f"Fetching deck with title: {title}")
    try:
        deck = await get_deck_by_title(title, db)
        if deck:
            deck["id"] = str(deck["_id"])
            return DeckResponse(**deck)
        else:
            logger.warning(f"Deck not found: {title}")
            raise HTTPException(status_code=404, detail="Deck not found")
    except Exception as e:
        logger.exception(f"Error fetching deck '{title}': {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.put("/{title}", response_model=DeckResponse)
async def update_deck_endpoint(
    title: str, deck_update: DeckUpdate, db=Depends(get_database)
):
    logger.info(f"Updating deck with title: {title}")
    try:
        update_data = deck_update.dict(exclude_unset=True)
        if not update_data:
            logger.warning(f"No update data provided for deck '{title}'")
            raise HTTPException(status_code=400, detail="No update data provided")
        modified_count = await update_deck(title, update_data, db)
        if modified_count:
            deck = await get_deck_by_title(title, db)
            deck["id"] = str(deck["_id"])
            logger.info(f"Deck updated successfully: {title}")
            return DeckResponse(**deck)
        else:
            logger.warning(f"Deck not found: {title}")
            raise HTTPException(status_code=404, detail="Deck not found")
    except Exception as e:
        logger.exception(f"Unexpected error while updating deck '{title}': {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.delete("/{title}")
async def delete_deck_endpoint(title: str, db=Depends(get_database)):
    logger.info(f"Deleting deck with title: {title}")
    try:
        deleted_count = await delete_deck(title, db)
        if deleted_count:
            logger.info(f"Deck deleted successfully: {title}")
            return {"message": "Deck deleted successfully"}
        else:
            logger.warning(f"Deck not found: {title}")
            raise HTTPException(status_code=404, detail="Deck not found")
    except Exception as e:
        logger.exception(f"Unexpected error while deleting deck '{title}': {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
