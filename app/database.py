import mongoengine
from dotenv import load_dotenv
import os
from typing import Generator

load_dotenv(dotenv_path=".env")


def connect_db(alias: str = "default"):
    """
    Establishes a connection to the MongoDB database using the provided alias.
    """
    mongoengine.connect(
        db=os.getenv("MONGODB_DB", "flashcard_db"),
        username=os.getenv("MONGODB_USER"),
        password=os.getenv("MONGODB_PASSWORD"),
        host=os.getenv("MONGODB_HOST", "mongodb+srv://localhost:27017/flashcard_db"),
        alias=alias,
    )


def disconnect_db(alias: str = "default"):
    """
    Disconnects the MongoDB connection associated with the provided alias.
    """
    mongoengine.connection.disconnect(alias=alias)


def get_db() -> Generator[str, None, None]:
    """
    Dependency that yields the connection alias.
    """
    alias = "default"
    try:
        yield alias
    finally:
        pass
