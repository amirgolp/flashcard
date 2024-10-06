from bson import ObjectId
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List


class PyObjectId(ObjectId):
    """
    Custom type to handle MongoDB ObjectId within Pydantic models.
    Inherits from ObjectId and ensures validation within Pydantic models.
    """

    @classmethod
    def __get_validators__(cls):
        """
        Return validators to be used by Pydantic for ObjectId validation.
        """
        yield cls.validate

    @classmethod
    def validate(cls, value, info):
        """
        Validates that the provided value is a valid MongoDB ObjectId.
        Pydantic v2 requires `validate` to accept three arguments: cls, value, and info.

        Parameters:
        - value: The value to validate.
        - info: Additional information about the validation context (unused here).

        Returns:
        - ObjectId: The validated ObjectId.

        Raises:
        - ValueError: If the value is not a valid ObjectId.
        """
        if not ObjectId.is_valid(value):
            raise ValueError(f"Invalid ObjectId: {value}")
        return ObjectId(value)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        """
        Modify the schema to show ObjectId as a string.
        """
        field_schema.update(type="string")


class DeckCreate(BaseModel):
    """
    Pydantic model representing the payload required to create a new deck.
    """
    title: str

    model_config = ConfigDict(
        arbitrary_types_allowed=True
    )


class DeckInDB(BaseModel):
    """
    Pydantic model representing the deck as stored in the database.
    Includes the ObjectId and additional fields.
    """
    id: Optional[PyObjectId] = Field(alias="_id")
    title: str
    number_of_cards: int

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
    )


class Deck(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    title: str

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# Deck Models
class DeckBase(BaseModel):
    title: str = Field(..., example="Basic Vocabulary")
    description: Optional[str] = Field(
        None, example="Basic German words for beginners."
    )


class DeckUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


# Flashcard Models
class FlashcardBase(BaseModel):
    front: str = Field(..., example="Haus")
    back: str = Field(..., example="House")
    decks: List[str] = Field(..., example=["Basic Vocabulary", "Intermediate"])


class FlashcardCreate(FlashcardBase):
    pass


class FlashcardUpdate(BaseModel):
    front: Optional[str] = None
    back: Optional[str] = None
    decks: Optional[List[str]] = None


class FlashcardInDB(FlashcardBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    date_created: str = Field(default_factory=lambda: "")
    date_modified: Optional[str] = None
    guessed_correct: bool = False
    guessed_wrong: bool = False
    notes: Optional[str] = None

    class Config:
        populate_by_name = True
