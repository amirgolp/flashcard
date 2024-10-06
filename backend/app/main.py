import logging
import sys
import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from backend.app.routers.v1.decks import router as decks_router
from backend.app.routers.v1.flashcards import router as flashcards_router
from backend.app.database import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("german-flashcards-api")

app = FastAPI(title="German Flashcards API", version="1.0.0")

init_db(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(decks_router, prefix="/v1")
app.include_router(flashcards_router, prefix="/v1")


@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "Welcome to the German Flashcards API"}


@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid.uuid4())
    logger.info(f"[{request_id}] New request: {request.method} {request.url}")
    try:
        response = await call_next(request)
        logger.info(f"[{request_id}] Response status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"[{request_id}] Error processing request: {e}")
        raise e


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = str(uuid.uuid4())
    logger.error(f"[{request_id}] Validation error: {exc}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )


# Custom Exception Handler for General Errors
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    request_id = str(uuid.uuid4())
    logger.error(f"[{request_id}] Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )
