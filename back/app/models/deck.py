from back.app.schemas.deck import DeckCreate
from pymongo.errors import DuplicateKeyError
from back.app.core.logger import get_logger

logger = get_logger()


async def create_deck(deck: DeckCreate, db):
    normalized_title = deck.title.strip()
    deck.title = normalized_title

    existing_deck = await db.decks.find_one({"title": normalized_title})
    if existing_deck:
        logger.error(f"Deck with title '{normalized_title}' already exists.")
        raise DuplicateKeyError(f"Deck with title '{normalized_title}' already exists.")

    deck_dict = deck.model_dump()
    try:
        result = await db.decks.insert_one(deck_dict)
        deck_dict["_id"] = result.inserted_id
        logger.debug(f"Deck created with id: {result.inserted_id}")
        return deck_dict
    except DuplicateKeyError:
        logger.error(f"Deck with title '{normalized_title}' already exists.")
        raise DuplicateKeyError(f"Deck with title '{normalized_title}' already exists.")


async def get_deck_by_title(title: str, db):
    deck = await db.decks.find_one({"title": title})
    return deck


async def get_all_decks(db):
    decks = []
    async for deck in db.decks.find():
        decks.append(deck)
    return decks


async def update_deck(title: str, update_data: dict, db):
    result = await db.decks.update_one({"title": title}, {"$set": update_data})
    return result.modified_count


async def delete_deck(title: str, db):
    result = await db.decks.delete_one({"title": title})
    return result.deleted_count
