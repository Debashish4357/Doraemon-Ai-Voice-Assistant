from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, List
from datetime import datetime

class TodoCreate(BaseModel):
    userId: str
    task: str
    status: str = "open"

class TodoResponse(BaseModel):
    id: str
    userId: str
    task: str
    status: str
    created_at: datetime
    
    model_config = ConfigDict(populate_by_name=True)

class TodoUpdate(BaseModel):
    task: Optional[str] = None
    status: Optional[str] = None

class MemoryCreate(BaseModel):
    userId: str
    content: str

class MemoryResponse(BaseModel):
    id: str
    userId: str
    content: str
    timestamp: datetime
    
    model_config = ConfigDict(populate_by_name=True)

class AgentRequest(BaseModel):
    userId: str
    message: str

class AgentResponse(BaseModel):
    type: str  # "tool" | "memory" | "chat"
    response: str
    data: Optional[Any] = None

class SessionProcessRequest(BaseModel):
    userId: str
    transcript: str
    sessionId: Optional[str] = None
