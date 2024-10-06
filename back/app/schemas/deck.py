from pydantic import BaseModel, Field
from typing import Optional


class DeckBase(BaseModel):
    title: str = Field(..., description="The unique title of the deck")
    description: Optional[str] = Field(
        None, description="An optional description of the deck"
    )


class DeckCreate(DeckBase):
    pass


class DeckUpdate(BaseModel):
    description: Optional[str] = Field(
        None, description="An optional description of the deck"
    )


class DeckResponse(DeckBase):
    id: str

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
