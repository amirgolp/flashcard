from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr, constr


class HardnessLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class DraftCardStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


# Shared sub-schemas
class ExampleSentenceSchema(BaseModel):
    sentence: str
    translation: str


class ChapterSchema(BaseModel):
    name: str
    start_page: int
    end_page: int


class PageRangeSchema(BaseModel):
    start: int
    end: int


# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: constr(min_length=8)


class UserOut(UserBase):
    id: str
    date_created: datetime

    class Config:
        from_attributes = True


# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# Card Schemas
class CardBase(BaseModel):
    front: str
    back: str
    example_original: Optional[str] = None
    example_translation: Optional[str] = None
    examples: Optional[List[ExampleSentenceSchema]] = None
    synonyms: Optional[List[str]] = None
    antonyms: Optional[List[str]] = None
    part_of_speech: Optional[str] = None
    gender: Optional[str] = None
    plural_form: Optional[str] = None
    pronunciation: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    hardness_level: HardnessLevel = HardnessLevel.MEDIUM


class CardCreate(CardBase):
    pass


class CardUpdate(BaseModel):
    front: Optional[str] = None
    back: Optional[str] = None
    example_original: Optional[str] = None
    example_translation: Optional[str] = None
    examples: Optional[List[ExampleSentenceSchema]] = None
    synonyms: Optional[List[str]] = None
    antonyms: Optional[List[str]] = None
    part_of_speech: Optional[str] = None
    gender: Optional[str] = None
    plural_form: Optional[str] = None
    pronunciation: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    hardness_level: Optional[HardnessLevel] = None


class Card(CardBase):
    id: str
    date_created: datetime
    last_edited: datetime
    last_visited: Optional[datetime] = None
    source_book_id: Optional[str] = None
    source_page: Optional[int] = None

    class Config:
        from_attributes = True


# Deck Schemas
class DeckBase(BaseModel):
    name: str
    description: Optional[str] = None


class DeckCreate(DeckBase):
    card_ids: list[str] = Field(
        default_factory=lambda: list, description="List of card ids"
    )


class DeckUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    card_ids: Optional[List[str]] = None


class Deck(DeckBase):
    id: str
    cards: List[Card] = Field(default_factory=lambda: list, description="List of cards")

    class Config:
        from_attributes = True


class SearchResponse(BaseModel):
    results: List[Card]
    next_cursor: Optional[str] = None


# Book Schemas
class BookBase(BaseModel):
    title: str
    target_language: Optional[str] = None
    native_language: Optional[str] = None


class BookCreate(BookBase):
    chapters: Optional[List[ChapterSchema]] = None


class BookUpdate(BaseModel):
    title: Optional[str] = None
    target_language: Optional[str] = None
    native_language: Optional[str] = None
    chapters: Optional[List[ChapterSchema]] = None


class BookResponse(BookBase):
    id: str
    filename: str
    total_pages: int
    chapters: List[ChapterSchema] = []
    date_created: datetime
    last_edited: datetime

    class Config:
        from_attributes = True


# BookProgress Schemas
class BookProgressBase(BaseModel):
    current_page: int = 1
    current_chapter: Optional[str] = None


class BookProgressUpdate(BaseModel):
    current_page: Optional[int] = None
    current_chapter: Optional[str] = None


class BookProgressResponse(BookProgressBase):
    id: str
    book_id: str
    pages_processed: List[PageRangeSchema] = []
    chapters_completed: List[str] = []
    date_created: datetime
    last_edited: datetime

    class Config:
        from_attributes = True


# DraftCard Schemas
class DraftCardBase(BaseModel):
    front: str
    back: str
    examples: Optional[List[ExampleSentenceSchema]] = None
    synonyms: Optional[List[str]] = None
    antonyms: Optional[List[str]] = None
    part_of_speech: Optional[str] = None
    gender: Optional[str] = None
    plural_form: Optional[str] = None
    pronunciation: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class DraftCardUpdate(BaseModel):
    front: Optional[str] = None
    back: Optional[str] = None
    examples: Optional[List[ExampleSentenceSchema]] = None
    synonyms: Optional[List[str]] = None
    antonyms: Optional[List[str]] = None
    part_of_speech: Optional[str] = None
    gender: Optional[str] = None
    plural_form: Optional[str] = None
    pronunciation: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class DraftCardResponse(DraftCardBase):
    id: str
    status: DraftCardStatus
    book_id: str
    source_page_start: Optional[int] = None
    source_page_end: Optional[int] = None
    generation_batch_id: Optional[str] = None
    date_created: datetime

    class Config:
        from_attributes = True


# Generation Request/Response Schemas
class GenerateNextBatchRequest(BaseModel):
    book_id: str
    num_pages: int = Field(default=5, le=20)
    num_cards: int = 10


class GenerateFromRangeRequest(BaseModel):
    book_id: str
    start_page: int
    end_page: int
    num_cards: int = 10


class GenerationResponse(BaseModel):
    batch_id: str
    drafts: List[DraftCardResponse]
    pages_processed: PageRangeSchema
    message: str


class BulkApproveRequest(BaseModel):
    draft_ids: List[str]
    deck_id: Optional[str] = None


# Storage Configuration Schemas
class TelegramStorageConfig(BaseModel):
    bot_token: str
    user_id: str


class StorageQuota(BaseModel):
    used_bytes: int
    max_bytes: int
    file_count: int
    max_files: int
    subscription_tier: str


class StorageConfigResponse(BaseModel):
    storage_type: Optional[str] = None
    is_configured: bool
    quota: StorageQuota

