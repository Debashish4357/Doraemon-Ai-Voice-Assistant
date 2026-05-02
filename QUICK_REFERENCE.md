# 🚀 Doraemon Voice Agent - Quick Reference

## ⚡ Start the System

```bash
# Windows - Start everything at once
start-all.bat

# Or manually:
# Terminal 1: cd backend && uvicorn main:app --reload
# Terminal 2: cd frontend && npm run dev
```

**Access:** http://localhost:5173

---

## 🎤 Voice Commands Cheat Sheet

### ✅ To-Do Tasks
| Command | Example |
|---------|---------|
| Add task | *"Add task buy groceries"* |
| Show tasks | *"Show my tasks"* |
| Delete task | *"Delete task buy groceries"* |

### 🧠 Memory
| Command | Example |
|---------|---------|
| Save memory | *"Remember my exam is Monday"* |
| Recall memory | *"What did I tell you?"* |

### 💬 Conversation
| Command | Example |
|---------|---------|
| Greet | *"Hello"* / *"Hi"* |
| Help | *"What can you do?"* |
| Exit | *"Goodbye"* / *"Thank you"* |

---

## 🔧 API Endpoints

```bash
# Agent
POST http://localhost:8000/agent/chat
Body: { "message": "add task buy milk" }

# To-Do
POST   /todo/add        # Add task
GET    /todo/list       # List tasks
DELETE /todo/delete/:id # Delete task

# Memory
POST /memory/save       # Save memory
GET  /memory/list       # List memories

# Docs
GET /docs               # Swagger UI
```

---

## 🎨 UI States

| State | Color | Icon | Meaning |
|-------|-------|------|---------|
| Idle | Gray | 🤖 | Ready to start |
| Listening | Blue | 🎙️ | Capturing voice |
| Thinking | Yellow | 💭 | Processing |
| Speaking | Green | 🔊 | Responding |

---

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| No mic access | Allow permissions in browser |
| Backend error | Check `http://localhost:8000` is running |
| Voice not working | Use Chrome or Edge browser |
| Can't hear response | Check system volume |

---

## 📂 Key Files

```
backend/
├── main.py                    # FastAPI app
├── services/agent_service.py  # Core intelligence
├── services/todo_service.py   # Task logic
└── services/memory_service.py # Memory logic

frontend/
└── src/components/DoraemonAgent.jsx  # Main UI
```

---

## 🎯 Sample Conversation

```
👤 User: "Hello"
🤖 Doraemon: "Hello! I'm Doraemon, your AI assistant..."

👤 User: "Add task buy milk"
🤖 Doraemon: "Got it! I've added 'buy milk' to your task list."

👤 User: "Show my tasks"
🤖 Doraemon: "You have 1 task: buy milk."

👤 User: "Remember my birthday is June 15th"
🤖 Doraemon: "I'll remember that: 'my birthday is June 15th'."

👤 User: "What do you remember?"
🤖 Doraemon: "Here is what I remember about you:
- my birthday is June 15th"

👤 User: "Thank you"
🤖 Doraemon: "Goodbye! It was a pleasure helping you. Take care! 👋"
```

---

## 🔥 Pro Tips

1. **Speak clearly** - Enunciate for better recognition
2. **Use exact phrases** - "Add task" not "Can you add"
3. **Wait for response** - Let Doraemon finish speaking
4. **Check sidebar** - See tasks/memories update in real-time
5. **Say goodbye** - Ends conversation gracefully

---

## 📱 Browser Support

| Browser | Status |
|---------|--------|
| Chrome | ✅ Recommended |
| Edge | ✅ Recommended |
| Firefox | ⚠️ Limited |
| Safari | ⚠️ Partial |

---

## 🎊 That's It!

You're ready to use Doraemon! Click the mic and start talking! 🚀

For detailed documentation, see **DORAEMON_GUIDE.md**
