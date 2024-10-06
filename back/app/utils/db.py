from motor.motor_asyncio import AsyncIOMotorClient
from back.app.core.config import settings
from back.app.core.logger import get_logger

logger = get_logger()

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URI)
        db = client[settings.DATABASE_NAME]
        logger.info("Connected to MongoDB")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")


async def close_db():
    global client
    try:
        client.close()
        logger.info("Disconnected from MongoDB")
    except Exception as e:
        logger.error(f"Failed to disconnect from MongoDB: {e}")
