from fastapi import APIRouter, HTTPException, Depends
from typing import List
from .. import schemas, crud
from ..database import get_db
from ..models import User
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from ..utils.token import verify_token, SECRET_KEY, ALGORITHM
from ..schemas import TokenData

router = APIRouter(prefix="/cards", tags=["cards"])

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


@router.post("/", response_model=schemas.Card)
def create_card(
    card: schemas.CardCreate,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    return crud.create_card(card, db, owner=current_user)


@router.get("/{card_id}", response_model=schemas.Card)
def get_card(
    card_id: str,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    card = crud.get_card(card_id, db, owner=current_user)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@router.put("/{card_id}", response_model=schemas.Card)
def update_card(
    card_id: str,
    card_update: schemas.CardUpdate,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    card = crud.update_card(card_id, card_update, db, owner=current_user)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@router.delete("/{card_id}")
def delete_card(
    card_id: str,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    success = crud.delete_card(card_id, db, owner=current_user)
    if not success:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"detail": "Card deleted successfully"}


@router.get("/", response_model=List[schemas.Card])
def list_cards(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    cards = crud.list_cards(skip, limit, db, owner=current_user)
    return cards
