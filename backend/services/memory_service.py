"""
Memory Service — In-memory storage for user facts.
Each memory: { id, content, saved_at }
"""
import time

# In-memory store
_memories: list = []


def save_memory(content: str) -> dict:
    """Save a new memory item. Returns the saved item."""
    memory = {
        "id": str(int(time.time() * 1000)),
        "content": content,
        "saved_at": time.strftime("%Y-%m-%d %H:%M")
    }
    _memories.append(memory)
    return memory


def list_memories() -> list:
    """Return all stored memories."""
    return list(reversed(_memories))


def get_memories_as_text() -> str:
    """Return memories as a readable string for agent context."""
    if not _memories:
        return "I don't have any memories stored yet."
    items = [f"- {m['content']}" for m in _memories]
    return "Here is what I remember about you:\n" + "\n".join(items)
