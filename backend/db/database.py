import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB_NAME", "voice_ai_agent_db")

client = AsyncIOMotorClient(MONGO_URI)
database = client[DB_NAME]

async def get_db():
    return database

async def connect_db():
    try:
        # Check connection
        await client.server_info()
        logger.info(f"Connected to MongoDB at {MONGO_URI}")
    except Exception as e:
        logger.error(f"Could not connect to MongoDB: {e}")

async def close_db():
    client.close()
    logger.info("MongoDB connection closed")

