from mongoengine import Document, StringField, DateTimeField, BooleanField, IntField
from datetime import datetime


class Flashcard(Document):
    german = StringField(required=True)
    english = StringField(required=True)
    notes = StringField(default="")
    date_created = DateTimeField(default=datetime.utcnow)
    date_modified = DateTimeFielBooleanFieldd(default=datetime.utcnow)
    guessed_correct = BooleanField(default=False)
    guessed_wrong = BooleanField(default=False)
    loose_streak = IntField(default=0)
    Favorite = BooleanField(default = False)

    meta = {"collection": "flashcards", "indexes": ["german", "english"]}
