from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from .. import schemas, crud
from ..database import get_db

router = APIRouter(
    prefix="/search",
    tags=["search"]
)

@router.get("/cards", response_model=schemas.SearchResponse)
def search_cards(
    query: str,
    cursor: Optional[str] = None,
    limit: int = 10,
    db: str = Depends(get_db)
):
    try:
        results, next_cursor = crud.search_cards(query, cursor, limit, db)
        return {"results": results, "next_cursor": next_cursor}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
