from typing import List, Optional
from models.schemas import TodoCreate, TodoResponse, TodoUpdate
from db.collections import todo_collection
from datetime import datetime
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

async def add_todo(todo_in: TodoCreate) -> TodoResponse:
    todo_dict = todo_in.model_dump()
    todo_dict["created_at"] = datetime.utcnow()
    
    result = await todo_collection.insert_one(todo_dict)
    new_todo = await todo_collection.find_one({"_id": result.inserted_id})
    
    return TodoResponse(
        id=str(new_todo["_id"]),
        task=new_todo["task"],
        created_at=new_todo["created_at"]
    )

async def get_all_todos(skip: int = 0, limit: int = 100) -> List[TodoResponse]:
    todos = []
    cursor = todo_collection.find().sort("created_at", -1).skip(skip).limit(limit)
    async for document in cursor:
        todos.append(TodoResponse(
            id=str(document["_id"]),
            task=document["task"],
            created_at=document["created_at"]
        ))
    return todos

async def update_todo(todo_id: str, todo_in: TodoUpdate) -> Optional[TodoResponse]:
    if not ObjectId.is_valid(todo_id):
        return None
        
    update_data = {"$set": todo_in.model_dump()}
    result = await todo_collection.update_one({"_id": ObjectId(todo_id)}, update_data)
    
    if result.modified_count == 1 or result.matched_count == 1:
        updated_todo = await todo_collection.find_one({"_id": ObjectId(todo_id)})
        return TodoResponse(
            id=str(updated_todo["_id"]),
            task=updated_todo["task"],
            created_at=updated_todo["created_at"]
        )
    return None

async def delete_todo(todo_id: str) -> bool:
    if not ObjectId.is_valid(todo_id):
        return False
        
    result = await todo_collection.delete_one({"_id": ObjectId(todo_id)})
    return result.deleted_count == 1
