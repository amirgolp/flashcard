from fastapi import FastAPI
from backend.app.database import connect_db
from backend.app.elastic import create_index
from backend.app.routers import flashcards
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

from backend.app.utils import env_path

load_dotenv(dotenv_path=env_path)

app = FastAPI()


def startup_event():
    try:
        connect_db()
        create_index()
        print("Connected to MongoDB and Elasticsearch index created.")
    except Exception as e:
        print(f"Error during startup: {e}")
        exit(1)
        # Optionally, exit or handle accordingly


def shutdown_event():
    # Perform any necessary cleanup here
    print("Shutting down application.")


# Register event handlers
app.add_event_handler("startup", startup_event)
app.add_event_handler("shutdown", shutdown_event)

# CORS settings
origins = [
    "http://localhost:3000",
    # Add more origins as needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(flashcards.router)
