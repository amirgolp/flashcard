from fastapi import APIRouter, Depends, HTTPException
from .. import schemas, crud
from ..database import get_db
from ..models import User
from ..dependencies import get_current_user

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/cards", response_model=schemas.SearchResponse)
def search_cards(
    query: str,
    cursor: str | None = None,
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
