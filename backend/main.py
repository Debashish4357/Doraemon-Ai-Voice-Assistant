"""
Doraemon AI Voice Agent - Backend Entry Point
FastAPI server with CORS, routing, and startup greeting.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()
from routes import todo, memory, agent

app = FastAPI(
    title="Doraemon AI Voice Agent",
    description="A friendly voice-based AI assistant with To-Do and Memory management.",
    version="2.0.0"
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# allow_origins=["*"] is INCOMPATIBLE with allow_credentials=True in browsers.
# We use allow_credentials=False (default) and allow all origins safely.
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
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

@app.get("/health")
def health():
    return {"status": "ok"}
