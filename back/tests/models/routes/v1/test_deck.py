import pytest
from httpx import AsyncClient
from back.app.core.logger import get_logger

logger = get_logger()


@pytest.mark.asyncio
async def test_create_deck(client: AsyncClient, fake_data):
    deck_title = fake_data.unique.word()
    response = await client.post(
        "/v1/decks/", json={"title": deck_title, "description": "Test deck"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == deck_title


@pytest.mark.asyncio
async def test_get_decks(client: AsyncClient):
    response = await client.get("/v1/decks/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_deck(client: AsyncClient, fake_data):
    deck_title = fake_data.unique.word()
    await client.post("/v1/decks/", json={"title": deck_title})
    response = await client.get(f"/v1/decks/{deck_title}")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == deck_title


@pytest.mark.asyncio
async def test_update_deck(client: AsyncClient, fake_data):
    deck_title = fake_data.unique.word()
    new_description = fake_data.sentence()
    await client.post("/v1/decks/", json={"title": deck_title})
    response = await client.put(
        f"/v1/decks/{deck_title}", json={"description": new_description}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["description"] == new_description


@pytest.mark.asyncio
async def test_delete_deck(client: AsyncClient, fake_data):
    deck_title = fake_data.unique.word()
    # Create a deck first
    await client.post("/v1/decks/", json={"title": deck_title})
    # Delete the deck
    response = await client.delete(f"/v1/decks/{deck_title}")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Deck deleted successfully"
