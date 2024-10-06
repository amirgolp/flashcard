from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class HardnessLevel(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class FlashcardBase(BaseModel):
    german_word: str = Field(..., description="The German word")
    english_translation: str = Field(..., description="The English translation")
    decks: List[str] = Field([], description="List of deck titles")
    hardness_level: Optional[HardnessLevel] = Field(
        HardnessLevel.medium, description="The hardness level"
    )
    guessed_correct_last_time: Optional[bool] = Field(
        False, description="If it was guessed correct on last try"
    )


class FlashcardCreate(FlashcardBase):
    pass


class FlashcardUpdate(BaseModel):
    english_translation: Optional[str]
    decks: Optional[List[str]]
    hardness_level: Optional[HardnessLevel]
    guessed_correct_last_time: Optional[bool]


class FlashcardResponse(FlashcardBase):
    id: str
    date_created: datetime
    date_modified: datetime
    last_studied_time: Optional[datetime]

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
