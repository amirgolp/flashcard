from fastapi import FastAPI
from app.database import connect_db
from app.elastic import create_index
from app.routers import flashcards
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

def startup_event():
    try:
        connect_db()
        create_index()
        print("Connected to MongoDB and Elasticsearch index created.")
    except Exception as e:
        print(f"Error during startup: {e}")
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
    allow_origins=origins,  # Change to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(flashcards.router)