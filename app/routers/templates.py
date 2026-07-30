from fastapi import APIRouter, HTTPException, Depends
from .. import schemas, crud
from ..database import get_db
from ..models import User
from ..dependencies import get_current_user

router = APIRouter(prefix="/templates", tags=["templates"])

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
