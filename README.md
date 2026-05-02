# 🤖 Doraemon - Voice-Based AI Agent

A fully functional voice-based AI assistant with To-Do management and memory capabilities. Talk to Doraemon using your voice, and it will respond naturally while helping you manage tasks and remember important information.

## 🎯 Features

### ✅ Voice Interaction
- **Speech Recognition**: Speak naturally to the agent
- **Speech Synthesis**: Agent responds with voice
- **Continuous Conversation**: Seamless back-and-forth dialogue
- **Visual Feedback**: Real-time status indicators (Listening, Thinking, Speaking)

### 📝 To-Do Management
- **Add Tasks**: "Add task buy groceries"
- **List Tasks**: "Show my tasks"
- **Delete Tasks**: "Delete task buy groceries"
- Real-time task display in sidebar

### 🧠 Memory System
- **Save Information**: "Remember my exam is Monday"
- **Recall Information**: "What did I tell you?"
- Persistent memory during session

### 💬 Natural Conversation
- Friendly personality
- Context-aware responses
- Conversational fallbacks
- Greeting and farewell handling

## 🏗️ Architecture

```
├── backend/                 # FastAPI Python Backend
│   ├── main.py             # Entry point with CORS
│   ├── routes/             # API endpoints
│   │   ├── agent.py        # /agent/chat
│   │   ├── todo.py         # /todo/*
│   │   └── memory.py       # /memory/*
│   ├── services/           # Business logic
│   │   ├── agent_service.py    # Intent parsing & routing
│   │   ├── todo_service.py     # Task management
│   │   └── memory_service.py   # Memory storage
│   └── requirements.txt
│
└── frontend/               # React + Vite Frontend
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   └── DoraemonAgent.jsx   # Main voice UI
    │   └── index.css               # Styling
    └── package.json
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** (for backend)
- **Node.js 16+** (for frontend)
- **Chrome/Edge browser** (for Web Speech API support)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment (optional but recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the server:
```bash
uvicorn main:app --reload
```

✅ Backend will run on: **http://localhost:8000**
📚 API docs available at: **http://localhost:8000/docs**

### Frontend Setup

1. Open a new terminal and navigate to frontend:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

✅ Frontend will run on: **http://localhost:5173**

### Access the Application

Open your browser and go to: **http://localhost:5173**

## 🎤 How to Use

### Starting a Conversation

1. **Click the blue orb** or the **🎤 microphone button**
2. Doraemon will greet you: *"Hi! I'm Doraemon, your AI assistant!"*
3. Start speaking when you see **"Listening..."**

### Voice Commands

#### Task Management
```
"Add task buy groceries"
"Add task call mom"
"Show my tasks"
"List my tasks"
"Delete task buy groceries"
"Complete task call mom"
```

#### Memory
```
"Remember my exam is on Monday"
"Remember I like pizza"
"What did I tell you?"
"What do you remember about me?"
```

#### General
```
"Hello" / "Hi"
"Help"
"What can you do?"
"Goodbye" / "Thank you" (ends conversation)
```

### Stopping the Conversation

Say any of these:
- "Goodbye"
- "Thank you"
- "Bye"
- "Exit"
- "Stop"

Or click the **⏹ stop button**

## 🧠 Agent Intelligence

The agent uses **rule-based NLP** (no external AI API needed) to understand intent:

### Intent Detection
- **Keyword matching**: Detects phrases like "add task", "show tasks", "remember"
- **Context extraction**: Extracts task text or memory content
- **Smart routing**: Dispatches to appropriate service (todo/memory/chat)

### Response Format
```json
{
  "type": "chat" | "todo" | "memory",
  "response": "Natural language response",
  "data": {
    "action": "add" | "list" | "delete" | "save",
    "task": {...},
    "tasks": [...],
    "memory": {...}
  }
}
```

## 📡 API Endpoints

### Agent
- `POST /agent/chat` - Main conversation endpoint
  ```json
  { "message": "add task buy milk" }
  ```

### To-Do
- `POST /todo/add` - Add a task
  ```json
  { "task": "Buy groceries" }
  ```
- `GET /todo/list` - List all tasks
- `DELETE /todo/delete/{id}` - Delete a task

### Memory
- `POST /memory/save` - Save a memory
  ```json
  { "content": "My exam is Monday" }
  ```
- `GET /memory/list` - List all memories

## 🎨 UI Components

### Main Voice Panel
- **Animated Orb**: Visual indicator with ripple effects
- **Status Badge**: Shows current state (Idle/Listening/Thinking/Speaking)
- **Transcript Box**: Displays what you said
- **Response Box**: Shows Doraemon's reply
- **Quick Commands**: Reference guide

### Sidebar
- **Tasks Section**: Live task list with delete buttons
- **Memory Section**: Stored memories
- **Conversation Log**: Full chat history

## 🔧 Technical Details

### Frontend Technologies
- **React 19** with Hooks
- **Web Speech API**
  - `SpeechRecognition` for voice input
  - `SpeechSynthesis` for voice output
- **Vite** for fast development
- **CSS3** with animations

### Backend Technologies
- **FastAPI** - Modern Python web framework
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server
- **In-memory storage** - No database needed

### Browser Compatibility
- ✅ Chrome/Edge (full support)
- ⚠️ Firefox (limited speech synthesis)
- ❌ Safari (no speech recognition)

## 🎯 Sample Interactions

```
User: "Add task buy groceries"
Doraemon: "Got it! I've added 'buy groceries' to your task list."

User: "Show my tasks"
Doraemon: "You have 1 task: buy groceries."

User: "Remember my exam is Monday"
Doraemon: "I'll remember that: 'my exam is Monday'."

User: "What did I tell you?"
Doraemon: "Here is what I remember about you:
- my exam is Monday"

User: "Delete task buy groceries"
Doraemon: "Done! I've removed 'buy groceries' from your list."

User: "Thank you"
Doraemon: "Goodbye! It was a pleasure helping you. Take care! 👋"
```

## 🐛 Troubleshooting

### Microphone Not Working
- Check browser permissions (allow microphone access)
- Use Chrome or Edge browser
- Ensure microphone is not used by another app

### Backend Connection Error
- Verify backend is running on port 8000
- Check CORS settings in `main.py`
- Ensure no firewall blocking

### Speech Recognition Not Starting
- Refresh the page
- Check browser console for errors
- Try saying something after clicking the mic

### No Voice Output
- Check system volume
- Verify browser has audio permissions
- Try a different browser voice in settings

## 📝 Development Notes

### Adding New Intents
Edit `backend/services/agent_service.py`:
```python
if any(kw in msg for kw in ["your", "keywords"]):
    # Your logic here
    return {
        "type": "chat",
        "response": "Your response",
        "data": None
    }
```

### Customizing Voice
Edit `frontend/src/components/DoraemonAgent.jsx`:
```javascript
utterance.rate = 1.0;   // Speed (0.1 to 10)
utterance.pitch = 1.1;  // Pitch (0 to 2)
utterance.volume = 1.0; // Volume (0 to 1)
```

### Styling
All styles are in `frontend/src/index.css` using CSS variables for easy theming.

## 🚀 Production Deployment

### Backend
```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
npm run build
# Serve the 'dist' folder with any static server
```

### Environment Variables
Create `.env` files if needed:
- `backend/.env` - Backend config
- `frontend/.env` - Frontend config (API URL)


---

**Enjoy talking to Doraemon! 🤖✨**
