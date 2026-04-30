"""
Todo Service — In-memory storage for tasks.
Each task: { id, text, created_at }
"""
import time

# In-memory store — persists while the server is running
_todos: dict = {}


def add_todo(task: str) -> dict:
    """Create and store a new task. Returns the new task."""
    task_id = str(int(time.time() * 1000))  # millisecond timestamp as ID
    task_obj = {"id": task_id, "text": task, "created_at": time.strftime("%Y-%m-%d %H:%M")}
    _todos[task_id] = task_obj
    return task_obj


def list_todos() -> list:
    """Return all tasks sorted by creation time (oldest first)."""
    return list(_todos.values())


def update_todo(task_id: str, new_text: str) -> dict | None:
    """Update a task's text by ID. Returns updated task or None if not found."""
    if task_id in _todos:
        _todos[task_id]["text"] = new_text
        return _todos[task_id]
    return None


def delete_todo(task_id: str) -> bool:
    """Delete a task by ID. Returns True if deleted, False if not found."""
    if task_id in _todos:
        del _todos[task_id]
        return True
    return False


def get_todo_count() -> int:
    return len(_todos)
