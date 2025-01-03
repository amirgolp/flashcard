from fastapi import FastAPI
from .routers import decks, cards, search, auth
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
