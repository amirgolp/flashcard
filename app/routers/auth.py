from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from .. import schemas, crud
from ..database import get_db
from ..utils.token import create_access_token
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserOut)
def register(user_create: schemas.UserCreate, db: str = Depends(get_db)):
    user = crud.get_user_by_usersurfacename(user_create.username, db)
    if user:
        raise HTTPException(status_code=400, detail="Username already registered")
    user = crud.get_user_by_email(user_create.email, db)
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = crud.create_user(user_create, db)
    return user


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: str = Depends(get_db)):
    user = crud.authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
