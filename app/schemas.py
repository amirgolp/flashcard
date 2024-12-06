from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class HardnessLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class CardBase(BaseModel):
    front: str
    back: str
    example_original: Optional[str] = None
    example_translation: Optional[str] = None
    hardness_level: HardnessLevel = HardnessLevel.MEDIUM


class CardCreate(CardBase):
    pass


class CardUpdate(BaseModel):
    front: Optional[str]
    back: Optional[str]
    example_original: Optional[str]
    example_translation: Optional[str]
    hardness_level: Optional[HardnessLevel]


class Card(CardBase):
    id: str
    date_created: datetime
    last_edited: datetime
    last_visited: Optional[datetime] = None

    class Config:
        from_attributes = True


class DeckBase(BaseModel):
    name: str
    description: Optional[str] = None


class DeckCreate(DeckBase):
    card_ids: List[str] = Field(default_factory=lambda: list)


class DeckUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]
    card_ids: Optional[List[str]]


class Deck(DeckBase):
    id: str
    cards: List[Card] = Field(default_factory=lambda: list)

    class Config:
        from_attributes = True


class SearchResponse(BaseModel):
    results: List[Card]
    next_cursor: Optional[str] = None
