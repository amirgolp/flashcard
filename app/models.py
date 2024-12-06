from mongoengine import (
    Document,
    StringField,
    DateTimeField,
    ListField,
    ReferenceField,
    EnumField,
    CASCADE,
    signals,
)
from datetime import datetime
from .schemas import HardnessLevel


class Card(Document):
    front = StringField(required=True)
    back = StringField(required=True)
    example_original = StringField()
    example_translation = StringField()
    hardness_level = EnumField(HardnessLevel, default=HardnessLevel.MEDIUM)
    date_created = DateTimeField(default=datetime.now())
    last_edited = DateTimeField(default=datetime.now())
    last_visited = DateTimeField()

    meta = {
        'indexes': [
            {
                'fields': ['$front', '$back', '$example_original', '$example_translation'],
                'default_language': 'english',
                'weights': {
                    'front': 10,
                    'back': 8,
                    'example_original': 5,
                    'example_translation': 5
                }
            }
        ]
    }

    def clean(self):
        self.last_edited = datetime.now()


class Deck(Document):
    name = StringField(required=True)
    description = StringField()
    cards = ListField(ReferenceField(Card, reverse_delete_rule=CASCADE))
    date_created = DateTimeField(default=datetime.now())
    last_edited = DateTimeField(default=datetime.now())

    meta = {
        'indexes': ['name']
    }

    def clean(self):
        self.last_edited = datetime.now()

# Signal to update 'last_edited' before saving
signals.pre_save.connect(Deck.clean, sender=Deck)
signals.pre_save.connect(Card.clean, sender=Card)
