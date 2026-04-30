"""
Agent Service — Core brain of Doraemon.
Parses user intent and dispatches to the correct service.
No external AI API needed — pure rule-based NLP.
"""
from services import todo_service, memory_service


def _extract_after(message: str, keyword: str) -> str:
    """
    Case-insensitive extraction of text after a keyword.
    e.g. _extract_after("Add task buy milk", "add task") → "buy milk"
    """
    idx = message.lower().find(keyword.lower())
    if idx == -1:
        return ""
    return message[idx + len(keyword):].strip(" .,:!?")


def process_message(message: str) -> dict:
    """
    Main entry point. Takes user message, returns structured response.
    Response format: { type, response, data }
    """
    msg = message.strip().lower()

    # ── GREETING ──────────────────────────────────────────────────────────────
    # Only greet when the user explicitly says hi/hello/hey/doraemon.
    # Use word-boundary style check so "history" doesn't trigger "hi".
    greet_words = ["hello", "hi", "hey", "doraemon"]
    if any(f" {kw} " in f" {msg} " or msg == kw or msg.startswith(kw + " ") or msg.endswith(" " + kw)
           for kw in greet_words):
        return {
            "type": "chat",
            "response": "Hi, I'm Doraemon, your AI assistant. How can I help you?",
            "data": None
        }

    # ── TO-DO: ADD ─────────────────────────────────────────────────────────────
    add_keywords = ["add task", "add todo", "create task", "remind me to", "new task"]
    for kw in add_keywords:
        if kw in msg:
            task_text = _extract_after(message, kw)
            if not task_text:
                return {"type": "chat", "response": "What task would you like me to add?", "data": None}
            new_task = todo_service.add_todo(task_text)
            print(f"[Agent] Added task: {task_text}")
            return {
                "type": "todo",
                "response": f"Done! I've added '{task_text}' to your task list.",
                "data": {"action": "add", "task": new_task}
            }

    # ── TO-DO: LIST ────────────────────────────────────────────────────────────
    list_keywords = ["show task", "list task", "show todo", "my task", "what are my task",
                     "show my task", "all task", "pending task", "what tasks"]
    if any(kw in msg for kw in list_keywords):
        tasks = todo_service.list_todos()
        if not tasks:
            return {
                "type": "todo",
                "response": "Your task list is empty. Say 'add task' followed by the task name to add one.",
                "data": {"action": "list", "tasks": []}
            }
        task_list = ", ".join([t["text"] for t in tasks])
        count = len(tasks)
        print(f"[Agent] Listing {count} tasks")
        return {
            "type": "todo",
            "response": f"You have {count} task{'s' if count > 1 else ''}: {task_list}.",
            "data": {"action": "list", "tasks": tasks}
        }

    # ── TO-DO: UPDATE ──────────────────────────────────────────────────────────
    update_keywords = ["update task", "edit task", "change task", "rename task", "modify task"]
    for kw in update_keywords:
        if kw in msg:
            # Expect format: "update task <old> to <new>"
            rest = _extract_after(message, kw)
            if " to " in rest.lower():
                parts = rest.lower().split(" to ", 1)
                old_text = parts[0].strip()
                new_text = parts[1].strip()
                tasks = todo_service.list_todos()
                matched = None
                for task in tasks:
                    if old_text in task["text"].lower() or task["text"].lower() in old_text:
                        todo_service.update_todo(task["id"], new_text)
                        matched = task
                        break
                if matched:
                    print(f"[Agent] Updated task: {matched['text']} → {new_text}")
                    return {
                        "type": "todo",
                        "response": f"Done! I've updated the task to '{new_text}'.",
                        "data": {"action": "update"}
                    }
                else:
                    return {
                        "type": "todo",
                        "response": f"I couldn't find a task matching '{old_text}'. Say 'show my tasks' to see your list.",
                        "data": None
                    }
            else:
                return {
                    "type": "chat",
                    "response": "To update a task, say: 'update task <old name> to <new name>'.",
                    "data": None
                }

    # ── TO-DO: DELETE ──────────────────────────────────────────────────────────    delete_keywords = ["delete task", "remove task", "complete task", "done with", "finish task", "mark done"]
    for kw in delete_keywords:
        if kw in msg:
            tasks = todo_service.list_todos()
            if not tasks:
                return {"type": "todo", "response": "You have no tasks to delete.", "data": None}

            # Try to match by task text contained in the user's message
            deleted = None
            for task in tasks:
                if task["text"].lower() in msg:
                    todo_service.delete_todo(task["id"])
                    deleted = task
                    break

            # Fallback: extract the word(s) after the keyword and fuzzy-match
            if not deleted:
                search_term = _extract_after(message, kw).lower()
                if search_term:
                    for task in tasks:
                        if search_term in task["text"].lower() or task["text"].lower() in search_term:
                            todo_service.delete_todo(task["id"])
                            deleted = task
                            break

            if deleted:
                print(f"[Agent] Deleted task: {deleted['text']}")
                return {
                    "type": "todo",
                    "response": f"Done! I've removed '{deleted['text']}' from your list.",
                    "data": {"action": "delete", "task": deleted}
                }
            else:
                task_names = ", ".join([t["text"] for t in tasks])
                return {
                    "type": "todo",
                    "response": f"I couldn't find that task. Your current tasks are: {task_names}. Please say the exact task name.",
                    "data": {"action": "list", "tasks": tasks}
                }

    # ── MEMORY: SAVE ───────────────────────────────────────────────────────────
    save_keywords = ["remember", "don't forget", "note that", "keep in mind", "save that"]
    for kw in save_keywords:
        if kw in msg:
            content = _extract_after(message, kw)
            if not content:
                return {"type": "chat", "response": "What would you like me to remember?", "data": None}
            mem = memory_service.save_memory(content)
            print(f"[Agent] Saved memory: {content}")
            return {
                "type": "memory",
                "response": f"Got it! I'll remember: '{content}'.",
                "data": {"action": "save", "memory": mem}
            }

    # ── MEMORY: RECALL ─────────────────────────────────────────────────────────
    recall_keywords = ["what did i tell", "what do you remember", "what did i say",
                       "recall", "my info", "what do you know about me", "show memory",
                       "list memory", "my memories"]
    if any(kw in msg for kw in recall_keywords):
        response_text = memory_service.get_memories_as_text()
        print(f"[Agent] Recalling memories")
        return {
            "type": "memory",
            "response": response_text,
            "data": {"action": "list", "memories": memory_service.list_memories()}
        }

    # ── GOODBYE ────────────────────────────────────────────────────────────────
    if any(kw in msg for kw in ["bye", "goodbye", "see you", "take care", "exit", "quit"]):
        return {
            "type": "chat",
            "response": "Goodbye! It was a pleasure helping you. Take care!",
            "data": None
        }

    # ── THANK YOU ──────────────────────────────────────────────────────────────
    if any(kw in msg for kw in ["thank you", "thanks", "thank u"]):
        return {
            "type": "chat",
            "response": "You're welcome! Let me know if you need anything else.",
            "data": None
        }

    # ── HELP ───────────────────────────────────────────────────────────────────
    if any(kw in msg for kw in ["help", "what can you do", "capabilities", "commands"]):
        return {
            "type": "chat",
            "response": (
                "Here's what I can do: "
                "Say 'add task buy milk' to add a task. "
                "Say 'show my tasks' to list tasks. "
                "Say 'delete task buy milk' to remove a task. "
                "Say 'remember my exam is Monday' to save a memory. "
                "Say 'what did I say' to recall memories."
            ),
            "data": None
        }

    # ── DEFAULT: natural fallback (NO static "I heard you say" message) ────────
    # Give a context-aware response based on what the user might have meant.
    task_count = todo_service.get_todo_count()
    mem_count = len(memory_service.list_memories())

    if task_count > 0 or mem_count > 0:
        return {
            "type": "chat",
            "response": (
                f"I'm not sure how to help with that. "
                f"You currently have {task_count} task{'s' if task_count != 1 else ''} "
                f"and {mem_count} saved memor{'ies' if mem_count != 1 else 'y'}. "
                "Say 'help' to see what I can do."
            ),
            "data": None
        }

    return {
        "type": "chat",
        "response": "I'm not sure how to help with that. Say 'help' to see what I can do, or try 'add task', 'show tasks', or 'remember something'.",
        "data": None
    }
