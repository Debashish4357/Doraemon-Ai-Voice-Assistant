"""
Memory Service — MongoDB-backed storage for user facts.
Supports user isolation via user_id.
"""
import time
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Flexible URI check
MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI") or "mongodb://localhost:27017"
DB_NAME = os.getenv("MONGO_DB_NAME", "voice_ai_agent_db")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
memories_col = db["memories"]

def save_memory(content: str, user_id: str = "default") -> dict:
    """Save a new memory item. Returns the saved item."""
    memory = {
        "user_id": user_id,
        "content": content,
        "saved_at": time.strftime("%Y-%m-%d %H:%M")
    }
    result = memories_col.insert_one(memory)
    memory["id"] = str(result.inserted_id)
    del memory["_id"]
    return memory

def list_memories(user_id: str = "default") -> list:
    """Return all stored memories for a user."""
    cursor = memories_col.find({"user_id": user_id}).sort("saved_at", -1)
    memories = []
    for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        memories.append(doc)
    return memories

def get_memories_as_text(user_id: str = "default") -> str:
    """Return memories as a readable string for agent context."""
    memories = list_memories(user_id)
    if not memories:
        return "I don't have any memories stored yet."
    items = [f"- {m['content']}" for m in memories]
    return "Here is what I remember about you:\n" + "\n".join(items)
