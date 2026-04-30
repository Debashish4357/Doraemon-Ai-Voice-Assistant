"""
Agent Routes — Main chat endpoint that drives Doraemon's intelligence.
Supports both rule-based and LLM-powered modes.
"""
import os
from fastapi import APIRouter
from pydantic import BaseModel
from services import agent_service

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    use_llm: bool = False  # Set to True to use Groq LLM mode


@router.post("/chat")
def chat(req: ChatRequest):
    """
    Receive user message, process intent, return structured response.
    
    Modes:
    - use_llm=False: Rule-based pattern matching (default, no API key needed)
    - use_llm=True: Groq LLM with function calling (requires GROQ_API_KEY)
    
    Response: { type: 'chat'|'todo'|'memory', response: str, data: any }
    """
    if not req.message.strip():
        return {
            "type": "chat",
            "response": "I didn't catch that. Could you please repeat?",
            "data": None
        }
    
    # Check if LLM mode is requested and available
    if req.use_llm and os.getenv("GROQ_API_KEY"):
        try:
            from services.llm_agent_service import get_llm_agent
            llm_agent = get_llm_agent()
            result = llm_agent.process_message(req.message)
            return result
        except Exception as e:
            print(f"[LLM Mode Error] {e}, falling back to rule-based")
            # Fall through to rule-based mode
    
    # Default: Rule-based mode
    result = agent_service.process_message(req.message)
    return result


@router.get("/mode")
def get_mode():
    """Check which agent mode is available."""
    has_groq = bool(os.getenv("GROQ_API_KEY"))
    return {
        "rule_based": True,
        "llm_powered": has_groq,
        "default_mode": "llm" if has_groq else "rule_based",
        "model": "llama-3.3-70b-versatile" if has_groq else "pattern_matching"
    }
