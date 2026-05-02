# 🧪 Testing Guide - Doraemon AI Voice Agent

## Table of Contents
1. [Manual Testing](#manual-testing)
2. [API Testing](#api-testing)
3. [Voice System Testing](#voice-system-testing)
4. [Integration Testing](#integration-testing)
5. [Browser Compatibility Testing](#browser-compatibility-testing)
6. [Performance Testing](#performance-testing)

---

## Manual Testing

### ✅ Backend Testing

#### 1. Start Backend Server
```bash
cd backend
uvicorn main:app --reload
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

#### 2. Test Root Endpoint
Open browser: http://localhost:8000

**Expected Response:**
```json
{
  "message": "Doraemon AI Agent is online. Visit /docs for API reference."
}
```

#### 3. Test API Documentation
Open browser: http://localhost:8000/docs

**Expected:** Interactive Swagger UI with all endpoints

---

### ✅ Frontend Testing

#### 1. Start Frontend Server
```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v8.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

#### 2. Open Application
Open browser: http://localhost:5173

**Expected:**
- Clean UI with blue orb in center
- Sidebar on right with empty tasks/memories
- Header with "Doraemon" branding
- Status showing "Ready"

---

## API Testing

### Using cURL

#### 1. Test Agent Chat
```bash
curl -X POST http://localhost:8000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "add task buy milk"}'
```

**Expected Response:**
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

#### 2. Test Add Task
```bash
curl -X POST http://localhost:8000/todo/add \
  -H "Content-Type: application/json" \
  -d '{"task": "Buy groceries"}'
```

**Expected Response:**
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

#### 3. Test List Tasks
```bash
curl http://localhost:8000/todo/list
```

**Expected Response:**
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

#### 4. Test Delete Task
```bash
curl -X DELETE http://localhost:8000/todo/delete/1714567890123
```

**Expected Response:**
```json
{
  "status": "success",
  "deleted_id": "1714567890123"
}
```

#### 5. Test Save Memory
```bash
curl -X POST http://localhost:8000/memory/save \
  -H "Content-Type: application/json" \
  -d '{"content": "My exam is Monday"}'
```

**Expected Response:**
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

#### 6. Test List Memories
```bash
curl http://localhost:8000/memory/list
```

**Expected Response:**
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

### Using Python Requests

```python
import requests

BASE_URL = "http://localhost:8000"

# Test agent chat
response = requests.post(f"{BASE_URL}/agent/chat", 
    json={"message": "add task buy milk"})
print(response.json())

# Test add task
response = requests.post(f"{BASE_URL}/todo/add", 
    json={"task": "Buy groceries"})
print(response.json())

# Test list tasks
response = requests.get(f"{BASE_URL}/todo/list")
print(response.json())

# Test save memory
response = requests.post(f"{BASE_URL}/memory/save", 
    json={"content": "My exam is Monday"})
print(response.json())

# Test list memories
response = requests.get(f"{BASE_URL}/memory/list")
print(response.json())
```

---

## Voice System Testing

### 1. Test Speech Recognition

**Steps:**
1. Open http://localhost:5173
2. Click the blue orb or mic button
3. Allow microphone access when prompted
4. Speak: "Hello"

**Expected:**
- Status changes to "Listening..."
- Orb turns blue with ripple effect
- After speaking, status changes to "Thinking..."
- Transcript box shows: "Hello"
- Agent responds with greeting
- Status changes to "Speaking..."
- You hear the response

### 2. Test Speech Synthesis

**Steps:**
1. Start conversation
2. Say: "Add task buy milk"

**Expected:**
- You hear: "Got it! I've added 'buy milk' to your task list."
- Voice is clear and natural
- Speaking animation on orb

### 3. Test Continuous Conversation

**Steps:**
1. Start conversation
2. Say multiple commands without clicking again:
   - "Add task buy milk"
   - "Show my tasks"
   - "Remember my exam is Monday"
   - "What did I tell you?"
   - "Goodbye"

**Expected:**
- Each command is processed
- Responses are spoken
- Conversation continues until "goodbye"
- Loop stops after farewell

---

## Integration Testing

### Test Case 1: Add and List Tasks

**Steps:**
1. Start conversation
2. Say: "Add task buy milk"
3. Wait for response
4. Say: "Add task call mom"
5. Wait for response
6. Say: "Show my tasks"

**Expected:**
- Both tasks are added
- Sidebar shows 2 tasks
- Agent lists both tasks in response
- Task count badge shows "2"

### Test Case 2: Add and Delete Task

**Steps:**
1. Say: "Add task buy milk"
2. Wait for response
3. Say: "Delete task buy milk"

**Expected:**
- Task is added to sidebar
- Task is removed from sidebar
- Agent confirms deletion
- Task count badge shows "0"

### Test Case 3: Save and Recall Memory

**Steps:**
1. Say: "Remember my exam is Monday"
2. Wait for response
3. Say: "Remember I like pizza"
4. Wait for response
5. Say: "What did I tell you?"

**Expected:**
- Both memories appear in sidebar
- Agent recalls both memories
- Memory count badge shows "2"

### Test Case 4: Mixed Commands

**Steps:**
1. Say: "Add task buy groceries"
2. Say: "Remember my birthday is May 15"
3. Say: "Show my tasks"
4. Say: "What do you remember?"
5. Say: "Delete task buy groceries"

**Expected:**
- All commands work correctly
- Sidebar updates in real-time
- Conversation log shows all interactions

### Test Case 5: Error Handling

**Steps:**
1. Say: "Add task" (without task name)
2. Say: "Delete task xyz" (non-existent task)
3. Say: "Remember" (without content)

**Expected:**
- Agent asks for clarification
- Helpful error messages
- No crashes or freezes

---

## Browser Compatibility Testing

### Chrome/Edge (Full Support)

**Test:**
1. Open in Chrome
2. Test all voice features
3. Test all UI interactions

**Expected:**
- ✅ Speech recognition works
- ✅ Speech synthesis works
- ✅ All animations smooth
- ✅ No console errors

### Firefox (Limited Support)

**Test:**
1. Open in Firefox
2. Try voice features

**Expected:**
- ❌ Speech recognition may not work
- ⚠️ Speech synthesis may be limited
- ✅ UI still functional
- ✅ Manual API calls work

### Safari (Limited Support)

**Test:**
1. Open in Safari
2. Try voice features

**Expected:**
- ❌ Speech recognition not supported
- ⚠️ Speech synthesis limited
- ✅ UI still functional

---

## Performance Testing

### 1. Response Time

**Test:**
```bash
time curl -X POST http://localhost:8000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "add task buy milk"}'
```

**Expected:**
- Response time < 100ms
- No delays or timeouts

### 2. Concurrent Requests

**Test:**
```bash
# Send 10 concurrent requests
for i in {1..10}; do
  curl -X POST http://localhost:8000/agent/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "add task test '$i'"}' &
done
wait
```

**Expected:**
- All requests succeed
- No errors or crashes
- Tasks are all created

### 3. Memory Usage

**Test:**
1. Add 100 tasks
2. Add 100 memories
3. Check backend memory usage

**Expected:**
- Memory usage remains reasonable
- No memory leaks
- Performance stays consistent

### 4. UI Performance

**Test:**
1. Add 50 tasks
2. Add 50 memories
3. Scroll through conversation log

**Expected:**
- UI remains responsive
- No lag or stuttering
- Smooth animations

---

## Automated Testing

### Backend Unit Tests

Create `backend/test_services.py`:

```python
import pytest
from services import agent_service, todo_service, memory_service

def test_add_task():
    result = agent_service.process_message("add task buy milk")
    assert result["type"] == "todo"
    assert "buy milk" in result["response"]

def test_list_tasks():
    todo_service.add_todo("test task")
    result = agent_service.process_message("show my tasks")
    assert result["type"] == "todo"
    assert len(result["data"]["tasks"]) > 0

def test_save_memory():
    result = agent_service.process_message("remember my exam is Monday")
    assert result["type"] == "memory"
    assert "remember" in result["response"].lower()

def test_greeting():
    result = agent_service.process_message("hello")
    assert result["type"] == "chat"
    assert "doraemon" in result["response"].lower()

def test_goodbye():
    result = agent_service.process_message("goodbye")
    assert result["type"] == "chat"
    assert "goodbye" in result["response"].lower()
```

**Run tests:**
```bash
cd backend
pip install pytest
pytest test_services.py -v
```

### Frontend Component Tests

Create `frontend/src/components/DoraemonAgent.test.jsx`:

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import DoraemonAgent from './DoraemonAgent';

test('renders mic button', () => {
  render(<DoraemonAgent />);
  const button = screen.getByRole('button');
  expect(button).toBeInTheDocument();
});

test('displays initial status', () => {
  render(<DoraemonAgent />);
  const status = screen.getByText(/Ready/i);
  expect(status).toBeInTheDocument();
});

test('shows empty task list initially', () => {
  render(<DoraemonAgent />);
  const emptyState = screen.getByText(/No tasks yet/i);
  expect(emptyState).toBeInTheDocument();
});
```

**Run tests:**
```bash
cd frontend
npm install @testing-library/react @testing-library/jest-dom
npm test
```

---

## Test Checklist

### ✅ Backend Tests
- [ ] Server starts without errors
- [ ] Root endpoint returns correct message
- [ ] API docs are accessible
- [ ] Agent chat endpoint works
- [ ] Todo endpoints work (add, list, delete)
- [ ] Memory endpoints work (save, list)
- [ ] CORS is configured correctly
- [ ] Error handling works

### ✅ Frontend Tests
- [ ] App loads without errors
- [ ] UI renders correctly
- [ ] Mic button is clickable
- [ ] Status updates correctly
- [ ] Sidebar displays tasks
- [ ] Sidebar displays memories
- [ ] Conversation log works
- [ ] Delete buttons work

### ✅ Voice Tests
- [ ] Microphone access works
- [ ] Speech recognition starts
- [ ] Speech is transcribed correctly
- [ ] Speech synthesis works
- [ ] Voice is clear and natural
- [ ] Continuous conversation works
- [ ] Farewell stops conversation

### ✅ Integration Tests
- [ ] Add task via voice
- [ ] List tasks via voice
- [ ] Delete task via voice
- [ ] Save memory via voice
- [ ] Recall memory via voice
- [ ] Mixed commands work
- [ ] Real-time UI updates

### ✅ Browser Tests
- [ ] Works in Chrome
- [ ] Works in Edge
- [ ] Graceful degradation in Firefox
- [ ] Graceful degradation in Safari

### ✅ Performance Tests
- [ ] Response time < 100ms
- [ ] Handles concurrent requests
- [ ] No memory leaks
- [ ] UI stays responsive

---

## Debugging Tips

### Backend Debugging

**Enable debug logging:**
```python
# In main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Check logs:**
```bash
# Terminal shows all requests and responses
```

### Frontend Debugging

**Open browser console:**
- Chrome: F12 or Ctrl+Shift+I
- Check Console tab for errors
- Check Network tab for API calls

**Add debug logs:**
```javascript
console.log('Status:', status);
console.log('Transcript:', transcript);
console.log('Response:', response);
```

### Voice Debugging

**Check speech recognition:**
```javascript
recognition.onerror = (event) => {
  console.error('Speech recognition error:', event.error);
};
```

**Check speech synthesis:**
```javascript
utterance.onerror = (event) => {
  console.error('Speech synthesis error:', event);
};
```

---

## Common Issues and Solutions

### Issue: Microphone not working
**Solution:**
- Check browser permissions
- Ensure HTTPS in production
- Try different browser
- Check system microphone settings

### Issue: Backend connection failed
**Solution:**
- Verify backend is running
- Check port 8000 is not in use
- Verify CORS settings
- Check firewall

### Issue: Tasks not updating
**Solution:**
- Check browser console
- Verify API calls in Network tab
- Check backend logs
- Refresh the page

### Issue: Voice not speaking
**Solution:**
- Check system volume
- Verify browser audio permissions
- Try different voice
- Check browser compatibility

---

## Test Reports

### Sample Test Report Template

```
# Test Report - Doraemon AI Voice Agent
Date: 2024-05-01
Tester: [Your Name]
Environment: Windows 10, Chrome 120

## Backend Tests
✅ Server startup: PASS
✅ API endpoints: PASS (6/6)
✅ Error handling: PASS
✅ Response time: PASS (avg 45ms)

## Frontend Tests
✅ UI rendering: PASS
✅ Voice input: PASS
✅ Voice output: PASS
✅ Real-time updates: PASS

## Integration Tests
✅ Add task: PASS
✅ List tasks: PASS
✅ Delete task: PASS
✅ Save memory: PASS
✅ Recall memory: PASS

## Browser Compatibility
✅ Chrome: PASS (full support)
✅ Edge: PASS (full support)
⚠️ Firefox: PARTIAL (no speech recognition)
⚠️ Safari: PARTIAL (limited support)

## Performance
✅ Response time: 45ms avg
✅ Concurrent requests: 10/10 success
✅ Memory usage: Stable
✅ UI performance: Smooth

## Issues Found
None

## Conclusion
All critical features working as expected.
Ready for production deployment.
```

---

## Next Steps After Testing

1. ✅ **Fix any issues found**
2. ✅ **Document edge cases**
3. ✅ **Add more test coverage**
4. ✅ **Set up CI/CD pipeline**
5. ✅ **Deploy to production**

---

**Happy Testing! 🧪✨**
