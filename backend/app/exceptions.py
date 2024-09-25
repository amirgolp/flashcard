from fastapi import HTTPException


def not_found_exception(detail: str = "Resource not found"):
    return HTTPException(status_code=404, detail=detail)


def bad_request_exception(detail: str = "Bad request"):
    return HTTPException(status_code=400, detail=detail)


def internal_server_error_exception(detail: str = "Internal server error"):
    return HTTPException(status_code=500, detail=detail)
