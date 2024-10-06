import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from fastapi import FastAPI

# Configure Logging
logging.basicConfig(
    level=logging.INFO,  # Change to DEBUG for more verbosity
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("german-flashcards-api")

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "german_flashcards")

client: AsyncIOMotorClient = None
db = None

decks_collection = None
flashcards_collection = None


async def connect_to_mongo():
    global client, db, decks_collection, flashcards_collection
    try:
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client[DATABASE_NAME]
        decks_collection = db.get_collection("decks")
        flashcards_collection = db.get_collection("flashcards")
        logger.info("Connected to MongoDB")
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        raise e


async def disconnect_from_mongo():
    global client
    try:
        client.close()
        logger.info("Disconnected from MongoDB")
    except Exception as e:
        logger.error(f"Error disconnecting from MongoDB: {e}")
        raise e


def init_db(app: FastAPI):
    app.add_event_handler("startup", connect_to_mongo)
    app.add_event_handler("shutdown", disconnect_from_mongo)
