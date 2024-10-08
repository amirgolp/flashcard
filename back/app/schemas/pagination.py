from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict

from back.app.schemas.flashcard import Status


class Pagination(BaseModel):
    page: int = Field(1, ge=1, description="Page number (starting from 1)")
    page_size: int = Field(10, ge=1, le=100, description="Number of items per page")
    status: Optional[Status] = None
    deck: Optional[str] = None

    @field_validator('page_size')
    def check_page_size(cls, v):
        if v > 100:
            raise ValueError("Page size must not exceed 100")
        return v

    def build_filter(self) -> Dict:
        filters = {}
        if self.status:
            filters['status'] = self.status
        if self.deck:
            filters['decks'] = self.deck
        return filters

    def pagination_options(self) -> Dict:
        return {
            "skip": (self.page - 1) * self.page_size,
            "limit": self.page_size
        }

    def include_fields(self, keys: Optional[list] = None) -> Dict:
        if keys:
            return {key: 1 for key in keys}
        return {}

    def exclude_fields(self, keys: Optional[list] = None) -> Dict:
        if keys:
            return {key: 0 for key in keys}
        return {}
