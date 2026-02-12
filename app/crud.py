import io
import uuid
from typing import List, Tuple, Optional
from . import schemas
from .models import (
    Deck, Card, User, Book, BookProgress, DraftCard,
    Chapter, PageRange, ExampleSentence,
)
from .utils.gemini import (
    generate_flashcards_from_pdf,
    extract_page_range_as_pdf,
    get_pdf_page_count,
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

def get_user_by_username(username: str, db: str = "default") -> Optional[User]:
    try:
        return User.objects(username=username).using(db).first()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_user_by_email(email: str, db: str = "default") -> Optional[User]:
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
) -> Optional[User]:
    user = get_user_by_username(username, db)
    if not user:
        return None
    if not user.check_password(password):
        return None
    return user


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
) -> Optional[schemas.Deck]:
    try:
        deck_doc = Deck.objects.get(id=ObjectId(deck_id), owner=owner).using(db)
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
) -> Optional[schemas.Deck]:
    try:
        deck_doc = Deck.objects.get(id=ObjectId(deck_id), owner=owner).using(db)
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
        deck_doc = Deck.objects.get(id=ObjectId(deck_id), owner=owner).using(db)
        deck_doc.delete(using=db)
        return True
    except Deck.DoesNotExist:
        return False
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def list_decks(
    skip: int, limit: int, db: str = "default", owner: User = None
) -> List[schemas.Deck]:
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
) -> Optional[schemas.Card]:
    try:
        card_doc = Card.objects.get(id=ObjectId(card_id), owner=owner).using(db)
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
) -> Optional[schemas.Card]:
    try:
        card_doc = Card.objects.get(id=ObjectId(card_id), owner=owner).using(db)
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
        card_doc = Card.objects.get(id=ObjectId(card_id), owner=owner).using(db)
        card_doc.delete(using=db)
        return True
    except Card.DoesNotExist:
        return False
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def list_cards(
    skip: int, limit: int, db: str = "default", owner: User = None
) -> List[schemas.Card]:
    try:
        card_docs = Card.objects(owner=owner).using(db).skip(skip).limit(limit)
        return [_card_to_response(card) for card in card_docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---- Search ----

def search_cards(
    query: str,
    cursor: Optional[str],
    limit: int,
    db: str = "default",
    owner: User = None,
) -> Tuple[List[schemas.Card], Optional[str]]:
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
) -> Optional[schemas.BookResponse]:
    try:
        book = Book.objects.get(id=ObjectId(book_id), owner=owner).using(db)
        return _book_to_response(book)
    except Book.DoesNotExist:
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def list_books(
    skip: int, limit: int, db: str = "default", owner: User = None
) -> List[schemas.BookResponse]:
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
) -> Optional[schemas.BookResponse]:
    try:
        book = Book.objects.get(id=ObjectId(book_id), owner=owner).using(db)
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
        book = Book.objects.get(id=ObjectId(book_id), owner=owner).using(db)
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
        book = Book.objects.get(id=ObjectId(book_id), owner=owner).using(db)
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
) -> Optional[schemas.BookProgressResponse]:
    try:
        book = Book.objects.get(id=ObjectId(book_id), owner=owner).using(db)
        progress = BookProgress.objects.get(book=book, owner=owner).using(db)
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
        book = Book.objects.get(id=ObjectId(book_id), owner=owner).using(db)
        progress = BookProgress.objects.get(book=book, owner=owner).using(db)
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
    db: str = "default", owner: User = None,
) -> schemas.GenerationResponse:
    try:
        book = Book.objects.get(id=ObjectId(book_id), owner=owner).using(db)
        progress = BookProgress.objects.get(book=book, owner=owner).using(db)

        start_page = progress.get_next_unprocessed_page()
        end_page = min(start_page + num_pages - 1, book.total_pages)

        if start_page > book.total_pages:
            raise HTTPException(status_code=400, detail="All pages have been processed")

        return _generate_and_store_drafts(book, start_page, end_page, num_cards, db, owner)
    except Book.DoesNotExist:
        raise HTTPException(status_code=404, detail="Book not found")
    except BookProgress.DoesNotExist:
        raise HTTPException(status_code=404, detail="Book progress not found")


def generate_from_range(
    book_id: str, start_page: int, end_page: int, num_cards: int,
    db: str = "default", owner: User = None,
) -> schemas.GenerationResponse:
    try:
        book = Book.objects.get(id=ObjectId(book_id), owner=owner).using(db)

        if start_page < 1 or end_page > book.total_pages or start_page > end_page:
            raise HTTPException(status_code=400, detail="Invalid page range")

        return _generate_and_store_drafts(book, start_page, end_page, num_cards, db, owner)
    except Book.DoesNotExist:
        raise HTTPException(status_code=404, detail="Book not found")


def _generate_and_store_drafts(
    book: Book, start_page: int, end_page: int, num_cards: int,
    db: str, owner: User,
) -> schemas.GenerationResponse:
    # 1. Read PDF from GridFS and extract page range
    full_pdf_bytes = book.file.read()
    pdf_bytes = extract_page_range_as_pdf(full_pdf_bytes, start_page, end_page)

    # 2. Call Gemini
    result = generate_flashcards_from_pdf(
        pdf_bytes=pdf_bytes,
        num_cards=num_cards,
        target_language=book.target_language or "the target language",
        native_language=book.native_language or "English",
    )

    # 3. Store as DraftCard documents
    batch_id = str(uuid.uuid4())
    drafts = []
    for fc in result.flashcards:
        draft = DraftCard(
            front=fc.front,
            back=fc.back,
            examples=[
                ExampleSentence(sentence=ex.sentence, translation=ex.translation)
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


# ---- Draft Review ----

def list_drafts(
    book_id: str = None, batch_id: str = None, status: str = "pending",
    skip: int = 0, limit: int = 50,
    db: str = "default", owner: User = None,
) -> List[schemas.DraftCardResponse]:
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
) -> Optional[schemas.DraftCardResponse]:
    try:
        draft = DraftCard.objects.get(id=ObjectId(draft_id), owner=owner).using(db)
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
) -> Optional[schemas.Card]:
    try:
        draft = DraftCard.objects.get(id=ObjectId(draft_id), owner=owner).using(db)

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
            source_book=draft.book,
            source_page=draft.source_page_start,
            owner=owner,
        )
        card.save(using=db)

        if deck_id:
            deck = Deck.objects.get(id=ObjectId(deck_id), owner=owner).using(db)
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
    draft_ids: List[str], deck_id: str = None,
    db: str = "default", owner: User = None,
) -> List[schemas.Card]:
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
        draft = DraftCard.objects.get(id=ObjectId(draft_id), owner=owner).using(db)
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
