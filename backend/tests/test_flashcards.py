from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_create_flashcard():
    response = client.post(
        "/v1/flashcards/",
        json={
            "deck_id": "60d5ec49f8d4e15a8c0f0e4b",
            "german": "Baum",
            "english": "Tree",
            "example_sentence": "Der Baum ist hoch.",
        },
    )
    assert response.status_code == 201
    assert response.json()["german"] == "Baum"
