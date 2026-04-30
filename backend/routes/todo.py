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


@router.post("/add")
def add_todo(req: AddTodoRequest):
    """Add a new task to the list."""
    if not req.task.strip():
        raise HTTPException(status_code=400, detail="Task text cannot be empty.")
    new_task = todo_service.add_todo(req.task.strip())
    return {"status": "success", "task": new_task}


@router.get("/list")
def list_todos():
    """Return all tasks."""
    tasks = todo_service.list_todos()
    return {"tasks": tasks, "count": len(tasks)}


@router.put("/update/{task_id}")
def update_todo(task_id: str, req: UpdateTodoRequest):
    """Update a task's text by its ID."""
    if not req.task.strip():
        raise HTTPException(status_code=400, detail="Task text cannot be empty.")
    updated = todo_service.update_todo(task_id, req.task.strip())
    if not updated:
        raise HTTPException(status_code=404, detail=f"Task with id '{task_id}' not found.")
    return {"status": "success", "task": updated}


@router.delete("/delete/{task_id}")
def delete_todo(task_id: str):
    """Delete a task by its ID."""
    deleted = todo_service.delete_todo(task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Task with id '{task_id}' not found.")
    return {"status": "success", "deleted_id": task_id}
