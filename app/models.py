from mongoengine import (
    Document,
    EmbeddedDocument,
    StringField,
    IntField,
    DateTimeField,
    ListField,
    ReferenceField,
    EnumField,
    FileField,
    EmbeddedDocumentListField,
    EmbeddedDocumentField,
    DictField,
    CASCADE,
)
from datetime import datetime
from .schemas import HardnessLevel, DraftCardStatus
import bcrypt


class ExampleSentence(EmbeddedDocument):
    sentence = StringField(required=True)
    translation = StringField(required=True)


class Chapter(EmbeddedDocument):
    name = StringField(required=True)
    start_page = IntField(required=True)
    end_page = IntField(required=True)


class PageRange(EmbeddedDocument):
    start = IntField(required=True)
    end = IntField(required=True)


class UserStorageConfig(EmbeddedDocument):
    """User's cloud storage configuration for file uploads"""
    storage_type = StringField(choices=['telegram', 'google_drive'], default='telegram')
    # Telegram configuration
    telegram_bot_token = StringField()  # User's personal bot token
    telegram_user_id = StringField()    # User's Telegram ID for Saved Messages
    # Google Drive configuration
    google_credentials = DictField()    # OAuth credentials dict
    google_refresh_token = StringField()  # Refresh token for re-authentication


class User(Document):
    username = StringField(required=True, unique=True)
    email = StringField(required=True, unique=True)
    hashed_password = StringField(required=True)
    date_created = DateTimeField(default=datetime.utcnow)
    
    # Storage configuration and quotas
    storage_config = EmbeddedDocumentField(UserStorageConfig)
    storage_used_bytes = IntField(default=0)
    file_count = IntField(default=0)
    max_files = IntField(default=5)  # Free tier: 5 files
    max_storage_bytes = IntField(default=10*1024*1024)  # Free tier: 10MB
    subscription_tier = StringField(default='free')  # 'free', 'basic', 'premium'

    meta = {"indexes": ["username", "email"]}

    def set_password(self, password: str):
        self.hashed_password = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    def check_password(self, password: str) -> bool:
        return bcrypt.checkpw(
            password.encode("utf-8"), self.hashed_password.encode("utf-8")
        )


class Book(Document):
    title = StringField(required=True)
    filename = StringField(required=True)
    file_size_bytes = IntField(default=0)  # Track file size for quota
    total_pages = IntField(required=True)
    chapters = EmbeddedDocumentListField(Chapter)
    
    # External storage (Telegram or Google Drive)
    storage_file_id = StringField()  # Telegram file_id or Google Drive file_id
    storage_type = StringField(choices=['telegram', 'google_drive', 'gridfs'])  # Keep gridfs for backwards compat
    file = FileField(collection_name="books_fs")  # Legacy GridFS, will be deprecated
    
    target_language = StringField()
    native_language = StringField()
    date_created = DateTimeField(default=datetime.utcnow)
    last_edited = DateTimeField(default=datetime.utcnow)
    owner = ReferenceField(User, required=True, reverse_delete_rule=CASCADE)

    meta = {"indexes": ["owner", "title", "storage_type"]}

    def clean(self):
        self.last_edited = datetime.utcnow()


class Card(Document):
    front = StringField(required=True)
    back = StringField(required=True)
    example_original = StringField()
    example_translation = StringField()
    examples = EmbeddedDocumentListField(ExampleSentence)
    synonyms = ListField(StringField())
    antonyms = ListField(StringField())
    part_of_speech = StringField()
    gender = StringField()
    plural_form = StringField()
    pronunciation = StringField()
    notes = StringField()
    tags = ListField(StringField())
    hardness_level = EnumField(HardnessLevel, default=HardnessLevel.MEDIUM)
    date_created = DateTimeField(default=datetime.utcnow)
    last_edited = DateTimeField(default=datetime.utcnow)
    last_visited = DateTimeField()
    source_book = ReferenceField(Book)
    source_page = IntField()
    owner = ReferenceField(User, required=True, reverse_delete_rule=CASCADE)

    meta = {
        "indexes": [
            {
                "fields": [
                    "$front",
                    "$back",
                    "$example_original",
                    "$example_translation",
                    "$notes",
                ],
                "default_language": "english",
                "weights": {
                    "front": 10,
                    "back": 8,
                    "example_original": 5,
                    "example_translation": 5,
                    "notes": 3,
                },
            },
            "tags",
        ]
    }

    def clean(self):
        self.last_edited = datetime.utcnow()


class Deck(Document):
    name = StringField(required=True)
    description = StringField()
    cards = ListField(ReferenceField(Card, reverse_delete_rule=CASCADE))
    date_created = DateTimeField(default=datetime.utcnow)
    last_edited = DateTimeField(default=datetime.utcnow)
    owner = ReferenceField(User, required=True, reverse_delete_rule=CASCADE)

    meta = {"indexes": ["name"]}

    def clean(self):
        self.last_edited = datetime.utcnow()


class BookProgress(Document):
    book = ReferenceField(Book, required=True, reverse_delete_rule=CASCADE)
    owner = ReferenceField(User, required=True, reverse_delete_rule=CASCADE)
    current_page = IntField(default=1)
    current_chapter = StringField()
    pages_processed = EmbeddedDocumentListField(PageRange)
    chapters_completed = ListField(StringField())
    date_created = DateTimeField(default=datetime.utcnow)
    last_edited = DateTimeField(default=datetime.utcnow)

    meta = {
        "indexes": [
            {"fields": ["book", "owner"], "unique": True}
        ]
    }

    def clean(self):
        self.last_edited = datetime.utcnow()

    def get_next_unprocessed_page(self) -> int:
        if not self.pages_processed:
            return self.current_page
        last_range = max(self.pages_processed, key=lambda r: r.end)
        return last_range.end + 1


class DraftCard(Document):
    front = StringField(required=True)
    back = StringField(required=True)
    examples = EmbeddedDocumentListField(ExampleSentence)
    synonyms = ListField(StringField())
    antonyms = ListField(StringField())
    part_of_speech = StringField()
    gender = StringField()
    plural_form = StringField()
    pronunciation = StringField()
    notes = StringField()
    tags = ListField(StringField())
    status = EnumField(DraftCardStatus, default=DraftCardStatus.PENDING)
    book = ReferenceField(Book, required=True, reverse_delete_rule=CASCADE)
    source_page_start = IntField()
    source_page_end = IntField()
    generation_batch_id = StringField()
    date_created = DateTimeField(default=datetime.utcnow)
    owner = ReferenceField(User, required=True, reverse_delete_rule=CASCADE)

    meta = {
        "indexes": ["owner", "book", "status", "generation_batch_id"]
    }
