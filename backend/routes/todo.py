from fastapi import APIRouter, HTTPException
from typing import List
from models.schemas import TodoCreate, TodoResponse, TodoUpdate
from services import todo_service
import logging

router = APIRouter(prefix="/todo", tags=["Todo Tool"])
logger = logging.getLogger(__name__)

@router.post("/add", response_model=TodoResponse)
async def add_todo(todo_in: TodoCreate):
    logger.info(f"Adding new todo: {todo_in.task}")
    return await todo_service.add_todo(todo_in)

@router.get("/list", response_model=List[TodoResponse])
async def list_todos(skip: int = 0, limit: int = 100):
    logger.info("Retrieving all todos")
    return await todo_service.get_all_todos(skip, limit)

@router.put("/update/{todo_id}", response_model=TodoResponse)
async def update_todo(todo_id: str, todo_in: TodoUpdate):
    logger.info(f"Updating todo with id: {todo_id}")
    updated_todo = await todo_service.update_todo(todo_id, todo_in)
    if not updated_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return updated_todo

@router.delete("/delete/{todo_id}", response_model=dict)
async def delete_todo(todo_id: str):
    logger.info(f"Deleting todo with id: {todo_id}")
    success = await todo_service.delete_todo(todo_id)
    if not success:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"message": "Todo deleted successfully"}
