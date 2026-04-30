"""
LLM Agent Service — Groq-powered Doraemon brain.
Uses Llama-3 with function calling to decide tool vs conversation.
This is the PRIMARY engine when GROQ_API_KEY is set.
"""
import os
import json
from groq import Groq
from services import todo_service, memory_service

# ── System prompt ──────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are Doraemon, a smart and friendly AI assistant.

You can:
- Manage a To-Do list (add, show, update, delete tasks)
- Remember important user information
- Answer conversationally

Rules:
- Understand user intent from natural language — never rely on exact keywords
- Call the right tool when the user wants an action
- Respond naturally and concisely (1-2 sentences max)
- Do NOT say "I heard you say" or "Try saying"
- Only greet when user says hi / hello / hey / doraemon
- After executing a tool, confirm the action clearly
- If unsure, ask a short clarifying question

Examples of natural responses:
- "Done, added 'buy milk' to your tasks."
- "Here are your tasks: buy milk, call mom."
- "Got it, I'll remember that."
- "Removed 'buy milk' from your list."
"""

# ── Tool definitions for Groq function calling ─────────────────────────────────
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "add_todo",
            "description": "Add a new task to the to-do list. Call this when the user wants to add, create, or schedule a task.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task": {
                        "type": "string",
                        "description": "The task description to add"
                    }
                },
                "required": ["task"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_todos",
            "description": "Get all current to-do tasks. Call this when the user asks to see, list, or show their tasks.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_todo",
            "description": "Update an existing task's text. Call this when the user wants to edit, change, or rename a task.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "The ID of the task to update"
                    },
                    "new_text": {
                        "type": "string",
                        "description": "The new task description"
                    }
                },
                "required": ["task_id", "new_text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_todo",
            "description": "Delete a task from the to-do list. Call this when the user wants to remove, delete, or mark a task as done.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "The ID of the task to delete"
                    }
                },
                "required": ["task_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "save_memory",
            "description": "Save important information about the user. Call this when the user shares personal info, preferences, or asks you to remember something.",
            "parameters": {
                "type": "object",
                "properties": {
                    "content": {
                        "type": "string",
                        "description": "The information to remember"
                    }
                },
                "required": ["content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_memories",
            "description": "Retrieve all stored memories about the user. Call this when the user asks what you remember or recall about them.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    }
]


def _execute_tool(name: str, args: dict) -> str:
    """Execute a tool call and return a string result for the LLM."""
    try:
        if name == "add_todo":
            task = todo_service.add_todo(args["task"])
            return json.dumps({"success": True, "task": task})

        elif name == "list_todos":
            tasks = todo_service.list_todos()
            return json.dumps({"success": True, "tasks": tasks, "count": len(tasks)})

        elif name == "update_todo":
            updated = todo_service.update_todo(args["task_id"], args["new_text"])
            if updated:
                return json.dumps({"success": True, "task": updated})
            return json.dumps({"success": False, "error": "Task not found"})

        elif name == "delete_todo":
            # Support matching by ID or by description text
            task_id = args["task_id"]
            # Try direct ID delete first
            if todo_service.delete_todo(task_id):
                return json.dumps({"success": True, "deleted_id": task_id})
            # Fallback: match by text (LLM sometimes passes description as ID)
            for task in todo_service.list_todos():
                if task_id.lower() in task["text"].lower():
                    todo_service.delete_todo(task["id"])
                    return json.dumps({"success": True, "deleted_task": task["text"]})
            return json.dumps({"success": False, "error": "Task not found"})

        elif name == "save_memory":
            mem = memory_service.save_memory(args["content"])
            return json.dumps({"success": True, "memory": mem})

        elif name == "get_memories":
            memories = memory_service.list_memories()
            return json.dumps({"success": True, "memories": memories, "count": len(memories)})

        else:
            return json.dumps({"success": False, "error": f"Unknown tool: {name}"})

    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})


def _build_task_context() -> str:
    """Inject current task list so LLM can match by name."""
    tasks = todo_service.list_todos()
    if not tasks:
        return "Current tasks: (none)"
    lines = ["Current tasks (use these IDs for update/delete):"]
    for t in tasks:
        lines.append(f'  - ID: "{t["id"]}" | Task: "{t["text"]}"')
    return "\n".join(lines)


# ── Session conversation history ───────────────────────────────────────────────
_sessions: dict = {}


def process_message(message: str, session_id: str = "default") -> dict:
    """
    Process a user message using Groq LLM with function calling.
    Returns: { type, response, data }
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not set")

    client = Groq(api_key=api_key)

    # Init session
    if session_id not in _sessions:
        _sessions[session_id] = []

    # Build messages
    task_context = _build_task_context()
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": task_context},
    ]

    # Inject recent memories as context
    memories = memory_service.list_memories()
    if memories:
        mem_text = "What I remember about the user:\n" + "\n".join(f"- {m['content']}" for m in memories[-5:])
        messages.append({"role": "system", "content": mem_text})

    # Add conversation history (last 10 turns)
    messages.extend(_sessions[session_id][-10:])
    messages.append({"role": "user", "content": message})

    print(f"[LLM] Processing: {message}")

    # ── First LLM call: decide tool or respond ─────────────────────────────────
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            temperature=0.4,
            max_tokens=512
        )
    except Exception as e:
        print(f"[LLM Error] {e}")
        # Fallback to no-tool call
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.4,
            max_tokens=512
        )

    assistant_msg = response.choices[0].message

    # ── No tool calls → pure conversation ─────────────────────────────────────
    if not assistant_msg.tool_calls:
        reply = assistant_msg.content or "I'm here to help!"
        _update_history(session_id, message, reply)
        return {"type": "chat", "response": reply, "data": None}

    # ── Execute tool calls ─────────────────────────────────────────────────────
    tool_messages = []
    tool_names = []

    for tc in assistant_msg.tool_calls:
        name = tc.function.name
        try:
            args = json.loads(tc.function.arguments)
        except Exception:
            args = {}

        print(f"[Tool] {name}({args})")
        result = _execute_tool(name, args)
        tool_names.append(name)

        tool_messages.append({
            "role": "tool",
            "tool_call_id": tc.id,
            "content": result
        })

    # ── Second LLM call: generate natural language response from tool results ──
    messages.append(assistant_msg)
    messages.extend(tool_messages)

    try:
        final = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.4,
            max_tokens=256
        )
        reply = final.choices[0].message.content or "Done!"
    except Exception as e:
        print(f"[LLM Final Error] {e}")
        reply = _fallback_response(tool_names, tool_messages)

    _update_history(session_id, message, reply)

    # Determine response type
    rtype = "chat"
    if any(n in ["add_todo", "list_todos", "update_todo", "delete_todo"] for n in tool_names):
        rtype = "todo"
    elif any(n in ["save_memory", "get_memories"] for n in tool_names):
        rtype = "memory"

    return {"type": rtype, "response": reply, "data": {"tools_used": tool_names}}


def _update_history(session_id: str, user_msg: str, assistant_msg: str):
    """Keep last 20 messages per session."""
    if session_id not in _sessions:
        _sessions[session_id] = []
    _sessions[session_id].append({"role": "user", "content": user_msg})
    _sessions[session_id].append({"role": "assistant", "content": assistant_msg})
    _sessions[session_id] = _sessions[session_id][-20:]


def _fallback_response(tool_names: list, tool_messages: list) -> str:
    """Simple fallback if second LLM call fails."""
    for tm in tool_messages:
        try:
            data = json.loads(tm["content"])
            if not data.get("success"):
                return f"Something went wrong: {data.get('error', 'unknown error')}"
        except Exception:
            pass

    name = tool_names[0] if tool_names else ""
    if name == "add_todo":
        return "Done, task added."
    elif name == "list_todos":
        return "Here are your tasks."
    elif name == "update_todo":
        return "Task updated."
    elif name == "delete_todo":
        return "Task removed."
    elif name == "save_memory":
        return "Got it, I'll remember that."
    elif name == "get_memories":
        return "Here's what I remember."
    return "Done!"
