from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class Status(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"
    fail = "fail"


class FlashcardBase(BaseModel):
    german_word: str = Field(..., description="The German word")
    english_translation: str = Field(..., description="The English translation")
    decks: List[str] = Field([], description="List of deck titles")
    status: Status = Field(
        Status.easy, description="The status of the flashcard"
    )


class FlashcardCreate(FlashcardBase):
    pass


class FlashcardUpdate(BaseModel):
    english_translation: Optional[str]
    decks: Optional[List[str]]
    status: Optional[Status]


class FlashcardResponse(FlashcardBase):
    id: str
    date_created: datetime
    date_modified: datetime
    last_studied_time: Optional[datetime]

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True


class RequiredFilters(BaseModel):
    status: Optional[Status] = None
    deck: Optional[str] = None


class Pagination(BaseModel):
    page: int = Field(1, ge=1, description="Page number (starting from 1)")
    page_size: int = Field(10, ge=1, le=100, description="Number of items per page")
