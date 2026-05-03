"""
Todo Service — MongoDB-backed storage for tasks.
Supports user isolation via user_id.
"""
import time
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Synchronous client for easier integration with current service structure
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB_NAME", "voice_ai_agent_db")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
todos_col = db["todos"]

def add_todo(task: str, user_id: str = "default") -> dict:
    """Create and store a new task. Returns the new task."""
    task_obj = {
        "user_id": user_id,
        "text": task,
        "status": "open",
        "created_at": time.strftime("%Y-%m-%d %H:%M")
    }
    result = todos_col.insert_one(task_obj)
    task_obj["id"] = str(result.inserted_id)
    del task_obj["_id"]
    return task_obj

def list_todos(user_id: str = "default") -> list:
    """Return all tasks for a specific user."""
    cursor = todos_col.find({"user_id": user_id})
    tasks = []
    for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        tasks.append(doc)
    return tasks

def update_todo(task_id: str, new_text: str, user_id: str = "default") -> dict | None:
    """Update a task's text."""
    from bson.objectid import ObjectId
    try:
        todos_col.update_one(
            {"_id": ObjectId(task_id), "user_id": user_id},
            {"$set": {"text": new_text}}
        )
        return {"id": task_id, "text": new_text}
    except:
        return None

def delete_todo(task_id: str, user_id: str = "default") -> bool:
    """Delete a task."""
    from bson.objectid import ObjectId
    try:
        result = todos_col.delete_one({"_id": ObjectId(task_id), "user_id": user_id})
        return result.deleted_count > 0
    except:
        return False

def get_todo_count(user_id: str = "default") -> int:
    return todos_col.count_documents({"user_id": user_id})
