from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from db.database import connect_db, close_db
from db.collections import create_indexes
from routes import todo, memory, agent
from utils.helper import setup_logger

# Setup logging
logger = setup_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Voice AI Agent Backend...")
    await connect_db()
    await create_indexes()
    yield
    # Shutdown
    await close_db()
    logger.info("Backend shut down")

app = FastAPI(
    title="Voice-Based AI To-Do Agent API",
    description="A clean, modular backend for an AI agent managing To-Dos and Memory using MongoDB.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(todo.router)
app.include_router(memory.router)
app.include_router(agent.router)

@app.get("/")
def root():
    return {"message": "Welcome to the Voice-Based AI To-Do Agent API. Visit /docs for the API reference."}
