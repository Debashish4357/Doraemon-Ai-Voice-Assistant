# 🏗️ System Architecture - Doraemon AI Voice Agent

## Overview

Doraemon is a voice-based AI assistant built with a clean separation between frontend (React) and backend (FastAPI), communicating via REST API.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           USER                                   │
│                             ↓                                    │
│                    (Speaks to microphone)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BROWSER (Chrome/Edge)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Web Speech API                                │ │
│  │  ┌──────────────────┐    ┌──────────────────────────┐    │ │
│  │  │ SpeechRecognition│    │ SpeechSynthesis          │    │ │
│  │  │ (Voice → Text)   │    │ (Text → Voice)           │    │ │
│  │  └────────┬─────────┘    └──────────▲───────────────┘    │ │
│  └───────────┼────────────────────────┼────────────────────────┘ │
│              ↓                        ↑                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           React Frontend (Port 5173)                      │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  DoraemonAgent Component                            │ │  │
│  │  │  - State Management (useState)                      │ │  │
│  │  │  - Voice Control Logic                              │ │  │
│  │  │  - UI Rendering                                     │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │              ↓                        ↑                    │  │
│  │         (HTTP POST)              (JSON Response)           │  │
│  └──────────────┼────────────────────────┼───────────────────┘  │
└─────────────────┼────────────────────────┼──────────────────────┘
                  ↓                        ↑
            [Fetch API]              [JSON Data]
                  ↓                        ↑
┌─────────────────────────────────────────────────────────────────┐
│              FastAPI Backend (Port 8000)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Routes Layer                            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐    │ │
│  │  │ /agent   │  │ /todo    │  │ /memory              │    │ │
│  │  │ /chat    │  │ /add     │  │ /save                │    │ │
│  │  │          │  │ /list    │  │ /list                │    │ │
│  │  │          │  │ /delete  │  │                      │    │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────────────────┘    │ │
│  └───────┼─────────────┼─────────────┼────────────────────────┘ │
│          ↓             ↓             ↓                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Services Layer                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Agent Service (Brain)                               │ │ │
│  │  │  - Intent Detection                                  │ │ │
│  │  │  - Keyword Matching                                  │ │ │
│  │  │  - Service Routing                                   │ │ │
│  │  │  - Response Formatting                               │ │ │
│  │  └────────┬─────────────────────────────────────────────┘ │ │
│  │           ↓                                                │ │
│  │  ┌────────────────┐              ┌──────────────────────┐ │ │
│  │  │ Todo Service   │              │ Memory Service       │ │ │
│  │  │ - add_todo()   │              │ - save_memory()      │ │ │
│  │  │ - list_todos() │              │ - list_memories()    │ │ │
│  │  │ - delete_todo()│              │ - get_as_text()      │ │ │
│  │  └────────┬───────┘              └──────────┬───────────┘ │ │
│  └───────────┼──────────────────────────────────┼─────────────┘ │
│              ↓                                  ↓               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  In-Memory Storage                         │ │
│  │  ┌──────────────────┐        ┌────────────────────────┐  │ │
│  │  │ _todos: dict     │        │ _memories: list        │  │ │
│  │  │ {                │        │ [                      │  │ │
│  │  │   "id1": {...},  │        │   {...},               │  │ │
│  │  │   "id2": {...}   │        │   {...}                │  │ │
│  │  │ }                │        │ ]                      │  │ │
│  │  └──────────────────┘        └────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Interaction Flow

### 1. User Speaks → Task Added

```
┌──────┐
│ USER │ "Add task buy milk"
└───┬──┘
    ↓ (speaks)
┌───────────────────┐
│ SpeechRecognition │ Captures audio
└────────┬──────────┘
         ↓ (converts to text)
    "add task buy milk"
         ↓
┌─────────────────┐
│ DoraemonAgent   │ Receives transcript
│ Component       │
└────────┬────────┘
         ↓ (HTTP POST)
    POST /agent/chat
    { "message": "add task buy milk" }
         ↓
┌─────────────────┐
│ Agent Route     │ Receives request
└────────┬────────┘
         ↓ (calls)
┌─────────────────┐
│ Agent Service   │ Parses intent
│                 │ - Detects "add task"
│                 │ - Extracts "buy milk"
└────────┬────────┘
         ↓ (calls)
┌─────────────────┐
│ Todo Service    │ add_todo("buy milk")
│                 │ - Generates ID
│                 │ - Stores in _todos
│                 │ - Returns task object
└────────┬────────┘
         ↓ (returns)
┌─────────────────┐
│ Agent Service   │ Formats response
│                 │ {
│                 │   type: "todo",
│                 │   response: "Got it!...",
│                 │   data: {...}
│                 │ }
└────────┬────────┘
         ↓ (returns)
┌─────────────────┐
│ Agent Route     │ Sends JSON response
└────────┬────────┘
         ↓ (HTTP 200)
┌─────────────────┐
│ DoraemonAgent   │ Receives response
│ Component       │ - Updates state
│                 │ - Updates UI
│                 │ - Calls speak()
└────────┬────────┘
         ↓ (calls)
┌─────────────────┐
│ SpeechSynthesis │ Speaks response
└────────┬────────┘
         ↓ (audio output)
┌──────┐
│ USER │ Hears: "Got it! I've added..."
└──────┘
```

---

## Data Flow Diagram

### Request Flow (Frontend → Backend)

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│                                                              │
│  User Action (Voice/Click)                                  │
│         ↓                                                    │
│  Event Handler                                              │
│         ↓                                                    │
│  State Update (setStatus, setTranscript)                    │
│         ↓                                                    │
│  Fetch API Call                                             │
│         ↓                                                    │
│  HTTP Request                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │ POST /agent/chat                                   │    │
│  │ Headers: { Content-Type: application/json }       │    │
│  │ Body: { "message": "user speech text" }           │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
                    [Network Layer]
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND                                 │
│                                                              │
│  FastAPI Receives Request                                   │
│         ↓                                                    │
│  CORS Middleware (validates origin)                         │
│         ↓                                                    │
│  Route Handler (/agent/chat)                                │
│         ↓                                                    │
│  Pydantic Validation (ChatRequest model)                    │
│         ↓                                                    │
│  Agent Service (process_message)                            │
│         ↓                                                    │
│  Intent Detection (keyword matching)                        │
│         ↓                                                    │
│  Service Call (todo/memory service)                         │
│         ↓                                                    │
│  Data Operation (CRUD on in-memory storage)                 │
│         ↓                                                    │
│  Response Formatting                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │ {                                                  │    │
│  │   "type": "todo",                                  │    │
│  │   "response": "Natural language text",             │    │
│  │   "data": { ... }                                  │    │
│  │ }                                                  │    │
│  └────────────────────────────────────────────────────┘    │
│         ↓                                                    │
│  JSON Serialization                                         │
│         ↓                                                    │
│  HTTP Response (200 OK)                                     │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
                    [Network Layer]
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│                                                              │
│  Fetch Promise Resolves                                     │
│         ↓                                                    │
│  JSON Parsing                                               │
│         ↓                                                    │
│  State Update (setResponse, setTodos, setMemories)          │
│         ↓                                                    │
│  UI Re-render (React)                                       │
│         ↓                                                    │
│  Speech Synthesis (speak response)                          │
│         ↓                                                    │
│  User Hears Response                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## State Management (Frontend)

```
┌─────────────────────────────────────────────────────────────┐
│              DoraemonAgent Component State                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  status: string                                             │
│    - 'idle': Ready to start                                 │
│    - 'listening': Capturing voice                           │
│    - 'thinking': Processing request                         │
│    - 'speaking': Playing response                           │
│                                                              │
│  isRunning: boolean                                         │
│    - true: Conversation loop active                         │
│    - false: Conversation stopped                            │
│                                                              │
│  transcript: string                                         │
│    - Last user speech text                                  │
│                                                              │
│  response: string                                           │
│    - Last agent response text                               │
│                                                              │
│  todos: array                                               │
│    - [{ id, text, created_at }, ...]                        │
│                                                              │
│  memories: array                                            │
│    - [{ id, content, saved_at }, ...]                       │
│                                                              │
│  log: array                                                 │
│    - [{ role, text, id }, ...]                              │
│    - Full conversation history                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘

State Transitions:

idle → listening (user clicks mic)
listening → thinking (speech detected)
thinking → speaking (response received)
speaking → idle (speech finished)
idle → listening (loop continues if isRunning)
```

---

## Backend Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Service (Brain)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  process_message(message: str) → dict                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  1. Normalize Input                                │    │
│  │     - Strip whitespace                             │    │
│  │     - Convert to lowercase                         │    │
│  └────────────────────────────────────────────────────┘    │
│                    ↓                                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  2. Intent Detection (Priority Order)             │    │
│  │     - Add Task                                     │    │
│  │     - List Tasks                                   │    │
│  │     - Delete Task                                  │    │
│  │     - Save Memory                                  │    │
│  │     - Recall Memory                                │    │
│  │     - Greet                                        │    │
│  │     - Goodbye                                      │    │
│  │     - Help                                         │    │
│  │     - Default (Fallback)                           │    │
│  └────────────────────────────────────────────────────┘    │
│                    ↓                                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  3. Extract Data                                   │    │
│  │     - Task text after keyword                      │    │
│  │     - Memory content after keyword                 │    │
│  │     - Task name for deletion                       │    │
│  └────────────────────────────────────────────────────┘    │
│                    ↓                                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  4. Call Service                                   │    │
│  │     - todo_service.add_todo()                      │    │
│  │     - todo_service.list_todos()                    │    │
│  │     - todo_service.delete_todo()                   │    │
│  │     - memory_service.save_memory()                 │    │
│  │     - memory_service.list_memories()               │    │
│  └────────────────────────────────────────────────────┘    │
│                    ↓                                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  5. Format Response                                │    │
│  │     {                                              │    │
│  │       "type": "chat|todo|memory",                  │    │
│  │       "response": "Natural language",              │    │
│  │       "data": { ... }                              │    │
│  │     }                                              │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐      ┌──────────────────────────┐
│   Todo Service       │      │   Memory Service         │
├──────────────────────┤      ├──────────────────────────┤
│                      │      │                          │
│ _todos: dict         │      │ _memories: list          │
│                      │      │                          │
│ add_todo()           │      │ save_memory()            │
│ list_todos()         │      │ list_memories()          │
│ delete_todo()        │      │ get_memories_as_text()   │
│ get_todo_count()     │      │                          │
│                      │      │                          │
└──────────────────────┘      └──────────────────────────┘
```

---

## API Endpoint Structure

```
FastAPI Application
│
├── / (GET)
│   └── Returns: { "message": "Doraemon AI Agent is online..." }
│
├── /docs (GET)
│   └── Returns: Swagger UI (Interactive API documentation)
│
├── /agent
│   └── /chat (POST)
│       ├── Input: { "message": string }
│       └── Output: { "type": string, "response": string, "data": any }
│
├── /todo
│   ├── /add (POST)
│   │   ├── Input: { "task": string }
│   │   └── Output: { "status": string, "task": object }
│   │
│   ├── /list (GET)
│   │   └── Output: { "tasks": array, "count": number }
│   │
│   └── /delete/{task_id} (DELETE)
│       └── Output: { "status": string, "deleted_id": string }
│
└── /memory
    ├── /save (POST)
    │   ├── Input: { "content": string }
    │   └── Output: { "status": string, "memory": object }
    │
    └── /list (GET)
        └── Output: { "memories": array, "count": number }
```

---

## Voice System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Voice Input Pipeline                      │
└─────────────────────────────────────────────────────────────┘

User Speaks
    ↓
Microphone Captures Audio
    ↓
┌─────────────────────────────────────┐
│  Browser SpeechRecognition API      │
│  - Continuous listening             │
│  - Language: en-US                  │
│  - No interim results               │
└─────────────────┬───────────────────┘
                  ↓
         Audio Processing
         (Browser Engine)
                  ↓
         Speech-to-Text
         (Google/Microsoft)
                  ↓
         Text Transcript
                  ↓
    DoraemonAgent Component
                  ↓
         Backend API Call
                  ↓
         Agent Processing
                  ↓
         Response Generated

┌─────────────────────────────────────────────────────────────┐
│                   Voice Output Pipeline                      │
└─────────────────────────────────────────────────────────────┘

Response Text Received
    ↓
┌─────────────────────────────────────┐
│  Browser SpeechSynthesis API        │
│  - Rate: 1.0 (speed)                │
│  - Pitch: 1.1 (tone)                │
│  - Volume: 1.0 (loudness)           │
│  - Voice: en-US (preferred)         │
└─────────────────┬───────────────────┘
                  ↓
         Text-to-Speech
         (Browser Engine)
                  ↓
         Audio Generation
                  ↓
         Speaker Output
                  ↓
         User Hears Response
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
└─────────────────────────────────────────────────────────────┘

Frontend Security:
├── HTTPS (Production)
│   └── Required for SpeechRecognition API
├── Input Validation
│   └── Check for empty/invalid inputs
├── Error Handling
│   └── Graceful degradation on failures
└── CORS Headers
    └── Restrict allowed origins

Backend Security:
├── CORS Middleware
│   ├── Allow specific origins (production)
│   └── Validate credentials
├── Input Validation (Pydantic)
│   ├── Type checking
│   ├── Required fields
│   └── String length limits
├── Error Handling
│   ├── Try-catch blocks
│   ├── HTTP status codes
│   └── Meaningful error messages
└── Rate Limiting (Future)
    └── Prevent abuse

Data Security:
├── In-Memory Storage
│   ├── No persistent data
│   └── Data cleared on restart
├── No Authentication (Current)
│   └── Single-user system
└── No Encryption (Current)
    └── Local development only
```

---

## Scalability Considerations

### Current Architecture (Single User)
```
┌──────────┐
│  User    │
└────┬─────┘
     ↓
┌────────────┐
│  Frontend  │
└────┬───────┘
     ↓
┌────────────┐
│  Backend   │
│ (In-Memory)│
└────────────┘
```

### Future Architecture (Multi-User)
```
┌──────────┐  ┌──────────┐  ┌──────────┐
│  User 1  │  │  User 2  │  │  User 3  │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     ↓             ↓             ↓
┌────────────────────────────────────────┐
│         Load Balancer (Nginx)          │
└────────────────────────────────────────┘
     ↓             ↓             ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Backend  │  │ Backend  │  │ Backend  │
│ Instance │  │ Instance │  │ Instance │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     └─────────────┼─────────────┘
                   ↓
          ┌────────────────┐
          │   Database     │
          │  (PostgreSQL)  │
          └────────────────┘
                   ↓
          ┌────────────────┐
          │     Cache      │
          │    (Redis)     │
          └────────────────┘
```

---

## Deployment Architecture

### Development
```
Localhost:5173 (Frontend)
     ↓
Localhost:8000 (Backend)
     ↓
In-Memory Storage
```

### Production
```
┌─────────────────────────────────────────┐
│           CDN (Cloudflare)              │
│         Static Assets (Frontend)        │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│        Web Server (Nginx)               │
│    - Serve React build                  │
│    - Reverse proxy to backend           │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     Application Server (Gunicorn)       │
│    - Multiple worker processes          │
│    - FastAPI application                │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Database (PostgreSQL)           │
│    - Persistent storage                 │
│    - User data, tasks, memories         │
└─────────────────────────────────────────┘
```

---

## Technology Stack Summary

### Frontend Stack
```
React 19
  ├── Vite (Build Tool)
  ├── Web Speech API
  │   ├── SpeechRecognition
  │   └── SpeechSynthesis
  ├── Fetch API (HTTP Client)
  └── CSS3 (Styling)
```

### Backend Stack
```
Python 3.8+
  ├── FastAPI (Web Framework)
  ├── Uvicorn (ASGI Server)
  ├── Pydantic (Validation)
  └── In-Memory Storage
      ├── dict (Tasks)
      └── list (Memories)
```

### Development Tools
```
├── Git (Version Control)
├── npm (Package Manager)
├── pip (Package Manager)
├── Chrome DevTools (Debugging)
└── Postman/cURL (API Testing)
```

---

## Performance Characteristics

### Response Times
- API Endpoint: < 100ms
- Voice Recognition: 1-2s (browser dependent)
- Voice Synthesis: 2-5s (text length dependent)
- UI Update: < 50ms (React re-render)

### Resource Usage
- Backend Memory: ~50MB (idle)
- Frontend Memory: ~100MB (browser)
- CPU: Minimal (< 5% on modern hardware)
- Network: ~1KB per request

### Scalability Limits (Current)
- Concurrent Users: 1 (in-memory storage)
- Tasks per User: Unlimited (memory limited)
- Memories per User: Unlimited (memory limited)
- Conversation Length: Unlimited (session based)

---

## Future Architecture Enhancements

1. **Database Integration**
   - PostgreSQL for persistent storage
   - Redis for caching and sessions

2. **Authentication & Authorization**
   - JWT tokens
   - User accounts
   - Role-based access

3. **Real-Time Features**
   - WebSocket for live updates
   - Push notifications

4. **Advanced AI**
   - OpenAI/Anthropic integration
   - Better NLP understanding
   - Context awareness

5. **Microservices**
   - Separate services for tasks, memory, AI
   - Message queue (RabbitMQ/Kafka)
   - Service mesh

---

**This architecture provides a solid foundation for a voice-based AI assistant with room for future growth! 🚀**
