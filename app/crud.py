# app/crud.py

from typing import List, Tuple, Optional
from . import schemas
from .models import Deck, Card
from mongoengine import Q
from bson import ObjectId
from fastapi import HTTPException

def create_deck(deck: schemas.DeckCreate, db: str = 'default') -> schemas.Deck:
    try:
        card_objects = Card.objects(id__in=deck.card_ids).using(db)
        deck_doc = Deck(
            name=deck.name,
            description=deck.description,
            cards=card_objects
        )
        deck_doc.save(using=db)
        return schemas.Deck(
            id=str(deck_doc.id),
            name=deck_doc.name,
            description=deck_doc.description,
            cards=[schemas.Card(
                id=str(card.id),
                front=card.front,
                back=card.back,
                example_original=card.example_original,
                example_translation=card.example_translation,
                hardness_level=card.hardness_level,
                date_created=card.date_created,
                last_edited=card.last_edited,
                last_visited=card.last_visited
            ) for card in deck_doc.cards],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_deck(deck_id: str, db: str = 'default') -> Optional[schemas.Deck]:
    try:
        deck_doc = Deck.objects.get(id=ObjectId(deck_id)).using(db)
        return schemas.Deck(
            id=str(deck_doc.id),
            name=deck_doc.name,
            description=deck_doc.description,
            cards=[schemas.Card(
                id=str(card.id),
                front=card.front,
                back=card.back,
                example_original=card.example_original,
                example_translation=card.example_translation,
                hardness_level=card.hardness_level,
                date_created=card.date_created,
                last_edited=card.last_edited,
                last_visited=card.last_visited
            ) for card in deck_doc.cards],
        )
    except Deck.DoesNotExist:
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def update_deck(deck_id: str, deck_update: schemas.DeckUpdate, db: str = 'default') -> Optional[schemas.Deck]:
    try:
        deck_doc = Deck.objects.get(id=ObjectId(deck_id)).using(db)
        if deck_update.name is not None:
            deck_doc.name = deck_update.name
        if deck_update.description is not None:
            deck_doc.description = deck_update.description
        if deck_update.card_ids is not None:
            deck_doc.cards = Card.objects(id__in=deck_update.card_ids).using(db)
        deck_doc.save(using=db)
        return get_deck(deck_id, db)
    except Deck.DoesNotExist:
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def delete_deck(deck_id: str, db: str = 'default') -> bool:
    try:
        deck_doc = Deck.objects.get(id=ObjectId(deck_id)).using(db)
        deck_doc.delete(using=db)
        return True
    except Deck.DoesNotExist:
        return False
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def list_decks(skip: int, limit: int, db: str = 'default') -> List[schemas.Deck]:
    try:
        deck_docs = Deck.objects.using(db).skip(skip).limit(limit)
        return [
            schemas.Deck(
                id=str(deck.id),
                name=deck.name,
                description=deck.description,
                cards=[schemas.Card(
                    id=str(card.id),
                    front=card.front,
                    back=card.back,
                    example_original=card.example_original,
                    example_translation=card.example_translation,
                    hardness_level=card.hardness_level,
                    date_created=card.date_created,
                    last_edited=card.last_edited,
                    last_visited=card.last_visited
                ) for card in deck.cards],
            ) for deck in deck_docs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Similar CRUD functions for Card

def create_card(card: schemas.CardCreate, db: str = 'default') -> schemas.Card:
    try:
        card_doc = Card(
            front=card.front,
            back=card.back,
            example_original=card.example_original,
            example_translation=card.example_translation,
            hardness_level=card.hardness_level
        )
        card_doc.save(using=db)
        return schemas.Card(
            id=str(card_doc.id),
            front=card_doc.front,
            back=card_doc.back,
            example_original=card_doc.example_original,
            example_translation=card_doc.example_translation,
            hardness_level=card_doc.hardness_level,
            date_created=card_doc.date_created,
            last_edited=card_doc.last_edited,
            last_visited=card_doc.last_visited
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_card(card_id: str, db: str = 'default') -> Optional[schemas.Card]:
    try:
        card_doc = Card.objects.get(id=ObjectId(card_id)).using(db)
        return schemas.Card(
            id=str(card_doc.id),
            front=card_doc.front,
            back=card_doc.back,
            example_original=card_doc.example_original,
            example_translation=card_doc.example_translation,
            hardness_level=card_doc.hardness_level,
            date_created=card_doc.date_created,
            last_edited=card_doc.last_edited,
            last_visited=card_doc.last_visited
        )
    except Card.DoesNotExist:
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def update_card(card_id: str, card_update: schemas.CardUpdate, db: str = 'default') -> Optional[schemas.Card]:
    try:
        card_doc = Card.objects.get(id=ObjectId(card_id)).using(db)
        if card_update.front is not None:
            card_doc.front = card_update.front
        if card_update.back is not None:
            card_doc.back = card_update.back
        if card_update.example_original is not None:
            card_doc.example_original = card_update.example_original
        if card_update.example_translation is not None:
            card_doc.example_translation = card_update.example_translation
        if card_update.hardness_level is not None:
            card_doc.hardness_level = card_update.hardness_level
        card_doc.save(using=db)
        return get_card(card_id, db)
    except Card.DoesNotExist:
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def delete_card(card_id: str, db: str = 'default') -> bool:
    try:
        card_doc = Card.objects.get(id=ObjectId(card_id)).using(db)
        card_doc.delete(using=db)
        return True
    except Card.DoesNotExist:
        return False
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def list_cards(skip: int, limit: int, db: str = 'default') -> List[schemas.Card]:
    try:
        card_docs = Card.objects.using(db).skip(skip).limit(limit)
        return [
            schemas.Card(
                id=str(card.id),
                front=card.front,
                back=card.back,
                example_original=card.example_original,
                example_translation=card.example_translation,
                hardness_level=card.hardness_level,
                date_created=card.date_created,
                last_edited=card.last_edited,
                last_visited=card.last_visited
            ) for card in card_docs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def search_cards(query: str, cursor: Optional[str], limit: int, db: str = 'default') -> Tuple[List[schemas.Card], Optional[str]]:
    try:
        q = Q(front__icontains=query) | Q(back__icontains=query) | Q(example_original__icontains=query) | Q(example_translation__icontains=query)
        if cursor:
            q &= Q(id__gt=ObjectId(cursor))
        card_docs = Card.objects(q).order_by('id').using(db).limit(limit + 1)
        results = card_docs[:limit]
        next_cursor = str(card_docs[-1].id) if len(card_docs) > limit else None
        return (
            [
                schemas.Card(
                    id=str(card.id),
                    front=card.front,
                    back=card.back,
                    example_original=card.example_original,
                    example_translation=card.example_translation,
                    hardness_level=card.hardness_level,
                    date_created=card.date_created,
                    last_edited=card.last_edited,
                    last_visited=card.last_visited
                ) for card in results
            ],
            next_cursor
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
