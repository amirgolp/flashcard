from motor.motor_asyncio import AsyncIOMotorClient
from back.app.core.config import settings
from back.app.core.logger import get_logger

logger = get_logger()

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    try:
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}")
        client = AsyncIOMotorClient(settings.MONGODB_URI)
        db = client[settings.DATABASE_NAME]
        await client.server_info()
        logger.info("Connected to MongoDB")
    except Exception as e:
        logger.exception("Failed to connect to MongoDB")
        raise e


async def close_db():
    global client
    try:
        client.close()
        logger.info("Disconnected from MongoDB")
    except Exception as e:
        logger.error(f"Failed to disconnect from MongoDB: {e}")


async def get_database():
    global db
    if db is None:
        raise Exception("Database connection is not established.")
    return db
