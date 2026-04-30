"""
Memory Routes — REST API endpoints for storing and recalling user info.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services import memory_service

router = APIRouter()


class SaveMemoryRequest(BaseModel):
    content: str


@router.post("/save")
def save_memory(req: SaveMemoryRequest):
    """Save a new memory item."""
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="Memory content cannot be empty.")
    mem = memory_service.save_memory(req.content.strip())
    return {"status": "success", "memory": mem}


@router.get("/list")
def list_memories():
    """Return all stored memories."""
    memories = memory_service.list_memories()
    return {"memories": memories, "count": len(memories)}
