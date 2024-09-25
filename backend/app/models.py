from mongoengine import Document, StringField, DateTimeField, BooleanField
from datetime import datetime


class Flashcard(Document):
    german = StringField(required=True)
    english = StringField(required=True)
    notes = StringField(default="")
    date_created = DateTimeField(default=datetime.utcnow)
    date_modified = DateTimeField(default=datetime.utcnow)
    guessed_correct = BooleanField(default=False)
    guessed_wrong = BooleanField(default=False)

    meta = {"collection": "flashcards", "indexes": ["german", "english"]}
