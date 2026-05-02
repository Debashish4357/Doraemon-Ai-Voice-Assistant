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
SYSTEM_PROMPT = """You are Doraemon, a smart AI assistant.

You can:
1. Manage a To-Do list (add, show, delete tasks)
2. Remember important user information
3. Answer conversationally

Rules:
* Understand user intent from natural language
* Call tools when needed. If the user tells you a fact or asks you to remember something, YOU MUST CALL THE saveMemory TOOL.
* Respond naturally (no scripted lines)
* Do NOT say 'I heard you say'
* Only greet when user says hi/hello/hey/doraemon
* NEVER speak or show the raw Task ID (numbers) in your response. Just say the task name.

Always decide:
* Should I call a tool?
* Or respond normally?
"""

# ── Tool definitions for Groq function calling ─────────────────────────────────
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "addTodo",
            "description": "Add a task to the list. Call this when the user says 'add task', 'remind me to', or 'create a to-do'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task": {"type": "string"}
                },
                "required": ["task"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "getTodos",
            "description": "Show all tasks. Call this when the user asks what their tasks are.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "updateTodo",
            "description": "Update an existing task's text. Call this to change or rename a task.",
            "parameters": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "new_text": {"type": "string"}
                },
                "required": ["id", "new_text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "deleteTodo",
            "description": "Delete a task by ID or name. Call this when the user finishes or removes a task.",
            "parameters": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"}
                },
                "required": ["id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "saveMemory",
            "description": "Save important information about the user. CALL THIS TOOL IMMEDIATELY whenever the user says 'remember...', 'my name is', or tells you a fact to keep.",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {"type": "string"}
                },
                "required": ["text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "getMemory",
            "description": "Retrieve all stored memories. Call this when the user asks what you remember or recall.",
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
        if name == "addTodo":
            # Handle potential variation in argument naming by LLM
            task_text = args.get("task") or args.get("text") or args.get("description") or ""
            if not task_text:
                return json.dumps({"success": False, "error": "No task text provided"})
            task = todo_service.add_todo(task_text)
            return json.dumps({"success": True, "task": task})

        elif name == "getTodos":
            tasks = todo_service.list_todos()
            return json.dumps({"success": True, "tasks": tasks, "count": len(tasks)})

        elif name == "updateTodo":
            task_id = args.get("id") or args.get("task_id") or ""
            new_text = args.get("new_text") or args.get("text") or args.get("task") or ""
            
            # Try direct ID
            updated = todo_service.update_todo(task_id, new_text)
            if updated:
                return json.dumps({"success": True, "task": updated})
            
            # Fallback text match
            for task in todo_service.list_todos():
                if task_id.lower() in task["text"].lower():
                    updated = todo_service.update_todo(task["id"], new_text)
                    return json.dumps({"success": True, "task": updated})
            return json.dumps({"success": False, "error": "Task not found"})

        elif name == "deleteTodo":
            # Support matching by ID or by description text
            task_id = args.get("id") or args.get("task_id") or args.get("task") or ""
            if not task_id:
                return json.dumps({"success": False, "error": "No task id provided"})
            
            # Try direct ID delete first
            if todo_service.delete_todo(task_id):
                return json.dumps({"success": True, "deleted_id": task_id})
            # Fallback: match by text (LLM sometimes passes description as ID)
            for task in todo_service.list_todos():
                if task_id.lower() in task["text"].lower():
                    todo_service.delete_todo(task["id"])
                    return json.dumps({"success": True, "deleted_task": task["text"]})
            return json.dumps({"success": False, "error": "Task not found"})

        elif name == "saveMemory":
            mem_text = args.get("text") or args.get("content") or args.get("memory") or ""
            if not mem_text:
                return json.dumps({"success": False, "error": "No memory text provided"})
            mem = memory_service.save_memory(mem_text)
            return json.dumps({"success": True, "memory": mem})

        elif name == "getMemory":
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
    if any(n in ["addTodo", "getTodos", "updateTodo", "deleteTodo"] for n in tool_names):
        rtype = "todo"
    elif any(n in ["saveMemory", "getMemory"] for n in tool_names):
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
    if name == "addTodo":
        return "Done, task added."
    elif name == "getTodos":
        return "Here are your tasks."
    elif name == "updateTodo":
        return "Task updated."
    elif name == "deleteTodo":
        return "Task removed."
    elif name == "saveMemory":
        return "Got it, I'll remember that."
    elif name == "getMemory":
        return "Here's what I remember."
    return "Done!"
