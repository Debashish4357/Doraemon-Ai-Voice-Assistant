from typing import List
from models.schemas import MemoryCreate, MemoryResponse
from db.collections import memory_collection
from datetime import datetime
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

async def save_memory(memory_in: MemoryCreate) -> MemoryResponse:
    memory_dict = memory_in.model_dump()
    memory_dict["timestamp"] = datetime.utcnow()
    
    result = await memory_collection.insert_one(memory_dict)
    new_memory = await memory_collection.find_one({"_id": result.inserted_id})
    
    return MemoryResponse(
        id=str(new_memory["_id"]),
        content=new_memory["content"],
        timestamp=new_memory["timestamp"]
    )

async def get_all_memory() -> List[MemoryResponse]:
    memories = []
    cursor = memory_collection.find().sort("timestamp", -1)
    async for document in cursor:
        memories.append(MemoryResponse(
            id=str(document["_id"]),
            content=document["content"],
            timestamp=document["timestamp"]
        ))
    return memories
