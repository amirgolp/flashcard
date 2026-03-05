from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from .. import schemas, crud
from ..database import get_db
from ..models import User
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from ..utils.token import verify_token, SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/search", tags=["search"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: str = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = verify_token(token, credentials_exception)
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_username(token_data.username, db)
    if user is None:
        raise credentials_exception
    return user


@router.get("/cards", response_model=schemas.SearchResponse)
def search_cards(
    query: str,
    cursor: Optional[str] = None,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    try:
        results, next_cursor = crud.search_cards(
            query, cursor, limit, db, owner=current_user
        )
        return {"results": results, "next_cursor": next_cursor}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
