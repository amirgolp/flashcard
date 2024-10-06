from pymongo import ReturnDocument

from back.app.core.logger import get_logger

logger = get_logger()


async def create_flashcard(flashcard: dict, db):
    try:
        result = await db.flashcards.insert_one(flashcard)
        flashcard["_id"] = result.inserted_id
        logger.debug(f"Flashcard created with id: {result.inserted_id}")
        return flashcard
    except Exception as e:
        logger.error(f"Error creating flashcard: {e}")
        raise


async def get_flashcard_by_id(id: str, db):
    flashcard = await db.flashcards.find_one({"_id": id})
    return flashcard


async def get_all_flashcards(db):
    flashcards = []
    async for flashcard in db.flashcards.find():
        flashcards.append(flashcard)
    return flashcards


async def update_flashcard(id: str, update_data: dict, db):
    result = await db.flashcards.find_one_and_update(
        {"_id": id}, {"$set": update_data}, return_document=ReturnDocument.AFTER
    )
    return result


async def delete_flashcard(id: str, db):
    result = await db.flashcards.delete_one({"_id": id})
    return result.deleted_count
