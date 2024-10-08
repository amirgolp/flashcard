import pytest
from httpx import AsyncClient
from back.app.core.logger import get_logger

logger = get_logger()


@pytest.mark.asyncio
async def test_create_flashcard(client: AsyncClient, fake_data):
    deck_title = fake_data.unique.word()
    await client.post("/v1/decks/", json={"title": deck_title})
    flashcard_data = {
        "german_word": fake_data.word(),
        "english_translation": fake_data.word(),
        "decks": [deck_title],
        "status": "medium",
    }
    response = await client.post("/v1/flashcards/", json=flashcard_data)
    assert response.status_code == 201
    data = response.json()
    assert data["german_word"] == flashcard_data["german_word"]


@pytest.mark.asyncio
async def test_get_flashcards(client: AsyncClient):
    response = await client.get("/v1/flashcards/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_flashcard(client: AsyncClient, fake_data):
    deck_title = fake_data.unique.word()
    await client.post("/v1/decks/", json={"title": deck_title})
    flashcard_data = {
        "german_word": fake_data.word(),
        "english_translation": fake_data.word(),
        "decks": [deck_title],
    }
    response = await client.post("/v1/flashcards/", json=flashcard_data)
    flashcard_id = response.json()["id"]
    response = await client.get(f"/v1/flashcards/{flashcard_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == flashcard_id


@pytest.mark.asyncio
async def test_update_flashcard(client: AsyncClient, fake_data):
    deck_title = fake_data.unique.word()
    await client.post("/v1/decks/", json={"title": deck_title})
    flashcard_data = {
        "german_word": fake_data.word(),
        "english_translation": fake_data.word(),
        "decks": [deck_title],
    }
    response = await client.post("/v1/flashcards/", json=flashcard_data)
    flashcard_id = response.json()["id"]
    new_translation = fake_data.word()
    response = await client.put(
        f"/v1/flashcards/{flashcard_id}", json={"english_translation": new_translation}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["english_translation"] == new_translation


@pytest.mark.asyncio
async def test_delete_flashcard(client: AsyncClient, fake_data):
    deck_title = fake_data.unique.word()
    await client.post("/v1/decks/", json={"title": deck_title})
    flashcard_data = {
        "german_word": fake_data.word(),
        "english_translation": fake_data.word(),
        "decks": [deck_title],
    }
    response = await client.post("/v1/flashcards/", json=flashcard_data)
    flashcard_id = response.json()["id"]
    response = await client.delete(f"/v1/flashcards/{flashcard_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Flashcard deleted successfully"
