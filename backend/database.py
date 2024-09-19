import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/german_flashcards")
client = AsyncIOMotorClient(MONGODB_URI)
db = client.german_flashcards

decks_collection = db.get_collection("decks")
flashcards_collection = db.get_collection("flashcards")
