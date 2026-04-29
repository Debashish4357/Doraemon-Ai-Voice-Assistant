from fastapi import APIRouter
from models.schemas import AgentRequest, AgentResponse
from services import agent_service
import logging

router = APIRouter(prefix="/agent", tags=["Agent Endpoint"])
logger = logging.getLogger(__name__)

@router.post("/chat", response_model=AgentResponse)
async def chat_with_agent(request: AgentRequest):
    logger.info(f"Received agent chat request: {request.message}")
    response = await agent_service.process_message(request)
    logger.info(f"Agent response type: {response.type}")
    return response
