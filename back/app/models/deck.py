from back.app.schemas.deck import DeckCreate
from back.app.utils.db import db
from pymongo.errors import DuplicateKeyError
from back.app.core.logger import get_logger


logger = get_logger()

async def create_deck(deck: DeckCreate):
    deck_dict = deck.model_dump()
    try:
        result = await db.decks.insert_one(deck_dict)
        deck_dict["_id"] = result.inserted_id
        logger.debug(f"Deck created with id: {result.inserted_id}")
        return deck_dict
    except DuplicateKeyError:
        logger.error(f"Deck with title '{deck.title}' already exists.")
        raise


async def get_deck_by_title(title: str):
    deck = await db.decks.find_one({"title": title})
    return deck


async def get_all_decks():
    decks = []
    async for deck in db.decks.find():
        decks.append(deck)
    return decks


async def update_deck(title: str, update_data: dict):
    result = await db.decks.update_one({"title": title}, {"$set": update_data})
    return result.modified_count


async def delete_deck(title: str):
    result = await db.decks.delete_one({"title": title})
    return result.deleted_count
