from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from datetime import datetime

class TodoCreate(BaseModel):
    task: str

class TodoResponse(BaseModel):
    id: str
    task: str
    created_at: datetime
    
    model_config = ConfigDict(populate_by_name=True)

class TodoUpdate(BaseModel):
    task: str

class MemoryCreate(BaseModel):
    content: str

class MemoryResponse(BaseModel):
    id: str
    content: str
    timestamp: datetime
    
    model_config = ConfigDict(populate_by_name=True)

class AgentRequest(BaseModel):
    message: str

class AgentResponse(BaseModel):
    type: str  # "tool" | "memory" | "chat"
    response: str
    data: Optional[Any] = None
