"""
Doraemon AI Voice Agent - Backend Entry Point
FastAPI server with CORS, routing, and startup greeting.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import todo, memory, agent

app = FastAPI(
    title="Doraemon AI Voice Agent",
    description="A friendly voice-based AI assistant with To-Do and Memory management.",
    version="2.0.0"
)

# Allow React frontend (any origin in dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(todo.router, prefix="/todo", tags=["To-Do"])
app.include_router(memory.router, prefix="/memory", tags=["Memory"])
app.include_router(agent.router, prefix="/agent", tags=["Agent"])


@app.get("/")
def root():
    return {"message": "Doraemon AI Agent is online. Visit /docs for API reference."}
