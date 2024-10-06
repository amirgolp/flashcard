import pytest
import os
from httpx import AsyncClient
from back.app.main import app
from back.app.utils.db import db, connect_db, close_db
from back.app.core.config import settings
from back.app.core.logger import get_logger
from faker import Faker

logger = get_logger()


@pytest.fixture(scope="session")
def event_loop():
    import asyncio

    return asyncio.get_event_loop()


@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    os.environ["ENV"] = "test"
    settings.MONGODB_URI = os.getenv("MONGODB_URI")
    settings.DATABASE_NAME = os.getenv("DATABASE_NAME")
    await connect_db()
    yield
    await close_db()


@pytest.fixture(scope="function", autouse=True)
async def clean_db():
    for collection in await db.list_collection_names():
        await db[collection].delete_many({})
    yield


@pytest.fixture(scope="function")
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture(scope="function")
async def fake_data():
    return Faker()
