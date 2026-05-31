"""Test configuration.

Connects MongoEngine to an in-memory mongomock backend under the same
"default" alias the app uses, so crud functions that call
``.using("default")`` work unchanged without a real MongoDB.
"""

import mongoengine
import mongomock
import pytest

from app.models import Book, DraftCard, Template, User


@pytest.fixture(autouse=True)
def mongo_db():
    mongoengine.connect(
        "flashcard_test",
        mongo_client_class=mongomock.MongoClient,
        alias="default",
    )
    yield
    for doc in (DraftCard, Book, Template, User):
        doc.objects.delete()
    mongoengine.disconnect(alias="default")
