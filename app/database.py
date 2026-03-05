import mongoengine
from dotenv import load_dotenv
import os
from typing import Generator

load_dotenv(dotenv_path="app/.env")
import pymongo
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

def check_mongo_connection(uri: str, timeout_ms: int = 2000) -> bool:
    try:
        client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=timeout_ms)
        client.admin.command('ping')
        return True
    except (ConnectionFailure, ServerSelectionTimeoutError, Exception):
        return False


def connect_db(alias: str = "default"):
    """
    Establishes a connection to the MongoDB database using the provided alias.
    """
    local_uri = os.getenv("LOCAL_MONGODB_URI", "mongodb://admin:secretpassword@localhost:27017/flashcard_db?authSource=admin")
    cloud_uri = os.getenv("MONGODB_HOST")
    
    # Prioritize local container
    if check_mongo_connection(local_uri):
        print("Connected to Local MongoDB")
        mongoengine.connect(host=local_uri, alias=alias)
        return
        
    # Fallback to cloud
    if cloud_uri:
        print("Connected to Cloud MongoDB")
        mongoengine.connect(host=cloud_uri, alias=alias)
        return

    # Fallback to individual parameters
    print("Fallback to individual MongoDB Connection")
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
