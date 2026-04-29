import os
import json
import logging
from groq import AsyncGroq
from dotenv import load_dotenv
from models.schemas import AgentRequest, AgentResponse, TodoCreate, MemoryCreate
from services import todo_service, memory_service, search_service

load_dotenv()
logger = logging.getLogger(__name__)

# Initialize async Groq client
groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
GROQ_MODEL = "llama3-70b-8192"

SYSTEM_PROMPT = """You are a helpful AI assistant that manages a To-Do list and stores important memories.

When the user sends a message, decide which action to take and respond ONLY with a valid JSON object (no extra text) in this exact format:
{
  "intent": "add_todo" | "list_todos" | "delete_todo" | "save_memory" | "list_memory" | "search" | "chat",
  "response": "Your friendly text response to the user",
  "data": <optional extracted data>
}

Intent rules:
- "add_todo": User wants to add a task/reminder. Extract the task text in "data": {"task": "..."}
- "list_todos": User wants to see their tasks.
- "delete_todo": User wants to delete a task. Note that you don't have the ID, so inform them to use the API.
- "save_memory": User shares important personal info (name, preferences, location, etc.). Extract the content in "data": {"content": "..."}
- "list_memory": User asks what you remember about them.
- "search": User asks a factual question that requires looking up information (e.g., news, facts, current events). Extract the search query in "data": {"query": "..."}
- "chat": General conversation that doesn't match the above.

Always be friendly, concise, and natural."""

async def process_message(request: AgentRequest) -> AgentResponse:
    message = request.message
    logger.info(f"Processing message via Groq ({GROQ_MODEL}): {message}")

    try:
        # Call Groq LLM
        completion = await groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": message}
            ],
            temperature=0.3,
            max_tokens=512,
        )

        raw = completion.choices[0].message.content.strip()
        logger.info(f"Groq raw response: {raw}")

        # Parse the JSON intent response
        parsed = json.loads(raw)
        intent = parsed.get("intent", "chat")
        response_text = parsed.get("response", "I'm not sure how to help with that.")
        data = parsed.get("data", {})

        # Execute the intent
        if intent == "add_todo":
            task_text = data.get("task") if data else message
            new_todo = await todo_service.add_todo(TodoCreate(task=task_text))
            return AgentResponse(
                type="tool",
                response=response_text,
                data={"action": "add_todo", "todo": new_todo.model_dump()}
            )

        elif intent == "list_todos":
            todos = await todo_service.get_all_todos()
            return AgentResponse(
                type="tool",
                response=response_text,
                data={"action": "list_todos", "todos": [t.model_dump() for t in todos]}
            )

        elif intent == "delete_todo":
            return AgentResponse(
                type="tool",
                response=response_text,
                data={"action": "requires_id_for_delete"}
            )

        elif intent == "save_memory":
            content = data.get("content") if data else message
            new_mem = await memory_service.save_memory(MemoryCreate(content=content))
            return AgentResponse(
                type="memory",
                response=response_text,
                data={"action": "save_memory", "memory": new_mem.model_dump()}
            )

        elif intent == "list_memory":
            memories = await memory_service.get_all_memory()
            return AgentResponse(
                type="memory",
                response=response_text,
                data={"action": "list_memory", "memories": [m.model_dump() for m in memories]}
            )

        elif intent == "search":
            query = data.get("query") if data else message
            search_result = await search_service.search_tavily(query)
            return AgentResponse(
                type="tool",
                response=f"I found some information for you: {search_result}",
                data={"action": "search", "query": query, "result": search_result}
            )

        else:
            # General chat
            return AgentResponse(
                type="chat",
                response=response_text,
            )

    except json.JSONDecodeError:
        # LLM didn't return valid JSON — return raw text as chat
        logger.warning("Groq response was not valid JSON, returning as chat.")
        raw_text = completion.choices[0].message.content.strip()
        return AgentResponse(type="chat", response=raw_text)

    except Exception as e:
        logger.error(f"Groq agent error: {e}")
        return AgentResponse(
            type="chat",
            response="Sorry, I encountered an error processing your request. Please try again.",
        )
