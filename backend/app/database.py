from mongoengine import connect
from dotenv import load_dotenv
import os

def connect_db():
    load_dotenv()
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        raise ValueError("MONGODB_URI not set in environment variables")
    connect(host=mongo_uri)
