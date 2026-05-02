# 🏗️ Doraemon Voice Agent - Architecture Diagram

## 🎯 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                            │
│                         (Browser - Chrome)                          │
│                                                                     │
│  ┌───────────────────┐  ┌───────────────────┐  ┌────────────────┐ │
│  │   Microphone      │  │     Speaker       │  │    Display     │ │
│  │   (Input)         │  │    (Output)       │  │    (Visual)    │ │
│  └─────────┬─────────┘  └─────────▲─────────┘  └────────▲───────┘ │
│            │                      │                      │          │
│            │ Speech               │ Speech               │ React    │
│            │ Recognition          │ Synthesis            │ Render   │
│            │                      │                      │          │
└────────────┼──────────────────────┼──────────────────────┼──────────┘
             │                      │                      │
             │                      │                      │
┌────────────▼──────────────────────┴──────────────────────┴──────────┐
│                    FRONTEND (React + Vite)                           │
│                   http://localhost:5173                              │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              DoraemonAgent.jsx (Main Component)              │  │
│  │                                                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │  │
│  │  │   Voice     │  │     UI      │  │   State Mgmt     │   │  │
│  │  │   System    │  │   Render    │  │  (React Hooks)   │   │  │
│  │  │             │  │             │  │                  │   │  │
│  │  │ • listen()  │  │ • Orb       │  │ • useState       │   │  │
│  │  │ • speak()   │  │ • Sidebar   │  │ • useEffect      │   │  │
│  │  │ • loop      │  │ • Status    │  │ • useCallback    │   │  │
│  │  └─────────────┘  └─────────────┘  └──────────────────┘   │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                             │                                       │
│                             │ HTTP POST /agent/chat                 │
│                             │ { message: "user text" }              │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                              │ JSON Request
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                  BACKEND (FastAPI + Python)                          │
│                   http://localhost:8000                              │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    main.py (FastAPI App)                     │  │
│  │  • CORS Middleware                                           │  │
│  │  • Route Registration                                        │  │
│  │  • Server Configuration                                      │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                             │                                       │
│  ┌──────────────────────────▼───────────────────────────────────┐  │
│  │                    ROUTES (REST APIs)                        │  │
│  │                                                              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │  │
│  │  │  agent.py    │  │   todo.py    │  │   memory.py      │ │  │
│  │  │              │  │              │  │                  │ │  │
│  │  │ POST /chat   │  │ POST /add    │  │ POST /save       │ │  │
│  │  │              │  │ GET  /list   │  │ GET  /list       │ │  │
│  │  │              │  │ DELETE /:id  │  │                  │ │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────────┘ │  │
│  └─────────┼──────────────────┼──────────────────┼─────────────┘  │
│            │                  │                  │                 │
│  ┌─────────▼──────────────────▼──────────────────▼─────────────┐  │
│  │                    SERVICES (Business Logic)                │  │
│  │                                                             │  │
│  │  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │ agent_service.py │  │ todo_service │  │ memory_service│ │  │
│  │  │                  │  │              │  │              │ │  │
│  │  │ • process_msg()  │  │ • add_todo() │  │ • save_mem() │ │  │
│  │  │ • parse_intent() │  │ • list_todos()│  │ • list_mems()│ │  │
│  │  │ • route_action() │  │ • delete()   │  │ • get_text() │ │  │
│  │  │                  │  │              │  │              │ │  │
│  │  │ [CORE BRAIN]     │  │ [TASKS]      │  │ [MEMORIES]   │ │  │
│  │  └────────┬─────────┘  └──────┬───────┘  └──────┬───────┘ │  │
│  └───────────┼────────────────────┼──────────────────┼─────────┘  │
│              │                    │                  │             │
│  ┌───────────▼────────────────────▼──────────────────▼─────────┐  │
│  │              IN-MEMORY STORAGE (Python Dicts)               │  │
│  │                                                             │  │
│  │  _todos = {                    _memories = [               │  │
│  │    "123": {                      {                         │  │
│  │      id: "123",                    id: "456",              │  │
│  │      text: "buy milk",             content: "exam Monday", │  │
│  │      created_at: "..."             saved_at: "..."         │  │
│  │    }                              }                        │  │
│  │  }                              ]                          │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Diagram

### Example: "Add task buy milk"

```
┌──────────────────────────────────────────────────────────────────┐
│ STEP 1: User speaks                                              │
│ "Add task buy milk"                                              │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 2: Web Speech API (Browser)                                 │
│ SpeechRecognition.onresult                                       │
│ → transcript = "Add task buy milk"                               │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 3: Frontend sends HTTP request                              │
│ POST http://localhost:8000/agent/chat                            │
│ Body: { "message": "Add task buy milk" }                         │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 4: Backend receives request                                 │
│ FastAPI → routes/agent.py → chat()                               │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 5: Agent service processes message                          │
│ agent_service.process_message("Add task buy milk")               │
│                                                                  │
│ 1. Lowercase: "add task buy milk"                               │
│ 2. Pattern match: starts with "add task" ✓                      │
│ 3. Extract text: "buy milk"                                     │
│ 4. Call: todo_service.add_todo("buy milk")                      │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 6: Todo service creates task                                │
│ todo_service.add_todo("buy milk")                                │
│                                                                  │
│ 1. Generate ID: "1714500000000"                                 │
│ 2. Create object: { id, text, created_at }                      │
│ 3. Store: _todos["1714500000000"] = task                        │
│ 4. Return: task object                                          │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 7: Agent service generates response                         │
│ return {                                                         │
│   type: "todo",                                                  │
│   response: "Got it! I've added 'buy milk' to your task list.", │
│   data: { action: "add", task: {...} }                          │
│ }                                                                │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 8: Backend sends JSON response                              │
│ HTTP 200 OK                                                      │
│ Content-Type: application/json                                   │
│ Body: { type, response, data }                                   │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 9: Frontend receives response                               │
│ const data = await res.json()                                    │
│ const agentResponse = data.response                              │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 10: Frontend updates UI                                     │
│ 1. setResponse(agentResponse)                                    │
│ 2. addLog('agent', agentResponse)                                │
│ 3. fetchData() → Update sidebar                                  │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 11: Frontend speaks response                                │
│ speak("Got it! I've added 'buy milk' to your task list.")        │
│ → SpeechSynthesis.speak(utterance)                               │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 12: User hears response                                     │
│ 🔊 "Got it! I've added 'buy milk' to your task list."           │
│ 👁️ Sees task in sidebar                                         │
└──────────────────────────────────────────────────────────────────┘
```

**Total Time:** ~500ms (0.5 seconds)

---

## 🧠 Agent Intelligence Flow

```
┌─────────────────────────────────────────────────────────────┐
│              User Message: "add task buy milk"              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  agent_service.py                           │
│                  process_message()                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Normalize                                           │
│ msg = message.strip().lower()                               │
│ → "add task buy milk"                                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Pattern Matching (if-elif chain)                   │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ IF starts with "add task" → TO-DO ADD                   ││
│ └─────────────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ELIF contains "show task" → TO-DO LIST                  ││
│ └─────────────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ELIF contains "delete task" → TO-DO DELETE              ││
│ └─────────────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ELIF starts with "remember" → MEMORY SAVE               ││
│ └─────────────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ELIF contains "what did i tell" → MEMORY RECALL         ││
│ └─────────────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ELIF contains "hello" → GREET                           ││
│ └─────────────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ELIF contains "bye" → GOODBYE                           ││
│ └─────────────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ELSE → FALLBACK                                         ││
│ └─────────────────────────────────────────────────────────┘│
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼ Match: "add task"
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Extract Parameters                                  │
│ task_text = message[len("add task"):].strip()               │
│ → "buy milk"                                                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Call Service                                        │
│ new_task = todo_service.add_todo("buy milk")                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Generate Response                                   │
│ return {                                                    │
│   type: "todo",                                             │
│   response: "Got it! I've added 'buy milk'...",            │
│   data: { action: "add", task: new_task }                  │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI Component Hierarchy

```
App.jsx
  │
  └── DoraemonAgent.jsx
        │
        ├── Header
        │     ├── Brand (Icon + Name + Tagline)
        │     └── Status (Dot + "System Online")
        │
        ├── Main Voice Panel
        │     ├── Orb Container
        │     │     ├── Ripple Rings (3 animated circles)
        │     │     └── Orb (clickable, state-based color)
        │     │           └── Icon (🤖/🎙️/💭/🔊)
        │     │
        │     ├── Status Badge (Listening/Thinking/Speaking)
        │     │
        │     ├── Transcript Box
        │     │     ├── Label ("You said")
        │     │     └── Text (user speech)
        │     │
        │     ├── Response Box
        │     │     ├── Label ("Doraemon says")
        │     │     └── Text (agent response)
        │     │
        │     ├── Mic Button (Start/Stop)
        │     │
        │     └── Commands Reference
        │           ├── Title ("Try saying:")
        │           └── List (5 example commands)
        │
        └── Sidebar
              ├── Tasks Section
              │     ├── Header (Title + Count)
              │     └── Task List
              │           └── Task Item (Text + Delete Button)
              │
              ├── Memory Section
              │     ├── Header (Title + Count)
              │     └── Memory List
              │           └── Memory Item (Content)
              │
              └── Conversation Log
                    ├── Header (Title)
                    └── Log List
                          └── Log Item (Avatar + Bubble)
```

---

## 🔄 State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    React Component State                    │
│                   (DoraemonAgent.jsx)                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   status     │  │  isRunning   │  │  transcript  │
│              │  │              │  │              │
│ idle         │  │ true/false   │  │ "user text"  │
│ listening    │  │              │  │              │
│ thinking     │  │              │  │              │
│ speaking     │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘

        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   response   │  │    todos     │  │   memories   │
│              │  │              │  │              │
│ "agent text" │  │ [{task}...]  │  │ [{mem}...]   │
└──────────────┘  └──────────────┘  └──────────────┘

        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           ▼
                  ┌──────────────┐
                  │     log      │
                  │              │
                  │ [{role,text}]│
                  └──────────────┘
```

### State Updates Trigger:
1. **User Action** → `setStatus('listening')`
2. **API Response** → `setTodos([...])`, `setMemories([...])`
3. **Voice Event** → `setTranscript(text)`, `setResponse(text)`
4. **UI Render** → React re-renders affected components

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INPUT                           │
│                    (Voice → Text)                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND STATE                           │
│              transcript = "add task buy milk"               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼ HTTP POST
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API                              │
│              /agent/chat endpoint                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  AGENT SERVICE                              │
│            Intent Recognition + Routing                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                ┌──────────┼──────────┐
                │          │          │
                ▼          ▼          ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │   TODO   │ │  MEMORY  │ │   CHAT   │
        │ SERVICE  │ │ SERVICE  │ │ RESPONSE │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │            │            │
             ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  _todos  │ │_memories │ │ response │
        │   dict   │ │   list   │ │  string  │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │            │            │
             └────────────┼────────────┘
                          │
                          ▼ JSON Response
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND STATE                           │
│  response = "Got it! I've added 'buy milk'..."              │
│  todos = [{id, text, created_at}]                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                ┌──────────┼──────────┐
                │          │          │
                ▼          ▼          ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  SPEAK   │ │  UPDATE  │ │   LOG    │
        │ RESPONSE │ │ SIDEBAR  │ │  ENTRY   │
        └──────────┘ └──────────┘ └──────────┘
                │          │          │
                └──────────┼──────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      USER OUTPUT                            │
│              (Audio + Visual Updates)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Design Decisions

### 1. **In-Memory Storage**
**Why:** Fast, simple, no database setup needed  
**Trade-off:** Data lost on server restart  
**Alternative:** JSON file, SQLite, PostgreSQL

### 2. **Rule-Based NLP**
**Why:** No external API, instant responses, predictable  
**Trade-off:** Limited flexibility, manual pattern maintenance  
**Alternative:** OpenAI GPT, Google Gemini, local LLM

### 3. **Web Speech API**
**Why:** Browser-native, no server processing, free  
**Trade-off:** Browser compatibility, requires user permission  
**Alternative:** Google Speech-to-Text, Whisper API

### 4. **Continuous Listening Loop**
**Why:** Natural conversation flow, hands-free  
**Trade-off:** More complex state management  
**Alternative:** Push-to-talk button

### 5. **React Hooks (No Redux)**
**Why:** Simple state management, less boilerplate  
**Trade-off:** Props drilling for deep components  
**Alternative:** Redux, Zustand, Context API

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CURRENT (Development)                    │
└─────────────────────────────────────────────────────────────┘

Frontend (http://localhost:5173)
    │
    │ HTTP (unencrypted)
    │ CORS: allow all origins
    │ No authentication
    │
    ▼
Backend (http://localhost:8000)
    │
    │ In-memory storage
    │ No input validation
    │ No rate limiting
    │
    ▼
Data (RAM)
    │
    │ Lost on restart
    │ No encryption
    │ No backups


┌─────────────────────────────────────────────────────────────┐
│                  RECOMMENDED (Production)                   │
└─────────────────────────────────────────────────────────────┘

Frontend (https://app.example.com)
    │
    │ HTTPS (encrypted)
    │ JWT token in headers
    │ Input sanitization
    │
    ▼
API Gateway / Load Balancer
    │
    │ Rate limiting
    │ DDoS protection
    │ SSL termination
    │
    ▼
Backend (https://api.example.com)
    │
    │ JWT validation
    │ Input validation
    │ Error handling
    │ Logging
    │
    ▼
Database (PostgreSQL / MongoDB)
    │
    │ Encrypted at rest
    │ Encrypted in transit
    │ Regular backups
    │ Access control
```

---

## 📈 Performance Characteristics

### Backend
```
Request Handling:
  ┌─────────────────────────────────────┐
  │ Receive Request      │ < 1ms        │
  │ Parse JSON           │ < 1ms        │
  │ Process Intent       │ 1-5ms        │
  │ Service Call         │ 1-10ms       │
  │ Generate Response    │ < 1ms        │
  │ Send JSON            │ < 1ms        │
  └─────────────────────────────────────┘
  Total: ~10-20ms per request
```

### Frontend
```
Voice Interaction:
  ┌─────────────────────────────────────┐
  │ Speech Recognition   │ 100-500ms    │
  │ API Call             │ 10-50ms      │
  │ State Update         │ < 1ms        │
  │ Re-render            │ 1-5ms        │
  │ Speech Synthesis     │ 100-300ms    │
  └─────────────────────────────────────┘
  Total: ~200-850ms per interaction
```

---

## 🎊 Summary

This architecture provides:

✅ **Separation of Concerns** - Frontend, Backend, Services  
✅ **Scalability** - Can add more services easily  
✅ **Maintainability** - Clean, modular code  
✅ **Performance** - Fast in-memory operations  
✅ **Extensibility** - Easy to add new features  

**Next Steps:**
1. Review this architecture
2. Understand the flow
3. Customize as needed
4. Deploy to production

---

*Architecture designed for simplicity, performance, and extensibility*
