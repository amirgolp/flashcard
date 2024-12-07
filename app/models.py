from mongoengine import (
    Document,
    StringField,
    DateTimeField,
    ListField,
    ReferenceField,
    EnumField,
    CASCADE,
)
from datetime import datetime
from .schemas import HardnessLevel
import bcrypt


class User(Document):
    username = StringField(required=True, unique=True)
    email = StringField(required=True, unique=True)
    hashed_password = StringField(required=True)
    date_created = DateTimeField(default=datetime.utcnow)

    meta = {"indexes": ["username", "email"]}

    def set_password(self, password: str):
        self.hashed_password = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    def check_password(self, password: str) -> bool:
        return bcrypt.checkpw(
            password.encode("utf-8"), self.hashed_password.encode("utf-8")
        )


class Card(Document):
    front = StringField(required=True)
    back = StringField(required=True)
    example_original = StringField()
    example_translation = StringField()
    hardness_level = EnumField(HardnessLevel, default=HardnessLevel.MEDIUM)
    date_created = DateTimeField(default=datetime.utcnow)
    last_edited = DateTimeField(default=datetime.utcnow)
    last_visited = DateTimeField()
    owner = ReferenceField(User, required=True, reverse_delete_rule=CASCADE)

    meta = {
        "indexes": [
            {
                "fields": [
                    "$front",
                    "$back",
                    "$example_original",
                    "$example_translation",
                ],
                "default_language": "english",
                "weights": {
                    "front": 10,
                    "back": 8,
                    "example_original": 5,
                    "example_translation": 5,
                },
            }
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
