"""
Agent Routes — Doraemon's main chat endpoint.
Automatically uses Groq LLM when GROQ_API_KEY is set, falls back to rule-based.
"""
import os
from fastapi import APIRouter
from pydantic import BaseModel
from services import agent_service

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"


@router.post("/chat")
def chat(req: ChatRequest):
    """
    Process user message and return agent response.
    Auto-selects LLM mode if GROQ_API_KEY is available.
    Response: { type: 'chat'|'todo'|'memory', response: str, data: any }
    """
    msg = req.message.strip()
    if not msg:
        return {"type": "chat", "response": "I didn't catch that.", "data": None}

    # ── Try LLM mode first ─────────────────────────────────────────────────────
    if os.getenv("GROQ_API_KEY"):
        try:
            from services.llm_agent_service import process_message as llm_process
            result = llm_process(msg, session_id=req.session_id)
            return result
        except Exception as e:
            print(f"[LLM Error] {e} — falling back to rule-based")

    # ── Rule-based fallback ────────────────────────────────────────────────────
    return agent_service.process_message(msg)


@router.get("/mode")
def get_mode():
    """Return current agent mode."""
    has_groq = bool(os.getenv("GROQ_API_KEY"))
    return {
        "llm_powered": has_groq,
        "rule_based": True,
        "active_mode": "llm" if has_groq else "rule_based",
        "model": "llama-3.3-70b-versatile" if has_groq else "pattern_matching"
    }
