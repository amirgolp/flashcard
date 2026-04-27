from datetime import datetime
from enum import Enum
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
    username: str | None = None


# Template Schemas
class TemplateFieldSchema(BaseModel):
    name: str
    label: str
    type: str = "text"
    description: str
    show_on_front: bool = False
    required: bool = True

class TemplateBase(BaseModel):
    name: str
    description: str | None = None
    fields: list[TemplateFieldSchema]
    system_prompt: str | None = None
    is_default: bool = False

class TemplateCreate(TemplateBase):
    pass

class TemplateUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    fields: list[TemplateFieldSchema] | None = None
    system_prompt: str | None = None
    is_default: bool | None = None

class TemplateResponse(TemplateBase):
    id: str
    date_created: datetime
    last_edited: datetime
    owner_id: str | None = Field(None, alias="owner") # Use alias for reference field

    class Config:
        from_attributes = True
        populate_by_name = True


# Card Schemas
class CardBase(BaseModel):
    front: str
    back: str
    example_original: str | None = None
    example_translation: str | None = None
    examples: list[ExampleSentenceSchema] | None = None
    synonyms: list[str] | None = None
    antonyms: list[str] | None = None
    part_of_speech: str | None = None
    gender: str | None = None
    plural_form: str | None = None
    pronunciation: str | None = None
    notes: str | None = None
    tags: list[str] | None = None
    hardness_level: HardnessLevel = HardnessLevel.MEDIUM
    template_id: str | None = None
    custom_fields: dict | None = None


class CardCreate(CardBase):
    pass


class CardUpdate(BaseModel):
    front: str | None = None
    back: str | None = None
    example_original: str | None = None
    example_translation: str | None = None
    examples: list[ExampleSentenceSchema] | None = None
    synonyms: list[str] | None = None
    antonyms: list[str] | None = None
    part_of_speech: str | None = None
    gender: str | None = None
    plural_form: str | None = None
    pronunciation: str | None = None
    notes: str | None = None
    tags: list[str] | None = None
    hardness_level: HardnessLevel | None = None
    template_id: str | None = None
    custom_fields: dict | None = None


class Card(CardBase):
    id: str
    date_created: datetime
    last_edited: datetime
    last_visited: datetime | None = None
    source_book_id: str | None = None
    source_page: int | None = None

    class Config:
        from_attributes = True


# Deck Schemas
class DeckBase(BaseModel):
    name: str
    description: str | None = None


class DeckCreate(DeckBase):
    card_ids: list[str] = Field(
        default_factory=lambda: list, description="List of card ids"
    )


class DeckUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    card_ids: list[str] | None = None


class Deck(DeckBase):
    id: str
    cards: list[Card] = Field(default_factory=lambda: list, description="List of cards")

    class Config:
        from_attributes = True


class SearchResponse(BaseModel):
    results: list[Card]
    next_cursor: str | None = None


# Book Schemas
class BookBase(BaseModel):
    title: str
    target_language: str | None = None
    native_language: str | None = None


class BookCreate(BookBase):
    chapters: list[ChapterSchema] | None = None


class BookUpdate(BaseModel):
    title: str | None = None
    target_language: str | None = None
    native_language: str | None = None
    chapters: list[ChapterSchema] | None = None


class BookResponse(BookBase):
    id: str
    filename: str
    total_pages: int
    chapters: list[ChapterSchema] = []
    date_created: datetime
    last_edited: datetime

    class Config:
        from_attributes = True


# BookProgress Schemas
class BookProgressBase(BaseModel):
    current_page: int = 1
    current_chapter: str | None = None


class BookProgressUpdate(BaseModel):
    current_page: int | None = None
    current_chapter: str | None = None


class BookProgressResponse(BookProgressBase):
    id: str
    book_id: str
    pages_processed: list[PageRangeSchema] = []
    chapters_completed: list[str] = []
    date_created: datetime
    last_edited: datetime

    class Config:
        from_attributes = True


# DraftCard Schemas
class DraftCardBase(BaseModel):
    front: str
    back: str
    examples: list[ExampleSentenceSchema] | None = None
    synonyms: list[str] | None = None
    antonyms: list[str] | None = None
    part_of_speech: str | None = None
    gender: str | None = None
    plural_form: str | None = None
    pronunciation: str | None = None
    notes: str | None = None
    tags: list[str] | None = None
    template_id: str | None = None
    custom_fields: dict | None = None


class DraftCardUpdate(BaseModel):
    front: str | None = None
    back: str | None = None
    examples: list[ExampleSentenceSchema] | None = None
    synonyms: list[str] | None = None
    antonyms: list[str] | None = None
    part_of_speech: str | None = None
    gender: str | None = None
    plural_form: str | None = None
    pronunciation: str | None = None
    notes: str | None = None
    tags: list[str] | None = None
    template_id: str | None = None
    custom_fields: dict | None = None


class DraftCardResponse(DraftCardBase):
    id: str
    status: DraftCardStatus
    book_id: str
    source_page_start: int | None = None
    source_page_end: int | None = None
    generation_batch_id: str | None = None
    date_created: datetime

    class Config:
        from_attributes = True


# Generation Request/Response Schemas
class GenerateNextBatchRequest(BaseModel):
    book_id: str
    num_pages: int = Field(default=5, le=20)
    num_cards: int = 10
    template_id: str | None = None


class GenerateFromRangeRequest(BaseModel):
    book_id: str
    start_page: int
    end_page: int
    num_cards: int = 10
    template_id: str | None = None


class GenerateFromImageRequest(BaseModel):
    """Single-image generation. Used by the mobile camera flow to send
    a photo of a page (typed or handwritten) to Gemini for card
    extraction. The image is sent base64-encoded so the request stays
    JSON.
    """

    image_base64: str
    mime_type: str = "image/jpeg"
    book_id: str
    num_cards: int = Field(default=10, ge=1, le=30)
    template_id: str | None = None
    source_page: int | None = None


class GenerationResponse(BaseModel):
    batch_id: str
    drafts: list[DraftCardResponse]
    pages_processed: PageRangeSchema
    message: str


class BulkApproveRequest(BaseModel):
    draft_ids: list[str]
    deck_id: str | None = None


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
    storage_type: str | None = None
    is_configured: bool
    quota: StorageQuota

