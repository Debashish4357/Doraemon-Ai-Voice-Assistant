from fastapi import APIRouter
from typing import List
from models.schemas import MemoryCreate, MemoryResponse
from services import memory_service
import logging

router = APIRouter(prefix="/memory", tags=["Memory"])
logger = logging.getLogger(__name__)

@router.post("/save", response_model=MemoryResponse)
async def save_memory(memory_in: MemoryCreate):
    logger.info("Saving new memory")
    return await memory_service.save_memory(memory_in)

@router.get("/list", response_model=List[MemoryResponse])
async def list_memory():
    logger.info("Retrieving all memories")
    return await memory_service.get_all_memory()
