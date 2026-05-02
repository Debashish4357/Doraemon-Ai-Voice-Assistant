# 🤖 Doraemon AI Voice Agent - Complete Guide

## 🎯 Overview

**Doraemon** is a fully functional voice-based AI assistant that can:
- 🎤 **Listen** to your voice commands
- 🔊 **Respond** with natural speech
- ✅ **Manage** your to-do tasks
- 🧠 **Remember** important information
- 💬 **Converse** naturally like a real assistant

---

## ⚙️ Tech Stack

### Frontend
- **React** (Vite) - Fast, modern UI framework
- **Web Speech API** - Browser-native voice recognition and synthesis
- **Custom CSS** - Beautiful, responsive design

### Backend
- **FastAPI** (Python) - High-performance REST API
- **Uvicorn** - ASGI server for FastAPI
- **In-Memory Storage** - Fast, simple data persistence

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** installed
- **Node.js 16+** installed
- **Chrome/Edge browser** (for best voice support)

### Option 1: Start Everything (Recommended)
```bash
# Windows
start-all.bat

# This will open two terminal windows:
# - Backend at http://localhost:8000
# - Frontend at http://localhost:5173
```

### Option 2: Start Manually

**Terminal 1 - Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Access the App
Open your browser and go to: **http://localhost:5173**

---

## 🎤 How to Use

### 1. **Start Conversation**
- Click the **blue microphone button** or the **central orb**
- Doraemon will greet you: *"Hi! I'm Doraemon, your AI assistant!"*
- The orb will turn **blue** when listening

### 2. **Talk to Doraemon**
The system will continuously listen and respond. Try these commands:

#### ✅ **To-Do Management**
- *"Add task buy groceries"*
- *"Add task call mom tomorrow"*
- *"Show my tasks"*
- *"List my to-do items"*
- *"Delete task buy groceries"*
- *"Complete task call mom"*

#### 🧠 **Memory Management**
- *"Remember my exam is on Monday"*
- *"Don't forget I'm allergic to peanuts"*
- *"Note that my birthday is June 15th"*
- *"What did I tell you?"*
- *"What do you remember about me?"*

#### 💬 **General Conversation**
- *"Hello"* / *"Hi"*
- *"Help"* / *"What can you do?"*
- *"Thank you"* / *"Goodbye"* (ends conversation)

### 3. **Stop Conversation**
- Say: *"Goodbye"*, *"Thank you"*, *"Bye"*, or *"Exit"*
- Or click the **red stop button**

---

## 🧠 Agent Intelligence

### How Doraemon Understands You

The agent uses **rule-based NLP** (no external AI API needed) to parse your intent:

```python
# Example: Adding a task
User says: "Add task buy milk"
↓
Agent extracts: "buy milk"
↓
Calls: todo_service.add_todo("buy milk")
↓
Responds: "Got it! I've added 'buy milk' to your task list."
```

### Response Format
Every response follows this structure:
```json
{
  "type": "chat" | "todo" | "memory",
  "response": "Text to speak",
  "data": { /* Optional structured data */ }
}
```

---

## 📂 Project Structure

```
doraemon-voice-agent/
├── backend/
│   ├── main.py                 # FastAPI entry point
│   ├── routes/
│   │   ├── agent.py           # /agent/chat endpoint
│   │   ├── todo.py            # /todo/* endpoints
│   │   └── memory.py          # /memory/* endpoints
│   ├── services/
│   │   ├── agent_service.py   # Core intelligence (intent parsing)
│   │   ├── todo_service.py    # Task management logic
│   │   └── memory_service.py  # Memory storage logic
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   └── DoraemonAgent.jsx  # Main voice UI component
│   │   ├── index.css              # Complete styling
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── start-all.bat              # Start both servers (Windows)
├── start-backend.bat
├── start-frontend.bat
└── DORAEMON_GUIDE.md         # This file
```

---

## 🔧 API Endpoints

### Agent
- **POST** `/agent/chat`
  ```json
  { "message": "add task buy milk" }
  ```

### To-Do
- **POST** `/todo/add` - Add a task
  ```json
  { "task": "Buy groceries" }
  ```
- **GET** `/todo/list` - List all tasks
- **DELETE** `/todo/delete/{id}` - Delete a task

### Memory
- **POST** `/memory/save` - Save a memory
  ```json
  { "content": "My exam is Monday" }
  ```
- **GET** `/memory/list` - List all memories

### Documentation
- **GET** `/docs` - Interactive API documentation (Swagger UI)

---

## 🎨 UI Features

### Visual States
- **Idle** (Gray) - Ready to start
- **Listening** (Blue) - Capturing your voice
- **Thinking** (Yellow) - Processing your request
- **Speaking** (Green) - Responding to you

### Sidebar Panels
1. **✅ Tasks** - Live task list with delete buttons
2. **🧠 Memory** - Stored memories
3. **💬 Conversation** - Full chat history

### Animations
- Ripple effect when listening
- Smooth transitions between states
- Slide-in animations for new items

---

## 🔊 Voice System Details

### Speech Recognition (Input)
- Uses **Web Speech API** (`SpeechRecognition`)
- Language: English (US)
- Continuous listening mode
- Automatic restart on silence

### Speech Synthesis (Output)
- Uses **Web Speech API** (`SpeechSynthesis`)
- Prefers Google voices for clarity
- Rate: 1.0, Pitch: 1.1, Volume: 1.0

### Browser Compatibility
| Browser | Recognition | Synthesis |
|---------|-------------|-----------|
| Chrome  | ✅ Full     | ✅ Full   |
| Edge    | ✅ Full     | ✅ Full   |
| Firefox | ❌ Limited  | ✅ Full   |
| Safari  | ⚠️ Partial  | ✅ Full   |

**Recommendation:** Use **Chrome** or **Edge** for best experience.

---

## 🧪 Testing the System

### 1. Test Voice Recognition
- Click the mic button
- Say: *"Hello"*
- Expected: Doraemon greets you back

### 2. Test To-Do System
```
You: "Add task buy milk"
Doraemon: "Got it! I've added 'buy milk' to your task list."

You: "Show my tasks"
Doraemon: "You have 1 task: buy milk."

You: "Delete task buy milk"
Doraemon: "Done! I've removed 'buy milk' from your list."
```

### 3. Test Memory System
```
You: "Remember my exam is Monday"
Doraemon: "I'll remember that: 'my exam is Monday'."

You: "What did I tell you?"
Doraemon: "Here is what I remember about you:
- my exam is Monday"
```

### 4. Test Conversation Flow
```
You: "Hello"
Doraemon: "Hello! I'm Doraemon, your AI assistant..."

You: "What can you do?"
Doraemon: "I can help you with: Adding tasks..."

You: "Thank you"
Doraemon: "Goodbye! It was a pleasure helping you. Take care! 👋"
[Conversation ends]
```

---

## 🐛 Troubleshooting

### Issue: "Browser does not support Speech Recognition"
**Solution:** Use Chrome or Edge browser.

### Issue: Microphone not working
**Solution:** 
1. Check browser permissions (click lock icon in address bar)
2. Allow microphone access
3. Refresh the page

### Issue: Backend connection failed
**Solution:**
1. Ensure backend is running: `http://localhost:8000`
2. Check terminal for errors
3. Verify CORS is enabled in `main.py`

### Issue: Voice sounds robotic
**Solution:**
1. Install Google voices on your system
2. Or adjust voice settings in `DoraemonAgent.jsx`:
   ```javascript
   utterance.rate = 0.9;  // Slower
   utterance.pitch = 1.0; // Lower pitch
   ```

### Issue: Agent doesn't understand commands
**Solution:**
1. Speak clearly and use exact phrases
2. Check `agent_service.py` for supported keywords
3. Add custom keywords if needed

---

## 🎯 Conversation Flow Diagram

```
┌─────────────────────────────────────────────┐
│  User clicks mic button                     │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Doraemon greets: "Hi! I'm Doraemon..."     │
└──────────────┬──────────────────────────────┘
               │
               ▼
       ┌───────────────┐
       │  Listen Loop  │◄─────────┐
       └───────┬───────┘          │
               │                  │
               ▼                  │
       ┌──────────────┐           │
       │ User speaks  │           │
       └───────┬──────┘           │
               │                  │
               ▼                  │
       ┌──────────────┐           │
       │ Send to API  │           │
       └───────┬──────┘           │
               │                  │
               ▼                  │
       ┌──────────────┐           │
       │ Get response │           │
       └───────┬──────┘           │
               │                  │
               ▼                  │
       ┌──────────────┐           │
       │ Speak reply  │           │
       └───────┬──────┘           │
               │                  │
               ▼                  │
       ┌──────────────┐           │
       │ Goodbye?     │───No──────┘
       └───────┬──────┘
               │
              Yes
               │
               ▼
       ┌──────────────┐
       │ End session  │
       └──────────────┘
```

---

## 🔐 Security Notes

- **In-Memory Storage:** Data is lost when server restarts
- **No Authentication:** Suitable for local/demo use only
- **CORS:** Currently allows all origins (dev mode)

For production:
1. Add authentication (JWT tokens)
2. Use persistent database (PostgreSQL, MongoDB)
3. Restrict CORS to specific domains
4. Add rate limiting
5. Implement HTTPS

---

## 🚀 Future Enhancements

### Planned Features
- [ ] Persistent storage (JSON file or database)
- [ ] User accounts and authentication
- [ ] Task priorities and due dates
- [ ] Calendar integration
- [ ] Weather information
- [ ] News updates
- [ ] Multi-language support
- [ ] Custom wake word ("Hey Doraemon")
- [ ] Mobile app version

### Advanced Features
- [ ] Integration with external AI (OpenAI, Gemini)
- [ ] Context-aware conversations
- [ ] Sentiment analysis
- [ ] Voice customization
- [ ] Smart reminders
- [ ] Email/SMS notifications

---

## 📝 Code Examples

### Adding a Custom Command

**1. Update `agent_service.py`:**
```python
# Add weather command
if any(kw in msg for kw in ["weather", "temperature", "forecast"]):
    return {
        "type": "chat",
        "response": "I don't have weather data yet, but I can add that feature!",
        "data": None
    }
```

**2. Test:**
```
You: "What's the weather?"
Doraemon: "I don't have weather data yet, but I can add that feature!"
```

### Customizing Voice Settings

**Edit `DoraemonAgent.jsx`:**
```javascript
function speak(text, onStart, onEnd) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;   // Slower (0.1 - 10)
  utterance.pitch = 1.2;  // Higher (0 - 2)
  utterance.volume = 0.8; // Quieter (0 - 1)
  // ... rest of code
}
```

---

## 📚 Resources

### Documentation
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)

### Tutorials
- [Building Voice Apps](https://web.dev/voice-driven-web-apps-introduction/)
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [React Hooks Guide](https://react.dev/reference/react)

---

## 🤝 Contributing

Want to improve Doraemon? Here's how:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🎉 Credits

Built with ❤️ by a senior full-stack AI engineer.

**Technologies Used:**
- FastAPI
- React
- Web Speech API
- Vite
- Python
- JavaScript

---

## 📞 Support

Having issues? Try these steps:

1. **Check the Troubleshooting section** above
2. **Review the API docs** at `http://localhost:8000/docs`
3. **Check browser console** for JavaScript errors
4. **Check terminal** for Python errors
5. **Restart both servers**

---

## 🎊 Enjoy Your AI Assistant!

Doraemon is ready to help you manage your tasks and remember important things. Start talking and experience the magic of voice-based AI! 🚀

**Remember:** Say "Goodbye" or "Thank you" to end the conversation gracefully.

---

*Last Updated: 2026*
