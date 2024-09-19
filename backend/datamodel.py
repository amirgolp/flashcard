from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid object ID")
        return ObjectId(v)


# Deck Models
class DeckBase(BaseModel):
    name: str = Field(..., example="Basic Vocabulary")
    description: Optional[str] = Field(
        None, example="Basic German words for beginners."
    )


class DeckCreate(DeckBase):
    pass


class DeckUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class DeckInDB(DeckBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "name": "Basic Vocabulary",
                "description": "Basic German words for beginners.",
            }
        }


# Flashcard Models
class FlashcardBase(BaseModel):
    deck_id: PyObjectId = Field(..., example="60d5ec49f8d4e15a8c0f0e4b")
    german: str = Field(..., example="Haus")
    english: str = Field(..., example="House")
    example_sentence: Optional[str] = Field(None, example="Das Haus ist groß.")


class FlashcardCreate(FlashcardBase):
    pass


class FlashcardUpdate(BaseModel):
    deck_id: Optional[PyObjectId] = None
    german: Optional[str] = None
    english: Optional[str] = None
    example_sentence: Optional[str] = None


class FlashcardInDB(FlashcardBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "deck_id": "60d5ec49f8d4e15a8c0f0e4b",
                "german": "Haus",
                "english": "House",
                "example_sentence": "Das Haus ist groß.",
            }
        }
