import mongoengine
from dotenv import load_dotenv
import os
from typing import Generator

load_dotenv(dotenv_path="app/.env")


def connect_db(alias: str = "default"):
    """
    Establishes a connection to the MongoDB database using the provided alias.
    """
    # Use the full connection string from MONGODB_HOST
    connection_string = os.getenv("MONGODB_HOST")
    
    if connection_string:
        # If using a full connection string (mongodb+srv://), connect directly
        mongoengine.connect(
            host=connection_string,
            alias=alias,
        )
    else:
        # Fallback to individual parameters
        mongoengine.connect(
            db=os.getenv("MONGODB_DB", "flashcard_db"),
            username=os.getenv("MONGODB_USER"),
            password=os.getenv("MONGODB_PASSWORD"),
            host="mongodb://localhost:27017",
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
