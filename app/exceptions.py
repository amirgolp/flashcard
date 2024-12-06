from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from .utils.logger import logger


async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"Request: {request.url} - Error: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
