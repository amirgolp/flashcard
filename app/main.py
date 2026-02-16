from fastapi import FastAPI
from .routers import decks, cards, search, auth, books, generation, storage
from .utils.logger import logger
from .exceptions import http_exception_handler
from fastapi.exceptions import RequestValidationError, HTTPException
from fastapi.responses import JSONResponse
from .database import connect_db, disconnect_db

app = FastAPI(
    title="Flashcard API",
    description="API for managing flashcards and decks with user authentication",
    version="0.1.0",
)

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_db_client():
    connect_db()


@app.on_event("shutdown")
def shutdown_db_client():
    disconnect_db()


app.include_router(auth.router)
app.include_router(decks.router)
app.include_router(cards.router)
app.include_router(search.router)
app.include_router(books.router)
app.include_router(generation.router)
app.include_router(storage.router)


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request, exc: HTTPException):
    logger.error(f"HTTPException: {exc.detail}")
    return await http_exception_handler(request, exc)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=400,
        content={"detail": exc.errors()},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    logger.error(f"Global error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )
