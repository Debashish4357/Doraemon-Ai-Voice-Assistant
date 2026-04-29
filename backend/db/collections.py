from db.database import database
import logging

logger = logging.getLogger(__name__)

# Collection references
todo_collection = database.get_collection("todos")
memory_collection = database.get_collection("memory")

# Create indexes (Bonus feature) — silently skipped if the user lacks write permissions
async def create_indexes():
    try:
        await todo_collection.create_index("created_at")
        await memory_collection.create_index("timestamp")
        logger.info("Indexes ensured.")
    except Exception as e:
        logger.warning(f"Could not create indexes (likely read-only user): {e}")
