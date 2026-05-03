"""
To-Do Routes — REST API endpoints for task management.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services import todo_service

router = APIRouter()


class AddTodoRequest(BaseModel):
    task: str


class UpdateTodoRequest(BaseModel):
    task: str


@router.post("/add/{user_id}")
def add_todo(user_id: str, req: AddTodoRequest):
    """Add a new task to the list for a specific user."""
    if not req.task.strip():
        raise HTTPException(status_code=400, detail="Task text cannot be empty.")
    new_task = todo_service.add_todo(req.task.strip(), user_id=user_id)
    return {"status": "success", "task": new_task}


@router.get("/list/{user_id}")
def list_todos(user_id: str):
    """Return all tasks for a specific user."""
    tasks = todo_service.list_todos(user_id=user_id)
    return {"tasks": tasks, "count": len(tasks)}


@router.put("/update/{user_id}/{task_id}")
def update_todo(user_id: str, task_id: str, req: UpdateTodoRequest):
    """Update a task's text."""
    if not req.task.strip():
        raise HTTPException(status_code=400, detail="Task text cannot be empty.")
    updated = todo_service.update_todo(task_id, req.task.strip(), user_id=user_id)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Task with id '{task_id}' not found.")
    return {"status": "success", "task": updated}


@router.delete("/delete/{user_id}/{task_id}")
def delete_todo(user_id: str, task_id: str):
    """Delete a task."""
    deleted = todo_service.delete_todo(task_id, user_id=user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Task with id '{task_id}' not found.")
    return {"status": "success", "deleted_id": task_id}
