from typing import List, Tuple, Optional
from . import schemas
from .models import Deck, Card, User
from mongoengine import Q
from bson import ObjectId
from fastapi import HTTPException


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
        return schemas.Deck(
            id=str(deck_doc.id),
            name=deck_doc.name,
            description=deck_doc.description,
            cards=[
                schemas.Card(
                    id=str(card.id),
                    front=card.front,
                    back=card.back,
                    example_original=card.example_original,
                    example_translation=card.example_translation,
                    hardness_level=card.hardness_level,
                    date_created=card.date_created,
                    last_edited=card.last_edited,
                    last_visited=card.last_visited,
                )
                for card in deck_doc.cards
            ],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_deck(
    deck_id: str, db: str = "default", owner: User = None
) -> Optional[schemas.Deck]:
    try:
        deck_doc = Deck.objects.get(id=ObjectId(deck_id), owner=owner).using(db)
        return schemas.Deck(
            id=str(deck_doc.id),
            name=deck_doc.name,
            description=deck_doc.description,
            cards=[
                schemas.Card(
                    id=str(card.id),
                    front=card.front,
                    back=card.back,
                    example_original=card.example_original,
                    example_translation=card.example_translation,
                    hardness_level=card.hardness_level,
                    date_created=card.date_created,
                    last_edited=card.last_edited,
                    last_visited=card.last_visited,
                )
                for card in deck_doc.cards
            ],
        )
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
        return [
            schemas.Deck(
                id=str(deck.id),
                name=deck.name,
                description=deck.description,
                cards=[
                    schemas.Card(
                        id=str(card.id),
                        front=card.front,
                        back=card.back,
                        example_original=card.example_original,
                        example_translation=card.example_translation,
                        hardness_level=card.hardness_level,
                        date_created=card.date_created,
                        last_edited=card.last_edited,
                        last_visited=card.last_visited,
                    )
                    for card in deck.cards
                ],
            )
            for deck in deck_docs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def create_card(
    card: schemas.CardCreate, db: str = "default", owner: User = None
) -> schemas.Card:
    try:
        card_doc = Card(
            front=card.front,
            back=card.back,
            example_original=card.example_original,
            example_translation=card.example_translation,
            hardness_level=card.hardness_level,
            owner=owner,
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
            last_visited=card_doc.last_visited,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_card(
    card_id: str, db: str = "default", owner: User = None
) -> Optional[schemas.Card]:
    try:
        card_doc = Card.objects.get(id=ObjectId(card_id), owner=owner).using(db)
        return schemas.Card(
            id=str(card_doc.id),
            front=card_doc.front,
            back=card_doc.back,
            example_original=card_doc.example_original,
            example_translation=card_doc.example_translation,
            hardness_level=card_doc.hardness_level,
            date_created=card_doc.date_created,
            last_edited=card_doc.last_edited,
            last_visited=card_doc.last_visited,
        )
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
                last_visited=card.last_visited,
            )
            for card in card_docs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Search Function with Ownership Enforcement
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
        ) & Q(owner=owner)
        if cursor:
            q &= Q(id__gt=ObjectId(cursor))
        card_docs = Card.objects(q).order_by("id").using(db).limit(limit + 1)
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
                    last_visited=card.last_visited,
                )
                for card in results
            ],
            next_cursor,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
