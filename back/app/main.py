from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from starlette.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from back.app.routes.v1.deck import router as deck_router
from back.app.routes.v1.flashcard import router as flashcard_router
from back.app.core.logger import get_logger
from back.app.utils.db import connect_db, close_db

logger = get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    await connect_db()
    yield
    logger.info("Shutting down...")
    await close_db()


app = FastAPI(title="Flashcard API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(deck_router, prefix="/v1/decks", tags=["Decks"])
app.include_router(flashcard_router, prefix="/v1/flashcards", tags=["Flashcards"])


@app.get("/")
def read_root():
    return RedirectResponse(url="/docs")
