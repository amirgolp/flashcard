"""Tests for the unified /generate/from-content flow (crud.generate_from_content).

The Gemini call is the only external dependency; it is monkeypatched so
the tests are hermetic and exercise the validation, template-ownership,
and draft-persistence logic.
"""

import base64

import pytest
from fastapi import HTTPException

from app import crud, schemas
from app.models import Book, DraftCard, Template, TemplateField, User


# ---- Fakes & fixtures ----

class _FakeFlashcard:
    def __init__(self, front: str):
        self.front = front
        self.back = f"{front}-back"
        self.examples = [{"sentence": "s", "translation": "t"}]
        self.synonyms = []
        self.antonyms = []
        self.part_of_speech = "noun"
        self.gender = None
        self.plural_form = None
        self.pronunciation = None
        self.notes = None

    def model_dump(self):
        return {"front": self.front, "back": self.back}


class _FakeResult:
    def __init__(self, n: int = 2):
        self.flashcards = [_FakeFlashcard(f"word{i}") for i in range(n)]


@pytest.fixture
def user():
    return User(username="u1", email="u1@example.com", hashed_password="x").save()


@pytest.fixture
def other_user():
    return User(username="u2", email="u2@example.com", hashed_password="x").save()


@pytest.fixture
def book(user):
    return Book(
        title="Book", filename="book.pdf", total_pages=10, owner=user
    ).save()


@pytest.fixture
def patched_gemini(monkeypatch):
    """Replace both generator helpers with a canned 2-card result and
    record which one was called."""
    calls = {}

    def fake_text(**kwargs):
        calls["text"] = kwargs
        return _FakeResult(2)

    def fake_image(**kwargs):
        calls["image"] = kwargs
        return _FakeResult(2)

    monkeypatch.setattr(crud, "generate_flashcards_from_text", fake_text)
    monkeypatch.setattr(crud, "generate_flashcards_from_image", fake_image)
    return calls


def _b64_image(size: int = 64) -> str:
    return base64.b64encode(b"\x00" * size).decode()


# ---- Happy paths ----

def test_text_input_creates_drafts(patched_gemini, user, book):
    req = schemas.GenerateFromContentRequest(
        book_id=str(book.id), text="some study notes"
    )
    resp = crud.generate_from_content(req, db="default", owner=user)

    assert len(resp.drafts) == 2
    assert "from text" in resp.message
    assert DraftCard.objects.count() == 2
    assert "text" in patched_gemini and "image" not in patched_gemini


def test_image_input_creates_drafts(patched_gemini, user, book):
    req = schemas.GenerateFromContentRequest(
        book_id=str(book.id), image_base64=_b64_image(), source_page=3
    )
    resp = crud.generate_from_content(req, db="default", owner=user)

    assert len(resp.drafts) == 2
    assert "from image" in resp.message
    assert "image" in patched_gemini and "text" not in patched_gemini
    # source_page is recorded on the drafts
    assert all(d.source_page_start == 3 for d in DraftCard.objects)


# ---- Input validation ----

def test_both_inputs_rejected(patched_gemini, user, book):
    req = schemas.GenerateFromContentRequest(
        book_id=str(book.id), text="hi", image_base64=_b64_image()
    )
    with pytest.raises(HTTPException) as exc:
        crud.generate_from_content(req, db="default", owner=user)
    assert exc.value.status_code == 400


def test_no_input_rejected(patched_gemini, user, book):
    req = schemas.GenerateFromContentRequest(book_id=str(book.id))
    with pytest.raises(HTTPException) as exc:
        crud.generate_from_content(req, db="default", owner=user)
    assert exc.value.status_code == 400


def test_blank_text_rejected(patched_gemini, user, book):
    req = schemas.GenerateFromContentRequest(book_id=str(book.id), text="   ")
    with pytest.raises(HTTPException) as exc:
        crud.generate_from_content(req, db="default", owner=user)
    assert exc.value.status_code == 400


def test_invalid_base64_rejected(patched_gemini, user, book):
    req = schemas.GenerateFromContentRequest(
        book_id=str(book.id), image_base64="not!valid!base64!"
    )
    with pytest.raises(HTTPException) as exc:
        crud.generate_from_content(req, db="default", owner=user)
    assert exc.value.status_code == 400


def test_oversized_image_rejected(patched_gemini, user, book):
    req = schemas.GenerateFromContentRequest(
        book_id=str(book.id), image_base64=_b64_image(10 * 1024 * 1024 + 1)
    )
    with pytest.raises(HTTPException) as exc:
        crud.generate_from_content(req, db="default", owner=user)
    assert exc.value.status_code == 413


def test_unknown_book_rejected(patched_gemini, user):
    from bson import ObjectId

    req = schemas.GenerateFromContentRequest(
        book_id=str(ObjectId()), text="hi"
    )
    with pytest.raises(HTTPException) as exc:
        crud.generate_from_content(req, db="default", owner=user)
    assert exc.value.status_code == 404


# ---- Template ownership ----

def test_foreign_private_template_rejected(patched_gemini, user, other_user, book):
    """A user must not be able to reference another user's private template."""
    foreign = Template(
        name="Foreign",
        fields=[TemplateField(name="front", label="Front", description="d")],
        owner=other_user,
        is_default=False,
    ).save()

    req = schemas.GenerateFromContentRequest(
        book_id=str(book.id), text="hi", template_id=str(foreign.id)
    )
    with pytest.raises(HTTPException) as exc:
        crud.generate_from_content(req, db="default", owner=user)
    assert exc.value.status_code == 400
    assert DraftCard.objects.count() == 0


def test_default_template_allowed(patched_gemini, user, book):
    """A default (shared) template is usable by any user."""
    default_tpl = Template(
        name="Default",
        fields=[
            TemplateField(
                name="front", label="Front", description="d", show_on_front=True
            ),
            TemplateField(name="back", label="Back", description="d"),
        ],
        owner=None,
        is_default=True,
    ).save()

    req = schemas.GenerateFromContentRequest(
        book_id=str(book.id), text="hi", template_id=str(default_tpl.id)
    )
    resp = crud.generate_from_content(req, db="default", owner=user)
    assert len(resp.drafts) == 2
    assert all(d.template_id == default_tpl for d in DraftCard.objects)


def test_own_template_allowed(patched_gemini, user, book):
    own = Template(
        name="Mine",
        fields=[
            TemplateField(
                name="front", label="Front", description="d", show_on_front=True
            ),
            TemplateField(name="back", label="Back", description="d"),
        ],
        owner=user,
        is_default=False,
    ).save()

    req = schemas.GenerateFromContentRequest(
        book_id=str(book.id), text="hi", template_id=str(own.id)
    )
    resp = crud.generate_from_content(req, db="default", owner=user)
    assert len(resp.drafts) == 2
