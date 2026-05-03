"""
Memory Routes — REST API endpoints for storing and recalling user info.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services import memory_service

router = APIRouter()


class SaveMemoryRequest(BaseModel):
    content: str


@router.post("/save/{user_id}")
def save_memory(user_id: str, req: SaveMemoryRequest):
    """Save a new memory item for a specific user."""
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="Memory content cannot be empty.")
    mem = memory_service.save_memory(req.content.strip(), user_id=user_id)
    return {"status": "success", "memory": mem}


@router.get("/list/{user_id}")
def list_memories(user_id: str):
    """Return all stored memories for a specific user."""
    memories = memory_service.list_memories(user_id=user_id)
    return {"memories": memories, "count": len(memories)}
