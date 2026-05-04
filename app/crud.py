import io
import uuid
import base64
from typing import List, Tuple, Optional
from . import schemas
from .models import (
    Deck, Card, User, Book, BookProgress, DraftCard,
    Chapter, PageRange, ExampleSentence, Template, TemplateField
)
from .utils.gemini import (
    extract_page_range_as_pdf,
    get_pdf_page_count,
    generate_flashcards_from_text, 
    generate_flashcards_from_image,
    generate_flashcards_from_pdf
)
from mongoengine import Q
from bson import ObjectId
from fastapi import HTTPException


# ---- Serialization Helpers ----

def _example_to_schema(ex: ExampleSentence) -> schemas.ExampleSentenceSchema:
    return schemas.ExampleSentenceSchema(sentence=ex.sentence, translation=ex.translation)


def _card_to_response(card_doc) -> schemas.Card:
    return schemas.Card(
        id=str(card_doc.id),
        front=card_doc.front,
        back=card_doc.back,
        example_original=card_doc.example_original,
        example_translation=card_doc.example_translation,
        examples=[_example_to_schema(ex) for ex in (card_doc.examples or [])],
        synonyms=card_doc.synonyms or [],
        antonyms=card_doc.antonyms or [],
        part_of_speech=card_doc.part_of_speech,
        gender=card_doc.gender,
        plural_form=card_doc.plural_form,
        pronunciation=card_doc.pronunciation,
        notes=card_doc.notes,
        tags=card_doc.tags or [],
        hardness_level=card_doc.hardness_level,
        template_id=str(card_doc.template_id.id) if card_doc.template_id else None,
        custom_fields=card_doc.custom_fields or {},
        date_created=card_doc.date_created,
        last_edited=card_doc.last_edited,
        last_visited=card_doc.last_visited,
        source_book_id=str(card_doc.source_book.id) if card_doc.source_book else None,
        source_page=card_doc.source_page,
    )


def _deck_to_response(deck_doc) -> schemas.Deck:
    return schemas.Deck(
        id=str(deck_doc.id),
        name=deck_doc.name,
        description=deck_doc.description,
        cards=[_card_to_response(card) for card in deck_doc.cards],
    )


def _book_to_response(book_doc) -> schemas.BookResponse:
    return schemas.BookResponse(
        id=str(book_doc.id),
        title=book_doc.title,
        filename=book_doc.filename,
        total_pages=book_doc.total_pages,
        chapters=[
            schemas.ChapterSchema(name=ch.name, start_page=ch.start_page, end_page=ch.end_page)
            for ch in (book_doc.chapters or [])
        ],
        target_language=book_doc.target_language,
        native_language=book_doc.native_language,
        date_created=book_doc.date_created,
        last_edited=book_doc.last_edited,
    )


def _progress_to_response(progress_doc) -> schemas.BookProgressResponse:
    return schemas.BookProgressResponse(
        id=str(progress_doc.id),
        book_id=str(progress_doc.book.id),
        current_page=progress_doc.current_page,
        current_chapter=progress_doc.current_chapter,
        pages_processed=[
            schemas.PageRangeSchema(start=pr.start, end=pr.end)
            for pr in (progress_doc.pages_processed or [])
        ],
        chapters_completed=progress_doc.chapters_completed or [],
        date_created=progress_doc.date_created,
        last_edited=progress_doc.last_edited,
    )


def _draft_to_response(draft_doc) -> schemas.DraftCardResponse:
    return schemas.DraftCardResponse(
        id=str(draft_doc.id),
        front=draft_doc.front,
        back=draft_doc.back,
        examples=[_example_to_schema(ex) for ex in (draft_doc.examples or [])],
        synonyms=draft_doc.synonyms or [],
        antonyms=draft_doc.antonyms or [],
        part_of_speech=draft_doc.part_of_speech,
        gender=draft_doc.gender,
        plural_form=draft_doc.plural_form,
        pronunciation=draft_doc.pronunciation,
        notes=draft_doc.notes,
        tags=draft_doc.tags or [],
        template_id=str(draft_doc.template_id.id) if draft_doc.template_id else None,
        custom_fields=draft_doc.custom_fields or {},
        status=draft_doc.status,
        book_id=str(draft_doc.book.id),
        source_page_start=draft_doc.source_page_start,
        source_page_end=draft_doc.source_page_end,
        generation_batch_id=draft_doc.generation_batch_id,
        date_created=draft_doc.date_created,
    )


def _examples_to_embedded(examples_data):
    """Convert a list of ExampleSentenceSchema to ExampleSentence embedded docs."""
    if not examples_data:
        return []
    return [
        ExampleSentence(sentence=ex.sentence, translation=ex.translation)
        for ex in examples_data
    ]


# ---- User CRUD ----

def get_user_by_username(username: str, db: str = "default") -> User | None:
    try:
        return User.objects(username=username).using(db).first()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_user_by_email(email: str, db: str = "default") -> User | None:
    try:
        return User.objects(email=email).using(db).first()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def create_user(
    user_create: schemas.UserCreate, db: str = "default"
) -> schemas.UserOut:
    try:
        user = User(username=user_create.username, email=user_create.email)
        user.set_password(user_create.password)
        user.save(using=db)
        return schemas.UserOut(
            id=str(user.id),
            username=user.username,
            email=user.email,
            date_created=user.date_created,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def authenticate_user(
    username: str, password: str, db: str = "default"
) -> User | None:
    user = get_user_by_username(username, db)
    if not user:
        return None
    if not user.check_password(password):
        return None
    return user


# ---- Template CRUD ----

def _template_to_response(template_doc: Template) -> schemas.TemplateResponse:
    return schemas.TemplateResponse(
        id=str(template_doc.id),
        name=template_doc.name,
        description=template_doc.description,
        fields=[
            schemas.TemplateFieldSchema(
                name=f.name,
                label=f.label,
                type=f.type,
                description=f.description,
                show_on_front=f.show_on_front,
                required=f.required
            ) for f in template_doc.fields
        ],
        system_prompt=template_doc.system_prompt,
        is_default=template_doc.is_default,
        date_created=template_doc.date_created,
        last_edited=template_doc.last_edited,
        owner=str(template_doc.owner.id) if template_doc.owner else None
    )

def create_template(template: schemas.TemplateCreate, db: str = "default", owner: User = None) -> schemas.TemplateResponse:
    fields = [
        TemplateField(
            name=f.name,
            label=f.label,
            type=f.type,
            description=f.description,
            show_on_front=f.show_on_front,
            required=f.required
        ) for f in template.fields
    ]
    template_doc = Template(
        name=template.name,
        description=template.description,
        fields=fields,
        system_prompt=template.system_prompt,
        is_default=template.is_default,
        owner=owner if not template.is_default else None
    )
    template_doc.save()
    return _template_to_response(template_doc)

def get_template(template_id: str, db: str = "default", owner: User = None) -> schemas.TemplateResponse | None:
    try:
        query = Q(id=ObjectId(template_id)) & (Q(owner=owner) | Q(is_default=True))
        template_doc = Template.objects.get(query)
        return _template_to_response(template_doc)
    except Template.DoesNotExist:
        return None
    except Exception:
        return None

def update_template(template_id: str, template_update: schemas.TemplateUpdate, db: str = "default", owner: User = None) -> schemas.TemplateResponse | None:
    try:
        template_doc = Template.objects.get(id=ObjectId(template_id), owner=owner, is_default=False)
        update_data = template_update.model_dump(exclude_unset=True)
        if "fields" in update_data:
            template_doc.fields = [
                TemplateField(**f) for f in update_data["fields"]
            ]
            del update_data["fields"]
        
        for key, value in update_data.items():
            setattr(template_doc, key, value)
            
        template_doc.clean()
        template_doc.save()
        return _template_to_response(template_doc)
    except Exception:
        return None

def delete_template(template_id: str, db: str = "default", owner: User = None) -> bool:
    try:
        template_doc = Template.objects.get(id=ObjectId(template_id), owner=owner, is_default=False)
        template_doc.delete()
        return True
    except Exception:
        return False

def list_templates(skip: int = 0, limit: int = 50, include_defaults: bool = True, db: str = "default", owner: User = None) -> list[schemas.TemplateResponse]:
    if include_defaults:
        query = Q(owner=owner) | Q(is_default=True)
    else:
        query = Q(owner=owner)
    templates = Template.objects.filter(query).skip(skip).limit(limit)
    return [_template_to_response(t) for t in templates]


def seed_default_templates():
    default_templates = [
        {
            "name": "Standard Flashcard",
            "description": "A basic two-sided flashcard for general learning.",
            "is_default": True,
            "fields": [
                {"name": "front", "label": "Front", "type": "text", "description": "The main question, concept, or word", "show_on_front": True, "required": True},
                {"name": "back", "label": "Back", "type": "textarea", "description": "The detailed answer, translation, or definition", "show_on_front": False, "required": True},
            ],
            "system_prompt": "Focus on extracting the most important concepts and presenting them as clear, concise question-and-answer pairs."
        },
        {
            "name": "Language Learning (Detailed)",
            "description": "Comprehensive template for learning vocabulary with examples and grammar.",
            "is_default": True,
            "fields": [
                {"name": "word", "label": "Word", "type": "text", "description": "The vocabulary word in the target language", "show_on_front": True, "required": True},
                {"name": "translation", "label": "Translation", "type": "text", "description": "The translation in the native language", "show_on_front": False, "required": True},
                {"name": "pronunciation", "label": "Pronunciation", "type": "text", "description": "IPA pronunciation guide or phonetic spelling", "show_on_front": True, "required": False},
                {"name": "part_of_speech", "label": "Part of Speech", "type": "text", "description": "The grammatical category (e.g., noun, verb, adjective)", "show_on_front": False, "required": False},
                {"name": "examples", "label": "Examples", "type": "list", "description": "A list of 2-3 example sentences demonstrating usage in the target language, each followed by its translation.", "show_on_front": False, "required": False},
                {"name": "notes", "label": "Notes", "type": "textarea", "description": "Cultural context, irregular grammar rules, or usage notes.", "show_on_front": False, "required": False},
            ],
            "system_prompt": "Extract vocabulary words specifically tailored for language learners. Provide accurate pronunciation guides, parts of speech, and highly illustrative, natural-sounding example sentences."
        }
    ]

    for template_data in default_templates:
        if not Template.objects(name=template_data["name"]).first():
            fields = [TemplateField(**f) for f in template_data["fields"]]
            Template(
                name=template_data["name"],
                description=template_data["description"],
                fields=fields,
                system_prompt=template_data["system_prompt"],
                is_default=True
            ).save()


# ---- Deck CRUD ----

def create_deck(
    deck: schemas.DeckCreate, db: str = "default", owner: User = None
) -> schemas.Deck:
    try:
        card_objects = Card.objects(id__in=deck.card_ids, owner=owner).using(db)
        deck_doc = Deck(
            name=deck.name,
            description=deck.description,
            cards=card_objects,
            owner=owner,
        )
        deck_doc.save(using=db)
        return _deck_to_response(deck_doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_deck(
    deck_id: str, db: str = "default", owner: User = None
) -> schemas.Deck | None:
    try:
        deck_doc = Deck.objects.using(db).get(id=ObjectId(deck_id), owner=owner)
        return _deck_to_response(deck_doc)
    except Deck.DoesNotExist:
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def update_deck(
    deck_id: str,
    deck_update: schemas.DeckUpdate,
    db: str = "default",
    owner: User = None,
) -> schemas.Deck | None:
    try:
        deck_doc = Deck.objects.using(db).get(id=ObjectId(deck_id), owner=owner)
        if deck_update.name is not None:
            deck_doc.name = deck_update.name
        if deck_update.description is not None:
            deck_doc.description = deck_update.description
        if deck_update.card_ids is not None:
            deck_doc.cards = Card.objects(
                id__in=deck_update.card_ids, owner=owner
            ).using(db)
        deck_doc.save(using=db)
        return get_deck(deck_id, db, owner)
    except Deck.DoesNotExist:
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def delete_deck(deck_id: str, db: str = "default", owner: User = None) -> bool:
    try:
        deck_doc = Deck.objects.using(db).get(id=ObjectId(deck_id), owner=owner)
        deck_doc.delete(using=db)
        return True
    except Deck.DoesNotExist:
        return False
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def list_decks(
    skip: int, limit: int, db: str = "default", owner: User = None
) -> list[schemas.Deck]:
    try:
        deck_docs = Deck.objects(owner=owner).using(db).skip(skip).limit(limit)
        return [_deck_to_response(deck) for deck in deck_docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---- Card CRUD ----

def create_card(
    card: schemas.CardCreate, db: str = "default", owner: User = None
) -> schemas.Card:
    try:
        card_doc = Card(
            front=card.front,
            back=card.back,
            example_original=card.example_original,
            example_translation=card.example_translation,
            examples=_examples_to_embedded(card.examples),
            synonyms=card.synonyms or [],
            antonyms=card.antonyms or [],
            part_of_speech=card.part_of_speech,
            gender=card.gender,
            plural_form=card.plural_form,
            pronunciation=card.pronunciation,
            notes=card.notes,
            tags=card.tags or [],
            hardness_level=card.hardness_level,
            owner=owner,
        )
        card_doc.save(using=db)
        return _card_to_response(card_doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_card(
    card_id: str, db: str = "default", owner: User = None
) -> schemas.Card | None:
    try:
        card_doc = Card.objects.using(db).get(id=ObjectId(card_id), owner=owner)
        return _card_to_response(card_doc)
    except Card.DoesNotExist:
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def update_card(
    card_id: str,
    card_update: schemas.CardUpdate,
    db: str = "default",
    owner: User = None,
) -> schemas.Card | None:
    try:
        card_doc = Card.objects.using(db).get(id=ObjectId(card_id), owner=owner)
        for field in [
            "front", "back", "example_original", "example_translation",
            "part_of_speech", "gender", "plural_form", "pronunciation",
            "notes", "hardness_level",
        ]:
            value = getattr(card_update, field, None)
            if value is not None:
                setattr(card_doc, field, value)
        if card_update.examples is not None:
            card_doc.examples = _examples_to_embedded(card_update.examples)
        if card_update.synonyms is not None:
            card_doc.synonyms = card_update.synonyms
        if card_update.antonyms is not None:
            card_doc.antonyms = card_update.antonyms
        if card_update.tags is not None:
            card_doc.tags = card_update.tags
        card_doc.save(using=db)
        return get_card(card_id, db, owner)
    except Card.DoesNotExist:
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def delete_card(card_id: str, db: str = "default", owner: User = None) -> bool:
    try:
        card_doc = Card.objects.using(db).get(id=ObjectId(card_id), owner=owner)
        card_doc.delete(using=db)
        return True
    except Card.DoesNotExist:
        return False
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def list_cards(
    skip: int, limit: int, db: str = "default", owner: User = None
) -> list[schemas.Card]:
    try:
        card_docs = Card.objects(owner=owner).using(db).skip(skip).limit(limit)
        return [_card_to_response(card) for card in card_docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---- Search ----

def search_cards(
    query: str,
    cursor: str | None,
    limit: int,
    db: str = "default",
    owner: User = None,
) -> tuple[list[schemas.Card], str | None]:
    try:
        q = (
            Q(front__icontains=query)
            | Q(back__icontains=query)
            | Q(example_original__icontains=query)
            | Q(example_translation__icontains=query)
            | Q(notes__icontains=query)
        ) & Q(owner=owner)
        if cursor:
            q &= Q(id__gt=ObjectId(cursor))
        card_docs = Card.objects(q).order_by("id").using(db).limit(limit + 1)
        results = card_docs[:limit]
        next_cursor = str(card_docs[-1].id) if len(card_docs) > limit else None
        return (
            [_card_to_response(card) for card in results],
            next_cursor,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---- Book CRUD ----

def create_book(
    file_bytes: bytes,
    filename: str,
    title: str,
    target_language: str = None,
    native_language: str = None,
    db: str = "default",
    owner: User = None,
) -> schemas.BookResponse:
    try:
        total_pages = get_pdf_page_count(file_bytes)

        book = Book(
            title=title,
            filename=filename,
            total_pages=total_pages,
            target_language=target_language,
            native_language=native_language,
            owner=owner,
        )
        book.file.put(file_bytes, content_type="application/pdf", filename=filename)
        book.save(using=db)

        # Auto-create progress tracker
        progress = BookProgress(book=book, owner=owner)
        progress.save(using=db)

        return _book_to_response(book)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_book(
    book_id: str, db: str = "default", owner: User = None
) -> schemas.BookResponse | None:
    try:
        book = Book.objects.using(db).get(id=ObjectId(book_id), owner=owner)
        return _book_to_response(book)
    except Book.DoesNotExist:
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def list_books(
    skip: int, limit: int, db: str = "default", owner: User = None
) -> list[schemas.BookResponse]:
    try:
        books = Book.objects(owner=owner).using(db).skip(skip).limit(limit)
        return [_book_to_response(b) for b in books]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def update_book(
    book_id: str,
    book_update: schemas.BookUpdate,
    db: str = "default",
    owner: User = None,
) -> schemas.BookResponse | None:
    try:
        book = Book.objects.using(db).get(id=ObjectId(book_id), owner=owner)
        if book_update.title is not None:
            book.title = book_update.title
        if book_update.target_language is not None:
            book.target_language = book_update.target_language
        if book_update.native_language is not None:
            book.native_language = book_update.native_language
        if book_update.chapters is not None:
            book.chapters = [
                Chapter(name=ch.name, start_page=ch.start_page, end_page=ch.end_page)
                for ch in book_update.chapters
            ]
        book.save(using=db)
        return _book_to_response(book)
    except Book.DoesNotExist:
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def delete_book(book_id: str, db: str = "default", owner: User = None) -> bool:
    try:
        book = Book.objects.using(db).get(id=ObjectId(book_id), owner=owner)
        book.file.delete()
        BookProgress.objects(book=book, owner=owner).using(db).delete()
        DraftCard.objects(book=book, owner=owner).using(db).delete()
        book.delete(using=db)
        return True
    except Book.DoesNotExist:
        return False
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---- BookProgress CRUD ----

def get_or_create_progress(
    book_id: str, db: str = "default", owner: User = None
) -> schemas.BookProgressResponse:
    try:
        book = Book.objects.using(db).get(id=ObjectId(book_id), owner=owner)
        progress = BookProgress.objects(book=book, owner=owner).using(db).first()
        if not progress:
            progress = BookProgress(book=book, owner=owner)
            progress.save(using=db)
        return _progress_to_response(progress)
    except Book.DoesNotExist:
        raise HTTPException(status_code=404, detail="Book not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def update_progress(
    book_id: str,
    progress_update: schemas.BookProgressUpdate,
    db: str = "default",
    owner: User = None,
) -> schemas.BookProgressResponse | None:
    try:
        book = Book.objects.using(db).get(id=ObjectId(book_id), owner=owner)
        progress = BookProgress.objects.using(db).get(book=book, owner=owner)
        if progress_update.current_page is not None:
            progress.current_page = progress_update.current_page
        if progress_update.current_chapter is not None:
            progress.current_chapter = progress_update.current_chapter
        progress.save(using=db)
        return _progress_to_response(progress)
    except (Book.DoesNotExist, BookProgress.DoesNotExist):
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def add_processed_pages(
    book_id: str, start: int, end: int, db: str = "default", owner: User = None
) -> schemas.BookProgressResponse:
    try:
        book = Book.objects.using(db).get(id=ObjectId(book_id), owner=owner)
        progress = BookProgress.objects.using(db).get(book=book, owner=owner)
        progress.pages_processed.append(PageRange(start=start, end=end))
        progress.current_page = max(progress.current_page, end + 1)
        # Check chapter completion
        if book.chapters:
            for chapter in book.chapters:
                if _is_chapter_completed(chapter, progress.pages_processed):
                    if chapter.name not in (progress.chapters_completed or []):
                        progress.chapters_completed.append(chapter.name)
        progress.save(using=db)
        return _progress_to_response(progress)
    except (Book.DoesNotExist, BookProgress.DoesNotExist):
        raise HTTPException(status_code=404, detail="Book or progress not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _is_chapter_completed(chapter: Chapter, processed_ranges: list) -> bool:
    for page in range(chapter.start_page, chapter.end_page + 1):
        if not any(r.start <= page <= r.end for r in processed_ranges):
            return False
    return True


# ---- Generation ----

def generate_next_batch(
    book_id: str, num_pages: int, num_cards: int,
    template_id: str = None,
    db: str = "default", owner: User = None,
) -> schemas.GenerationResponse:
    try:
        book = Book.objects.using(db).get(id=ObjectId(book_id), owner=owner)
        progress = BookProgress.objects.using(db).get(book=book, owner=owner)

        start_page = progress.get_next_unprocessed_page()
        end_page = min(start_page + num_pages - 1, book.total_pages)

        if start_page > book.total_pages:
            raise HTTPException(status_code=400, detail="All pages have been processed")

        return _generate_and_store_drafts(book, start_page, end_page, num_cards, db, owner, template_id)
    except Book.DoesNotExist:
        raise HTTPException(status_code=404, detail="Book not found")
    except BookProgress.DoesNotExist:
        raise HTTPException(status_code=404, detail="Book progress not found")


def generate_from_range(
    book_id: str, start_page: int, end_page: int, num_cards: int,
    template_id: str = None,
    db: str = "default", owner: User = None,
) -> schemas.GenerationResponse:
    try:
        book = Book.objects.using(db).get(id=ObjectId(book_id), owner=owner)

        if start_page < 1 or end_page > book.total_pages or start_page > end_page:
            raise HTTPException(status_code=400, detail="Invalid page range")

        return _generate_and_store_drafts(book, start_page, end_page, num_cards, db, owner, template_id)
    except Book.DoesNotExist:
        raise HTTPException(status_code=404, detail="Book not found")


def _generate_and_store_drafts(
    book: Book, start_page: int, end_page: int, num_cards: int,
    db: str, owner: User, template_id: str = None,
) -> schemas.GenerationResponse:
    
    template = None
    if template_id:
        try:
            template = Template.objects.using(db).get(id=ObjectId(template_id))
        except Template.DoesNotExist:
            raise HTTPException(status_code=400, detail="Template not found")

    # 1. Read PDF from storage
    if book.file:
        full_pdf_bytes = book.file.read()
    else:
        raise HTTPException(status_code=500, detail="Could not read book file content")

    pdf_bytes = extract_page_range_as_pdf(full_pdf_bytes, start_page, end_page)

    # 2. Call Gemini
    result = generate_flashcards_from_pdf(
        pdf_bytes=pdf_bytes,
        num_cards=num_cards,
        target_language=book.target_language or "the target language",
        native_language=book.native_language or "English",
        template=template,
    )

    # 3. Store as DraftCard documents
    batch_id = str(uuid.uuid4())
    drafts = []
    for fc in result.flashcards:
        # if the user selected a custom template, do the template-based logic
        # otherwise use the normal default logic
        if template:
            # it turns the Pydantic object into a normal Python dictionary.
            fc_dict = fc.model_dump()
            custom_fields = {f.name: fc_dict.get(f.name) for f in template.fields}
            # find the first one where show_on_front is True
            # use that field’s name
            # if none are marked, use the first template field
            # if there are no fields at all, fall back to "front"
            front_field = next((f.name for f in template.fields if f.show_on_front), template.fields[0].name if template.fields else "front")
            back_field = next((f.name for f in template.fields if not f.show_on_front), template.fields[-1].name if template.fields else "back")
            
            front_val = fc_dict.get(front_field)
            back_val = fc_dict.get(back_field)
            
            draft = DraftCard(
                front=str(front_val) if front_val else "Template Generated Front",
                back=str(back_val) if back_val else "Template Generated Back",
                template_id=template,
                custom_fields=custom_fields,
                tags=[f"page-{start_page}-{end_page}"],
                book=book,
                source_page_start=start_page,
                source_page_end=end_page,
                generation_batch_id=batch_id,
                owner=owner,
            )
        else:
            draft = DraftCard(
                front=fc.front,
                back=fc.back,
                # Gemini gives examples as dictionaries like:
                # sentence
                # translation
                # But MongoEngine expects ExampleSentence objects.
                # So this code changes each Gemini example into an ExampleSentence embedded document before saving.
                examples=[
                    ExampleSentence(
                        sentence=ex.get('sentence', ''),
                        translation=ex.get('translation', '')
                    )
                    for ex in fc.examples
                ],
                synonyms=fc.synonyms,
                antonyms=fc.antonyms,
                part_of_speech=fc.part_of_speech,
                gender=fc.gender,
                plural_form=fc.plural_form,
                pronunciation=fc.pronunciation,
                notes=fc.notes,
                tags=[f"page-{start_page}-{end_page}"],
                book=book,
                source_page_start=start_page,
                source_page_end=end_page,
                generation_batch_id=batch_id,
                owner=owner,
            )
        draft.save(using=db)
        drafts.append(draft)

    # 4. Update progress
    add_processed_pages(str(book.id), start_page, end_page, db, owner)

    return schemas.GenerationResponse(
        batch_id=batch_id,
        drafts=[_draft_to_response(d) for d in drafts],
        pages_processed=schemas.PageRangeSchema(start=start_page, end=end_page),
        message=f"Generated {len(drafts)} flashcard drafts from pages {start_page}-{end_page}",
    )


def generate_from_content(
    request: schemas.GenerateFromContentRequest,
    db: str = "default",
    owner: User = None,
) -> schemas.GenerationResponse:
    try:
        # 1. Validate input
        has_text = bool(request.text and request.text.strip())
        has_image = bool(request.image_base64 and request.image_base64.strip())

        if not has_text and not has_image:
            raise HTTPException(
                status_code=400,
                detail="Provide either text or image_base64",
            )

        if has_text and has_image:
            raise HTTPException(
                status_code=400,
                detail="Provide only one of text or image_base64",
            )

        # 2. Load the book
        book = Book.objects.using(db).get(
            id=ObjectId(request.book_id),
            owner=owner,
        )

        # 3. Load template if provided
        template = None
        if request.template_id:
            try:
                template = Template.objects.using(db).get(
                    id=ObjectId(request.template_id)
                )
            except Template.DoesNotExist:
                raise HTTPException(status_code=400, detail="Template not found")

        # 4. Ask Gemini to generate flashcards
        if has_text:
            result = generate_flashcards_from_text(
                text=request.text,
                num_cards=request.num_cards,
                target_language=book.target_language or "the target language",
                native_language=book.native_language or "English",
                template=template,
            )
        else:
            image_bytes = base64.b64decode(request.image_base64)
            result = generate_flashcards_from_image(
                image_bytes=image_bytes,
                num_cards=request.num_cards,
                target_language=book.target_language or "the target language",
                native_language=book.native_language or "English",
                template=template,
            )

        # 5. Save drafts
        batch_id = str(uuid.uuid4())
        drafts = []

        for fc in result.flashcards:
            if template:
                fc_dict = fc.model_dump()
                custom_fields = {
                    f.name: fc_dict.get(f.name) for f in template.fields
                }

                front_field = next(
                    (f.name for f in template.fields if f.show_on_front),
                    template.fields[0].name if template.fields else "front",
                )
                back_field = next(
                    (f.name for f in template.fields if not f.show_on_front),
                    template.fields[-1].name if template.fields else "back",
                )

                draft = DraftCard(
                    front=str(fc_dict.get(front_field) or "Template Generated Front"),
                    back=str(fc_dict.get(back_field) or "Template Generated Back"),
                    template_id=template,
                    custom_fields=custom_fields,
                    tags=["content-generation"],
                    book=book,
                    source_page_start=request.page_start,
                    source_page_end=request.page_end,
                    generation_batch_id=batch_id,
                    owner=owner,
                )
            else:
                draft = DraftCard(
                    front=fc.front,
                    back=fc.back,
                    examples=[
                        ExampleSentence(
                            sentence=ex.get("sentence", ""),
                            translation=ex.get("translation", ""),
                        )
                        for ex in fc.examples
                    ],
                    synonyms=fc.synonyms,
                    antonyms=fc.antonyms,
                    part_of_speech=fc.part_of_speech,
                    gender=fc.gender,
                    plural_form=fc.plural_form,
                    pronunciation=fc.pronunciation,
                    notes=fc.notes,
                    tags=["content-generation"],
                    book=book,
                    source_page_start=request.page_start,
                    source_page_end=request.page_end,
                    generation_batch_id=batch_id,
                    owner=owner,
                )

            draft.save(using=db)
            drafts.append(draft)

        # 6. Optional progress update only if page info exists
        if request.page_start is not None and request.page_end is not None:
            add_processed_pages(
                str(book.id),
                request.page_start,
                request.page_end,
                db,
                owner,
            )
            pages_processed = schemas.PageRangeSchema(
                start=request.page_start,
                end=request.page_end,
            )
        else:
            pages_processed = schemas.PageRangeSchema(start=0, end=0)

        return schemas.GenerationResponse(
            batch_id=batch_id,
            drafts=[_draft_to_response(d) for d in drafts],
            pages_processed=pages_processed,
            message=f"Generated {len(drafts)} flashcard drafts from provided content",
        )

    except Book.DoesNotExist:
        raise HTTPException(status_code=404, detail="Book not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    #if it is already a valid HTTP error, keep it as-is
    # only unexpected errors should become 500
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---- Draft Review ----

def list_drafts(
    book_id: str = None, batch_id: str = None, status: str = "pending",
    skip: int = 0, limit: int = 50,
    db: str = "default", owner: User = None,
) -> list[schemas.DraftCardResponse]:
    try:
        query = {"owner": owner}
        if book_id:
            query["book"] = ObjectId(book_id)
        if batch_id:
            query["generation_batch_id"] = batch_id
        if status:
            query["status"] = status
        drafts = DraftCard.objects(**query).using(db).skip(skip).limit(limit)
        return [_draft_to_response(d) for d in drafts]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def update_draft(
    draft_id: str, draft_update: schemas.DraftCardUpdate,
    db: str = "default", owner: User = None,
) -> schemas.DraftCardResponse | None:
    try:
        draft = DraftCard.objects.using(db).get(id=ObjectId(draft_id), owner=owner)
        for field in [
            "front", "back", "part_of_speech", "gender", "plural_form",
            "pronunciation", "notes",
        ]:
            value = getattr(draft_update, field, None)
            if value is not None:
                setattr(draft, field, value)
        if draft_update.examples is not None:
            draft.examples = _examples_to_embedded(draft_update.examples)
        if draft_update.synonyms is not None:
            draft.synonyms = draft_update.synonyms
        if draft_update.antonyms is not None:
            draft.antonyms = draft_update.antonyms
        if draft_update.tags is not None:
            draft.tags = draft_update.tags
        draft.save(using=db)
        return _draft_to_response(draft)
    except DraftCard.DoesNotExist:
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def approve_draft(
    draft_id: str, deck_id: str = None,
    db: str = "default", owner: User = None,
) -> schemas.Card | None:
    try:
        draft = DraftCard.objects.using(db).get(id=ObjectId(draft_id), owner=owner)

        card = Card(
            front=draft.front,
            back=draft.back,
            examples=draft.examples,
            synonyms=draft.synonyms,
            antonyms=draft.antonyms,
            part_of_speech=draft.part_of_speech,
            gender=draft.gender,
            plural_form=draft.plural_form,
            pronunciation=draft.pronunciation,
            notes=draft.notes,
            tags=draft.tags,
            template_id=draft.template_id,
            custom_fields=draft.custom_fields,
            source_book=draft.book,
            source_page=draft.source_page_start,
            owner=owner,
        )
        card.save(using=db)

        if deck_id:
            deck = Deck.objects.using(db).get(id=ObjectId(deck_id), owner=owner)
            deck.cards.append(card)
            deck.save(using=db)

        draft.status = "approved"
        draft.save(using=db)

        return _card_to_response(card)
    except DraftCard.DoesNotExist:
        return None
    except Deck.DoesNotExist:
        raise HTTPException(status_code=404, detail="Deck not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def bulk_approve_drafts(
    draft_ids: list[str], deck_id: str = None,
    db: str = "default", owner: User = None,
) -> list[schemas.Card]:
    cards = []
    for draft_id in draft_ids:
        card = approve_draft(draft_id, deck_id, db, owner)
        if card:
            cards.append(card)
    return cards


def reject_draft(
    draft_id: str, db: str = "default", owner: User = None
) -> bool:
    try:
        draft = DraftCard.objects.using(db).get(id=ObjectId(draft_id), owner=owner)
        draft.status = "rejected"
        draft.save(using=db)
        return True
    except DraftCard.DoesNotExist:
        return False
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def delete_rejected_drafts(
    book_id: str = None, db: str = "default", owner: User = None
) -> int:
    try:
        query = {"owner": owner, "status": "rejected"}
        if book_id:
            query["book"] = ObjectId(book_id)
        count = DraftCard.objects(**query).using(db).delete()
        return count
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
