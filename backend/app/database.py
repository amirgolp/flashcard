from mongoengine import connect
from dotenv import load_dotenv
import os

from backend.app.utils import env_path


class MongoConnectionError(Exception):
    pass


def connect_db():
    try:
        if not os.getenv("MONGODB_URI"):
            load_dotenv(env_path)
        mongo_uri = os.getenv("MONGODB_URI")
        if not mongo_uri:
            raise ValueError("MONGODB_URI not set in environment variables")
        connect(host=mongo_uri)
        print("Connected to MongoDB")
    except Exception as e:
        raise MongoConnectionError(e)
