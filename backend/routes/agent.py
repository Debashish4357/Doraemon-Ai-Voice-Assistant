"""
Agent Routes — Doraemon's main chat endpoint.
Automatically uses Groq LLM when GROQ_API_KEY is set, falls back to rule-based.
"""
import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services import agent_service
import logging

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

@router.get("/token")
async def get_openai_token():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set in backend .env")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/realtime/sessions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4o-realtime-preview-2024-10-01",
                    "voice": "alloy",
                },
                timeout=15.0
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        print(f"Error fetching OpenAI token: {e}")
        raise HTTPException(status_code=500, detail=str(e))
