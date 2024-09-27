from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from mongoengine import DoesNotExist, ValidationError
from backend.app.models import Flashcard
from backend.app.schemas import FlashcardCreate, FlashcardUpdate, FlashcardOut
from backend.app.elastic import index_flashcard, delete_flashcard_from_index, search_flashcards
from datetime import datetime
from backend.app.exceptions import (
    not_found_exception,
    bad_request_exception,
    internal_server_error_exception,
)

router = APIRouter(prefix="/flashcards", tags=["Flashcards"])


@router.post("/", response_model=FlashcardOut, status_code=status.HTTP_201_CREATED)
def create_flashcard(flashcard: FlashcardCreate):
    try:
        fc = Flashcard(german=flashcard.german, english=flashcard.english)
        fc.save()
        index_flashcard(fc)
        return FlashcardOut(
            id=str(fc.id),
            german=fc.german,
            english=fc.english,
            note=fc.note,
            date_created=fc.date_created,
            date_modified=fc.date_modified,
            guessed_correct=fc.guessed_correct,
            guessed_wrong=fc.guessed_wrong,
        )
    except ValidationError as ve:
        raise bad_request_exception(detail=str(ve))
    except Exception as e:
        raise internal_server_error_exception(detail=str(e))


@router.get("/{flashcard_id}", response_model=FlashcardOut)
def get_flashcard(flashcard_id: str):
    try:
        fc = Flashcard.objects.get(id=flashcard_id)
        return FlashcardOut(
            id=str(fc.id),
            german=fc.german,
            english=fc.english,
            note=fc.note,
            date_created=fc.date_created,
            date_modified=fc.date_modified,
            guessed_correct=fc.guessed_correct,
            guessed_wrong=fc.guessed_wrong,
        )
    except DoesNotExist:
        raise not_found_exception(detail="Flashcard not found")
    except Exception as e:
        raise internal_server_error_exception(detail=str(e))


@router.put("/{flashcard_id}", response_model=FlashcardOut)
def update_flashcard(flashcard_id: str, flashcard: FlashcardUpdate):
    try:
        fc = Flashcard.objects.get(id=flashcard_id)
        update_data = flashcard.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(fc, key, value)
        fc.date_modified = datetime.utcnow()
        fc.save()
        index_flashcard(fc)
        return FlashcardOut(
            id=str(fc.id),
            german=fc.german,
            english=fc.english,
            note=fc.note,
            date_created=fc.date_created,
            date_modified=fc.date_modified,
            guessed_correct=fc.guessed_correct,
            guessed_wrong=fc.guessed_wrong,
        )
    except DoesNotExist:
        raise not_found_exception(detail="Flashcard not found")
    except ValidationError as ve:
        raise bad_request_exception(detail=str(ve))
    except Exception as e:
        raise internal_server_error_exception(detail=str(e))


@router.delete("/{flashcard_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_flashcard(flashcard_id: str):
    try:
        fc = Flashcard.objects.get(id=flashcard_id)
        fc.delete()
        delete_flashcard_from_index(flashcard_id)
        return {"detail": "Flashcard deleted"}
    except DoesNotExist:
        raise not_found_exception(detail="Flashcard not found")
    except Exception as e:
        raise internal_server_error_exception(detail=str(e))


@router.get("/", response_model=List[FlashcardOut])
def list_flashcards():
    try:
        fcs = Flashcard.objects.all()
        return [
            FlashcardOut(
                id=str(fc.id),
                german=fc.german,
                english=fc.english,
                note=fc.note,
                date_created=fc.date_created,
                date_modified=fc.date_modified,
                guessed_correct=fc.guessed_correct,
                guessed_wrong=fc.guessed_wrong,
            )
            for fc in fcs
        ]
    except Exception as e:
        raise internal_server_error_exception(detail=str(e))


@router.get("/search/", response_model=List[FlashcardOut])
def search(query: str):
    try:
        ids = search_flashcards(query)
        fcs = Flashcard.objects(id__in=ids)
        return [
            FlashcardOut(
                id=str(fc.id),
                german=fc.german,
                english=fc.english,
                note=fc.note,
                date_created=fc.date_created,
                date_modified=fc.date_modified,
                guessed_correct=fc.guessed_correct,
                guessed_wrong=fc.guessed_wrong,
            )
            for fc in fcs
        ]
    except Exception as e:
        raise internal_server_error_exception(detail=str(e))
