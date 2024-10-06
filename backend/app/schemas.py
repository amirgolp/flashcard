from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class FlashcardBase(BaseModel):
    german: str = Field(..., example="Haus")
    english: str = Field(..., example="House")
    notes: Optional[str] = Field("", example="This is a common noun.")


class FlashcardCreate(FlashcardBase):
    pass


class FlashcardUpdate(BaseModel):
    german: Optional[str] = None
    english: Optional[str] = None
    notes: Optional[str] = None
    guessed_correct: Optional[bool] = None
    guessed_wrong: Optional[bool] = None


class FlashcardOut(FlashcardBase):
    id: str
    date_created: datetime
    date_modified: datetime
    guessed_correct: bool
    guessed_wrong: bool

    class Config:
        from_attributes = True
