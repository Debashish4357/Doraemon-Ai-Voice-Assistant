"""
Agent Service — Rule-based fallback brain for Doraemon.
Used when no GROQ_API_KEY is set.
Clean, no static "I heard you say" responses.
"""
from services import todo_service, memory_service


def _extract_after(message: str, keyword: str) -> str:
    """Extract text after a keyword, case-insensitive."""
    idx = message.lower().find(keyword.lower())
    if idx == -1:
        return ""
    return message[idx + len(keyword):].strip(" .,:!?")


def process_message(message: str) -> dict:
    """
    Rule-based intent detection and dispatch.
    Returns: { type, response, data }
    """
    msg = message.strip().lower()

    # ── GREETING ──────────────────────────────────────────────────────────────
    greet_words = ["hello", "hi", "hey", "doraemon"]
    if any(
        f" {kw} " in f" {msg} " or msg == kw
        or msg.startswith(kw + " ") or msg.endswith(" " + kw)
        for kw in greet_words
    ):
        return {
            "type": "chat",
            "response": "Hi! I'm Doraemon. How can I help you today?",
            "data": None
        }

    # ── PRESETS ───────────────────────────────────────────────────────────────
    if "preset" in msg:
        todo_service.add_todo("Repair the Time Machine")
        todo_service.add_todo("Buy Dorayaki for the party")
        todo_service.add_todo("Help Nobita with math homework")
        memory_service.save_memory("I must remember to hide my gadgets from Gian")
        return {
            "type": "chat",
            "response": "I've loaded your Doraemon-themed presets! Check your sidebar.",
            "data": {"action": "preset_loaded"}
        }

    # ── TO-DO: ADD ─────────────────────────────────────────────────────────────
    for kw in ["add task", "add todo", "create task", "remind me to", "new task"]:
        if kw in msg:
            task_text = _extract_after(message, kw)
            if not task_text:
                return {"type": "chat", "response": "What task should I add?", "data": None}
            task = todo_service.add_todo(task_text)
            return {
                "type": "todo",
                "response": f"Done, added '{task_text}' to your tasks.",
                "data": {"action": "add", "task": task}
            }

    # ── TO-DO: UPDATE ──────────────────────────────────────────────────────────
    for kw in ["update task", "edit task", "change task", "rename task"]:
        if kw in msg:
            rest = _extract_after(message, kw)
            if " to " in rest.lower():
                old_text, new_text = rest.lower().split(" to ", 1)
                old_text, new_text = old_text.strip(), new_text.strip()
                for task in todo_service.list_todos():
                    if old_text in task["text"].lower():
                        todo_service.update_todo(task["id"], new_text)
                        return {
                            "type": "todo",
                            "response": f"Updated — '{task['text']}' is now '{new_text}'.",
                            "data": {"action": "update"}
                        }
                return {
                    "type": "todo",
                    "response": "I couldn't find that task. Say 'show my tasks' to see your list.",
                    "data": None
                }
            return {
                "type": "chat",
                "response": "Say: 'update task <old name> to <new name>'.",
                "data": None
            }

    # ── TO-DO: DELETE ──────────────────────────────────────────────────────────
    for kw in ["delete task", "remove task", "complete task", "done with", "finish task"]:
        if kw in msg:
            tasks = todo_service.list_todos()
            if not tasks:
                return {"type": "todo", "response": "You have no tasks to delete.", "data": None}
            deleted = None
            # Match by task text in message
            for task in tasks:
                if task["text"].lower() in msg:
                    todo_service.delete_todo(task["id"])
                    deleted = task
                    break
            # Fuzzy fallback
            if not deleted:
                search = _extract_after(message, kw).lower()
                for task in tasks:
                    if search and (search in task["text"].lower() or task["text"].lower() in search):
                        todo_service.delete_todo(task["id"])
                        deleted = task
                        break
            if deleted:
                return {
                    "type": "todo",
                    "response": f"Removed '{deleted['text']}' from your list.",
                    "data": {"action": "delete", "task": deleted}
                }
            names = ", ".join(t["text"] for t in tasks)
            return {
                "type": "todo",
                "response": f"Couldn't find that task. Your tasks: {names}.",
                "data": {"action": "list", "tasks": tasks}
            }

    # ── TO-DO: LIST ────────────────────────────────────────────────────────────
    if any(kw in msg for kw in [
        "show task", "list task", "show todo", "my task",
        "what are my task", "show my task", "all task", "pending task"
    ]):
        tasks = todo_service.list_todos()
        if not tasks:
            return {
                "type": "todo",
                "response": "Your task list is empty.",
                "data": {"action": "list", "tasks": []}
            }
        task_list = ", ".join(t["text"] for t in tasks)
        return {
            "type": "todo",
            "response": f"You have {len(tasks)} task{'s' if len(tasks) > 1 else ''}: {task_list}.",
            "data": {"action": "list", "tasks": tasks}
        }

    # ── MEMORY: SAVE ───────────────────────────────────────────────────────────
    for kw in ["remember", "don't forget", "note that", "keep in mind", "save that"]:
        if kw in msg:
            content = _extract_after(message, kw)
            if not content:
                return {"type": "chat", "response": "What should I remember?", "data": None}
            mem = memory_service.save_memory(content)
            return {
                "type": "memory",
                "response": f"Got it, I'll remember: '{content}'.",
                "data": {"action": "save", "memory": mem}
            }

    # ── MEMORY: RECALL ─────────────────────────────────────────────────────────
    if any(kw in msg for kw in [
        "what did i tell", "what do you remember", "what did i say",
        "recall", "my info", "what do you know about me", "show memory", "my memories"
    ]):
        return {
            "type": "memory",
            "response": memory_service.get_memories_as_text(),
            "data": {"action": "list", "memories": memory_service.list_memories()}
        }

    # ── GOODBYE ────────────────────────────────────────────────────────────────
    if any(kw in msg for kw in ["bye", "goodbye", "see you", "take care", "exit", "quit"]):
        return {"type": "chat", "response": "Goodbye! Talk soon.", "data": None}

    # ── THANKS ─────────────────────────────────────────────────────────────────
    if any(kw in msg for kw in ["thank you", "thanks", "thank u"]):
        return {"type": "chat", "response": "You're welcome!", "data": None}

    # ── HELP ───────────────────────────────────────────────────────────────────
    if any(kw in msg for kw in ["help", "what can you do", "capabilities"]):
        return {
            "type": "chat",
            "response": (
                "I can manage your tasks and memories. "
                "Try: 'add task buy milk', 'show my tasks', "
                "'delete task buy milk', 'remember my exam is Monday', "
                "or 'what did I tell you?'."
            ),
            "data": None
        }

    # ── DEFAULT ────────────────────────────────────────────────────────────────
    task_count = todo_service.get_todo_count()
    mem_count = len(memory_service.list_memories())
    context = ""
    if task_count or mem_count:
        context = f" You have {task_count} task{'s' if task_count != 1 else ''} and {mem_count} memor{'ies' if mem_count != 1 else 'y'}."
    return {
        "type": "chat",
        "response": f"I'm not sure about that.{context} Say 'help' to see what I can do.",
        "data": None
    }
