# 📚 Doraemon AI Voice Agent - Technical Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Backend Details](#backend-details)
4. [Frontend Details](#frontend-details)
5. [API Reference](#api-reference)
6. [Voice System](#voice-system)
7. [Agent Logic](#agent-logic)
8. [Data Flow](#data-flow)
9. [Customization Guide](#customization-guide)

---

## System Overview

Doraemon is a voice-based AI assistant that combines:
- **Speech Recognition** (voice input)
- **Natural Language Understanding** (intent parsing)
- **Task Management** (to-do CRUD operations)
- **Memory System** (user information storage)
- **Speech Synthesis** (voice output)

### Key Characteristics
- ✅ **No External AI API**: Pure rule-based NLP
- ✅ **In-Memory Storage**: No database required
- ✅ **Real-Time**: Instant response and updates
- ✅ **Browser-Based**: Uses Web Speech API
- ✅ **Modular**: Clean separation of concerns

---

## Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                         BROWSER                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React Frontend (Port 5173)                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │ Speech       │  │ DoraemonAgent│  │ UI          │ │ │
│  │  │ Recognition  │→ │ Component    │→ │ Components  │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  │         ↓                  ↓                  ↑        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │         Fetch API (HTTP Requests)                │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
                         HTTP/JSON
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (Port 8000)               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Routes Layer                                          │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │ │
│  │  │ /agent   │  │ /todo    │  │ /memory          │   │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────────────┘   │ │
│  └───────┼─────────────┼─────────────┼──────────────────┘ │
│          ↓             ↓             ↓                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Services Layer                                        │ │
│  │  ┌──────────────┐  ┌──────────┐  ┌──────────────┐   │ │
│  │  │ Agent        │  │ Todo     │  │ Memory       │   │ │
│  │  │ Service      │→ │ Service  │  │ Service      │   │ │
│  │  └──────────────┘  └──────────┘  └──────────────┘   │ │
│  └────────────────────────────────────────────────────────┘ │
│                              ↓                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  In-Memory Storage                                     │ │
│  │  ┌──────────────┐  ┌──────────────────────────────┐  │ │
│  │  │ _todos: {}   │  │ _memories: []                │  │ │
│  │  └──────────────┘  └──────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Backend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | FastAPI | REST API server |
| Server | Uvicorn | ASGI server |
| Validation | Pydantic | Request/response models |
| Storage | Python dict/list | In-memory data |
| Language | Python 3.8+ | Backend logic |

#### Frontend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | React 19 | UI components |
| Build Tool | Vite | Fast development |
| Speech Input | Web Speech API | Voice recognition |
| Speech Output | Speech Synthesis | Voice generation |
| Styling | CSS3 | UI design |
| HTTP Client | Fetch API | Backend communication |

---

## Backend Details

### Project Structure
```
backend/
├── main.py                 # FastAPI app entry point
├── routes/                 # API endpoints
│   ├── __init__.py
│   ├── agent.py           # POST /agent/chat
│   ├── todo.py            # /todo/* endpoints
│   └── memory.py          # /memory/* endpoints
├── services/              # Business logic
│   ├── __init__.py
│   ├── agent_service.py   # Intent parsing & routing
│   ├── todo_service.py    # Task CRUD operations
│   └── memory_service.py  # Memory storage
└── requirements.txt       # Python dependencies
```

### Main Components

#### 1. main.py
```python
# Entry point with CORS configuration
app = FastAPI(title="Doraemon AI Voice Agent")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(todo.router, prefix="/todo")
app.include_router(memory.router, prefix="/memory")
app.include_router(agent.router, prefix="/agent")
```

#### 2. Agent Service (Brain)
The agent service is the core intelligence that:
- Parses user messages
- Detects intent using keyword matching
- Routes to appropriate service
- Returns structured responses

**Intent Detection Flow:**
```
User Message → Lowercase & Strip → Keyword Match → Extract Data → Call Service → Format Response
```

**Supported Intents:**
1. **Add Task**: "add task", "add todo", "create task", "remind me to"
2. **List Tasks**: "show task", "list task", "my task"
3. **Delete Task**: "delete task", "remove task", "complete task"
4. **Save Memory**: "remember", "don't forget", "note that"
5. **Recall Memory**: "what did i tell", "what do you remember"
6. **Greet**: "hello", "hi", "hey"
7. **Goodbye**: "bye", "goodbye", "thank you"
8. **Help**: "help", "what can you do"

#### 3. Todo Service
```python
# In-memory storage
_todos: dict = {}

# Operations
def add_todo(task: str) -> dict
def list_todos() -> list
def delete_todo(task_id: str) -> bool
```

**Task Structure:**
```json
{
  "id": "1714567890123",
  "text": "Buy groceries",
  "created_at": "2024-05-01 14:30"
}
```

#### 4. Memory Service
```python
# In-memory storage
_memories: list = []

# Operations
def save_memory(content: str) -> dict
def list_memories() -> list
def get_memories_as_text() -> str
```

**Memory Structure:**
```json
{
  "id": "1714567890456",
  "content": "My exam is Monday",
  "saved_at": "2024-05-01 14:35"
}
```

---

## Frontend Details

### Project Structure
```
frontend/
├── src/
│   ├── App.jsx                    # Root component
│   ├── main.jsx                   # React entry point
│   ├── index.css                  # Global styles
│   └── components/
│       └── DoraemonAgent.jsx      # Main voice UI
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── package.json
└── vite.config.js
```

### DoraemonAgent Component

#### State Management
```javascript
const [status, setStatus] = useState('idle');        // idle | listening | thinking | speaking
const [isRunning, setIsRunning] = useState(false);   // Conversation active?
const [transcript, setTranscript] = useState('');    // User's speech
const [response, setResponse] = useState('');        // Agent's response
const [todos, setTodos] = useState([]);              // Task list
const [memories, setMemories] = useState([]);        // Memory list
const [log, setLog] = useState([]);                  // Conversation history
```

#### Key Functions

**1. speak(text, onStart, onEnd)**
```javascript
// Uses Web Speech Synthesis API
function speak(text, onStart, onEnd) {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    utterance.volume = 1.0;
    // ... voice selection and event handlers
    window.speechSynthesis.speak(utterance);
  });
}
```

**2. listenAndRespond()**
```javascript
// Single listen-respond cycle
const listenAndRespond = useCallback(() => {
  return new Promise((resolve) => {
    const recognition = new SpeechRecognition();
    recognition.start();
    
    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      // Send to backend
      const res = await fetch(`${API}/agent/chat`, {
        method: 'POST',
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      // Speak response
      await speak(data.response);
      // Check for farewell
      resolve(!isFarewell);
    };
  });
}, []);
```

**3. startConversation()**
```javascript
// Continuous conversation loop
const startConversation = async () => {
  setIsRunning(true);
  
  // Initial greeting
  await speak("Hi! I'm Doraemon...");
  
  // Loop until user says goodbye
  while (!shouldStopRef.current) {
    const shouldContinue = await listenAndRespond();
    if (!shouldContinue) break;
  }
  
  setIsRunning(false);
};
```

---

## API Reference

### Base URL
```
http://localhost:8000
```

### Endpoints

#### 1. Agent Chat
**POST** `/agent/chat`

Process user message and return intelligent response.

**Request:**
```json
{
  "message": "add task buy milk"
}
```

**Response:**
```json
{
  "type": "todo",
  "response": "Got it! I've added 'buy milk' to your task list.",
  "data": {
    "action": "add",
    "task": {
      "id": "1714567890123",
      "text": "buy milk",
      "created_at": "2024-05-01 14:30"
    }
  }
}
```

#### 2. Add Task
**POST** `/todo/add`

**Request:**
```json
{
  "task": "Buy groceries"
}
```

**Response:**
```json
{
  "status": "success",
  "task": {
    "id": "1714567890123",
    "text": "Buy groceries",
    "created_at": "2024-05-01 14:30"
  }
}
```

#### 3. List Tasks
**GET** `/todo/list`

**Response:**
```json
{
  "tasks": [
    {
      "id": "1714567890123",
      "text": "Buy groceries",
      "created_at": "2024-05-01 14:30"
    }
  ],
  "count": 1
}
```

#### 4. Delete Task
**DELETE** `/todo/delete/{task_id}`

**Response:**
```json
{
  "status": "success",
  "deleted_id": "1714567890123"
}
```

#### 5. Save Memory
**POST** `/memory/save`

**Request:**
```json
{
  "content": "My exam is Monday"
}
```

**Response:**
```json
{
  "status": "success",
  "memory": {
    "id": "1714567890456",
    "content": "My exam is Monday",
    "saved_at": "2024-05-01 14:35"
  }
}
```

#### 6. List Memories
**GET** `/memory/list`

**Response:**
```json
{
  "memories": [
    {
      "id": "1714567890456",
      "content": "My exam is Monday",
      "saved_at": "2024-05-01 14:35"
    }
  ],
  "count": 1
}
```

---

## Voice System

### Speech Recognition (Input)

**Browser API:** `SpeechRecognition` / `webkitSpeechRecognition`

**Configuration:**
```javascript
const recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.interimResults = false;  // Only final results
recognition.maxAlternatives = 1;     // Best match only
```

**Events:**
- `onstart`: Recognition started
- `onresult`: Speech detected and transcribed
- `onnomatch`: No speech matched
- `onerror`: Error occurred
- `onend`: Recognition ended

**Browser Support:**
- ✅ Chrome/Edge: Full support
- ⚠️ Firefox: Partial support
- ❌ Safari: Not supported

### Speech Synthesis (Output)

**Browser API:** `SpeechSynthesis`

**Configuration:**
```javascript
const utterance = new SpeechSynthesisUtterance(text);
utterance.rate = 1.0;    // Speed (0.1 - 10)
utterance.pitch = 1.1;   // Pitch (0 - 2)
utterance.volume = 1.0;  // Volume (0 - 1)
utterance.voice = selectedVoice;  // Voice selection
```

**Voice Selection:**
```javascript
const voices = window.speechSynthesis.getVoices();
const preferred = voices.find(v => 
  v.lang === 'en-US' && v.name.includes('Google')
);
```

**Events:**
- `onstart`: Speaking started
- `onend`: Speaking finished
- `onerror`: Error occurred

---

## Agent Logic

### Intent Parsing Algorithm

```python
def process_message(message: str) -> dict:
    msg = message.strip().lower()
    
    # 1. Check for task addition
    if any(msg.startswith(kw) for kw in ["add task", "add todo", ...]):
        task_text = extract_after_keyword(message)
        return add_task_response(task_text)
    
    # 2. Check for task listing
    if any(kw in msg for kw in ["show task", "list task", ...]):
        tasks = get_all_tasks()
        return list_tasks_response(tasks)
    
    # 3. Check for task deletion
    if any(kw in msg for kw in ["delete task", "remove task", ...]):
        task = find_matching_task(msg)
        return delete_task_response(task)
    
    # 4. Check for memory save
    if any(msg.startswith(kw) for kw in ["remember", "don't forget", ...]):
        content = extract_after_keyword(message)
        return save_memory_response(content)
    
    # 5. Check for memory recall
    if any(kw in msg for kw in ["what did i tell", "what do you remember", ...]):
        memories = get_all_memories()
        return recall_memories_response(memories)
    
    # 6. Check for greetings
    if any(kw in msg for kw in ["hello", "hi", "hey", ...]):
        return greeting_response()
    
    # 7. Check for goodbye
    if any(kw in msg for kw in ["bye", "goodbye", "thank you", ...]):
        return goodbye_response()
    
    # 8. Default fallback
    return conversational_fallback(message)
```

### Response Structure

All responses follow this format:
```python
{
    "type": str,      # "chat" | "todo" | "memory"
    "response": str,  # Natural language text
    "data": dict      # Optional structured data
}
```

**Example Responses:**

**Task Added:**
```json
{
  "type": "todo",
  "response": "Got it! I've added 'buy milk' to your task list.",
  "data": {
    "action": "add",
    "task": {...}
  }
}
```

**Memory Recalled:**
```json
{
  "type": "memory",
  "response": "Here is what I remember about you:\n- My exam is Monday",
  "data": {
    "action": "list",
    "memories": [...]
  }
}
```

**Conversational:**
```json
{
  "type": "chat",
  "response": "I heard you say: 'hello'. How can I help you?",
  "data": null
}
```

---

## Data Flow

### Complete Interaction Flow

```
1. USER SPEAKS
   ↓
2. Browser captures audio (SpeechRecognition)
   ↓
3. Audio → Text transcription
   ↓
4. Frontend sends text to backend
   POST /agent/chat { "message": "add task buy milk" }
   ↓
5. Backend receives request
   ↓
6. Agent Service parses intent
   - Detects "add task" keyword
   - Extracts "buy milk"
   ↓
7. Agent calls Todo Service
   todo_service.add_todo("buy milk")
   ↓
8. Todo Service stores task
   _todos["1714567890123"] = { id, text, created_at }
   ↓
9. Todo Service returns task object
   ↓
10. Agent formats response
    { type: "todo", response: "Got it! ...", data: {...} }
    ↓
11. Backend sends JSON response
    ↓
12. Frontend receives response
    ↓
13. Frontend updates UI
    - Updates task list
    - Sets response text
    - Adds to conversation log
    ↓
14. Frontend speaks response (SpeechSynthesis)
    "Got it! I've added 'buy milk' to your task list."
    ↓
15. User hears response
    ↓
16. Loop continues (if conversation active)
```

---

## Customization Guide

### Adding New Intents

**Step 1:** Add keyword detection in `agent_service.py`
```python
# In process_message function
if any(kw in msg for kw in ["your", "new", "keywords"]):
    # Extract relevant data
    data = extract_data(message)
    
    # Call appropriate service
    result = your_service.do_something(data)
    
    # Return formatted response
    return {
        "type": "custom",
        "response": f"I did something with {data}",
        "data": {"action": "custom", "result": result}
    }
```

**Step 2:** Create service if needed
```python
# services/your_service.py
_storage = {}

def do_something(data: str) -> dict:
    # Your logic here
    return {"status": "success"}
```

**Step 3:** Add route if needed
```python
# routes/your_route.py
from fastapi import APIRouter
router = APIRouter()

@router.post("/action")
def action(req: YourRequest):
    result = your_service.do_something(req.data)
    return result
```

### Customizing Voice

**Change voice characteristics:**
```javascript
// In DoraemonAgent.jsx, speak function
utterance.rate = 1.2;    // Faster
utterance.pitch = 0.9;   // Lower pitch
utterance.volume = 0.8;  // Quieter
```

**Select specific voice:**
```javascript
const voices = window.speechSynthesis.getVoices();
const voice = voices.find(v => v.name === "Microsoft David Desktop");
if (voice) utterance.voice = voice;
```

### Customizing UI

**Change colors:**
```css
/* In index.css */
:root {
  --blue: #1a73e8;        /* Primary color */
  --blue-dark: #0f5fc8;   /* Hover state */
  --blue-light: #e8f0fe;  /* Background */
}
```

**Change orb size:**
```css
.orb {
  width: 200px;   /* Larger orb */
  height: 200px;
}
```

**Change animations:**
```css
@keyframes ripple {
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(2.0); opacity: 0; }  /* Bigger ripple */
}
```

### Adding Persistence

**Option 1: JSON File Storage**
```python
# In todo_service.py
import json

def save_to_file():
    with open('todos.json', 'w') as f:
        json.dump(_todos, f)

def load_from_file():
    try:
        with open('todos.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

# Call load_from_file() on startup
# Call save_to_file() after each modification
```

**Option 2: SQLite Database**
```python
import sqlite3

def init_db():
    conn = sqlite3.connect('doraemon.db')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS todos (
            id TEXT PRIMARY KEY,
            text TEXT,
            created_at TEXT
        )
    ''')
    conn.commit()
    conn.close()
```

### Adding Authentication

**Backend:**
```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

def verify_token(credentials = Depends(security)):
    if credentials.credentials != "your-secret-token":
        raise HTTPException(status_code=401)
    return credentials

@router.post("/chat", dependencies=[Depends(verify_token)])
def chat(req: ChatRequest):
    # Protected endpoint
    pass
```

**Frontend:**
```javascript
const res = await fetch(`${API}/agent/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-secret-token'
  },
  body: JSON.stringify({ message: text })
});
```

---

## Performance Optimization

### Backend
- Use async/await for I/O operations
- Implement caching for frequent queries
- Add rate limiting for API endpoints
- Use connection pooling for databases

### Frontend
- Memoize expensive computations with `useMemo`
- Debounce rapid state updates
- Lazy load components
- Optimize re-renders with `React.memo`

---

## Testing

### Backend Testing
```python
# test_agent.py
from services.agent_service import process_message

def test_add_task():
    result = process_message("add task buy milk")
    assert result["type"] == "todo"
    assert "buy milk" in result["response"]

def test_list_tasks():
    result = process_message("show my tasks")
    assert result["type"] == "todo"
    assert "tasks" in result["data"]
```

### Frontend Testing
```javascript
// DoraemonAgent.test.jsx
import { render, screen } from '@testing-library/react';
import DoraemonAgent from './DoraemonAgent';

test('renders mic button', () => {
  render(<DoraemonAgent />);
  const button = screen.getByRole('button');
  expect(button).toBeInTheDocument();
});
```

---

## Deployment

### Backend Deployment (Production)
```bash
# Install production server
pip install gunicorn

# Run with multiple workers
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Serve with nginx or any static server
# Output is in 'dist' folder
```

### Docker Deployment
```dockerfile
# Dockerfile for backend
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Troubleshooting

### Common Issues

**1. CORS Error**
- Ensure backend CORS middleware allows frontend origin
- Check browser console for specific error

**2. Microphone Not Working**
- Grant microphone permissions in browser
- Check if another app is using the microphone
- Try Chrome/Edge browser

**3. Speech Recognition Not Starting**
- Verify browser support (Chrome/Edge only)
- Check for HTTPS (required in production)
- Refresh the page

**4. Backend Connection Failed**
- Verify backend is running on port 8000
- Check firewall settings
- Ensure correct API URL in frontend

**5. Tasks Not Updating**
- Check browser console for errors
- Verify fetchData() is called after operations
- Check network tab for failed requests

---

## Future Enhancements

### Potential Features
1. **Multi-User Support**: User authentication and isolated data
2. **Persistent Storage**: Database integration (PostgreSQL, MongoDB)
3. **Advanced NLP**: Integration with OpenAI/Anthropic for better understanding
4. **Voice Customization**: Multiple voice personalities
5. **Task Scheduling**: Set reminders and due dates
6. **Mobile App**: React Native version
7. **Offline Mode**: Service worker for offline functionality
8. **Analytics**: Track usage patterns and insights
9. **Integrations**: Calendar, email, Slack, etc.
10. **Multi-Language**: Support for multiple languages

---

## Contributing

### Code Style
- Follow PEP 8 for Python
- Use ESLint for JavaScript
- Add docstrings to functions
- Write meaningful commit messages

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit pull request

---

## License

This project is open source and available under the MIT License.

---

## Support

For issues and questions:
- Check this documentation first
- Review the README.md
- Check browser console for errors
- Verify backend logs

---

**Happy Coding! 🚀**
