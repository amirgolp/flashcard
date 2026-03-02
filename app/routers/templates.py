from fastapi import APIRouter, HTTPException, Depends
from typing import List
from .. import schemas, crud
from ..database import get_db
from ..models import User
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from ..utils.token import verify_token

router = APIRouter(prefix="/templates", tags=["templates"])

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


@router.post("/", response_model=schemas.TemplateResponse)
def create_template(
    template: schemas.TemplateCreate,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    return crud.create_template(template, db, owner=current_user)


@router.get("/{template_id}", response_model=schemas.TemplateResponse)
def get_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    template = crud.get_template(template_id, db, owner=current_user)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.put("/{template_id}", response_model=schemas.TemplateResponse)
def update_template(
    template_id: str,
    template_update: schemas.TemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    template = crud.update_template(template_id, template_update, db, owner=current_user)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found or not editable")
    return template


@router.delete("/{template_id}")
def delete_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    success = crud.delete_template(template_id, db, owner=current_user)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found or not editable")
    return {"detail": "Template deleted successfully"}


@router.get("/", response_model=list[schemas.TemplateResponse])
def list_templates(
    skip: int = 0,
    limit: int = 50,
    include_defaults: bool = True,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    templates = crud.list_templates(skip, limit, include_defaults, db, owner=current_user)
    return templates
