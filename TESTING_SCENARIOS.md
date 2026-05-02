# 🧪 Doraemon Voice Agent - Testing Scenarios

## 🎯 Complete Testing Guide

This document provides step-by-step testing scenarios to verify all features work correctly.

---

## 🚀 Pre-Test Setup

### 1. Start the System
```bash
# Run this command
start-all.bat

# Wait for both servers to start:
# ✅ Backend: http://localhost:8000
# ✅ Frontend: http://localhost:5173
```

### 2. Open Browser
- Use **Chrome** or **Edge** (recommended)
- Navigate to: `http://localhost:5173`
- Allow microphone permissions when prompted

### 3. Verify Initial State
- [ ] Page loads without errors
- [ ] Header shows "Doraemon" and "System Online"
- [ ] Gray orb is visible in center
- [ ] Blue mic button at bottom
- [ ] Sidebar shows empty tasks and memories

---

## 📋 Test Scenarios

### Scenario 1: Basic Voice Recognition
**Objective:** Verify voice input works

**Steps:**
1. Click the blue microphone button
2. Wait for greeting: *"Hi! I'm Doraemon, your AI assistant..."*
3. Orb should turn blue (listening state)
4. Say: **"Hello"**
5. Wait for response

**Expected Results:**
- ✅ Orb turns blue when listening
- ✅ Transcript shows "Hello"
- ✅ Orb turns yellow (thinking)
- ✅ Orb turns green (speaking)
- ✅ Response: "Hello! I'm Doraemon, your AI assistant..."
- ✅ Conversation log shows both messages

**Pass/Fail:** ___________

---

### Scenario 2: Add Single Task
**Objective:** Verify task creation

**Steps:**
1. Ensure conversation is active (orb is blue)
2. Say: **"Add task buy milk"**
3. Wait for response

**Expected Results:**
- ✅ Response: "Got it! I've added 'buy milk' to your task list."
- ✅ Sidebar "Tasks" section shows count (1)
- ✅ Task "buy milk" appears in sidebar
- ✅ Task has a delete button (✕)

**Pass/Fail:** ___________

---

### Scenario 3: Add Multiple Tasks
**Objective:** Verify multiple tasks can be added

**Steps:**
1. Say: **"Add task call mom"**
2. Wait for confirmation
3. Say: **"Add task study for exam"**
4. Wait for confirmation
5. Say: **"Add task go to gym"**
6. Wait for confirmation

**Expected Results:**
- ✅ Each task gets confirmed individually
- ✅ Sidebar shows count (4) - including "buy milk" from Scenario 2
- ✅ All 4 tasks visible in sidebar:
  - go to gym
  - study for exam
  - call mom
  - buy milk
- ✅ Tasks appear in reverse chronological order (newest first)

**Pass/Fail:** ___________

---

### Scenario 4: List Tasks
**Objective:** Verify task listing

**Steps:**
1. Say: **"Show my tasks"**
2. Wait for response

**Expected Results:**
- ✅ Response: "You have 4 tasks: go to gym, study for exam, call mom, buy milk."
- ✅ All tasks mentioned in response
- ✅ Sidebar still shows all tasks

**Pass/Fail:** ___________

---

### Scenario 5: Delete Task by Voice
**Objective:** Verify voice-based task deletion

**Steps:**
1. Say: **"Delete task buy milk"**
2. Wait for response

**Expected Results:**
- ✅ Response: "Done! I've removed 'buy milk' from your list."
- ✅ Sidebar count updates to (3)
- ✅ "buy milk" no longer visible in sidebar
- ✅ Other tasks remain intact

**Pass/Fail:** ___________

---

### Scenario 6: Delete Task by Button
**Objective:** Verify UI-based task deletion

**Steps:**
1. Hover over "call mom" task in sidebar
2. Click the ✕ button that appears
3. Observe changes

**Expected Results:**
- ✅ Task disappears immediately
- ✅ Sidebar count updates to (2)
- ✅ Remaining tasks: "go to gym", "study for exam"
- ✅ No error messages

**Pass/Fail:** ___________

---

### Scenario 7: Save Memory
**Objective:** Verify memory storage

**Steps:**
1. Say: **"Remember my exam is on Monday"**
2. Wait for response

**Expected Results:**
- ✅ Response: "I'll remember that: 'my exam is on Monday'."
- ✅ Sidebar "Memory" section shows count (1)
- ✅ Memory appears: "my exam is on Monday"
- ✅ Memory has yellow background with orange border

**Pass/Fail:** ___________

---

### Scenario 8: Save Multiple Memories
**Objective:** Verify multiple memories

**Steps:**
1. Say: **"Remember my birthday is June 15th"**
2. Wait for confirmation
3. Say: **"Don't forget I'm allergic to peanuts"**
4. Wait for confirmation

**Expected Results:**
- ✅ Each memory gets confirmed
- ✅ Sidebar shows count (3)
- ✅ All 3 memories visible:
  - I'm allergic to peanuts
  - my birthday is June 15th
  - my exam is on Monday
- ✅ Memories in reverse chronological order

**Pass/Fail:** ___________

---

### Scenario 9: Recall Memories
**Objective:** Verify memory retrieval

**Steps:**
1. Say: **"What did I tell you?"**
2. Wait for response

**Expected Results:**
- ✅ Response starts with: "Here is what I remember about you:"
- ✅ Lists all 3 memories:
  - my exam is on Monday
  - my birthday is June 15th
  - I'm allergic to peanuts
- ✅ Sidebar still shows all memories

**Pass/Fail:** ___________

---

### Scenario 10: Help Command
**Objective:** Verify help functionality

**Steps:**
1. Say: **"What can you do?"**
2. Wait for response

**Expected Results:**
- ✅ Response explains capabilities
- ✅ Mentions: adding tasks, showing tasks, deleting tasks, remembering things, recalling memories
- ✅ Provides example commands

**Pass/Fail:** ___________

---

### Scenario 11: Empty Task List
**Objective:** Verify behavior with no tasks

**Steps:**
1. Delete all remaining tasks using sidebar buttons
2. Say: **"Show my tasks"**
3. Wait for response

**Expected Results:**
- ✅ Response: "Your task list is empty! Would you like to add something?"
- ✅ Sidebar shows count (0)
- ✅ Empty state message: "No tasks yet. Say 'add task...'"

**Pass/Fail:** ___________

---

### Scenario 12: Conversation Log
**Objective:** Verify chat history tracking

**Steps:**
1. Scroll to "Conversation" section in sidebar
2. Review all logged messages

**Expected Results:**
- ✅ All user messages shown with "U" avatar (blue)
- ✅ All agent responses shown with "D" avatar (green)
- ✅ Messages in chronological order (oldest first)
- ✅ Recent messages visible (last ~20)

**Pass/Fail:** ___________

---

### Scenario 13: End Conversation
**Objective:** Verify graceful exit

**Steps:**
1. Say: **"Thank you"**
2. Wait for response
3. Observe system state

**Expected Results:**
- ✅ Response: "Goodbye! It was a pleasure helping you. Take care! 👋"
- ✅ Conversation stops automatically
- ✅ Orb returns to gray (idle state)
- ✅ Mic button turns blue (start state)
- ✅ Status shows "Ready"

**Pass/Fail:** ___________

---

### Scenario 14: Restart Conversation
**Objective:** Verify system can restart

**Steps:**
1. Click the blue mic button again
2. Wait for greeting
3. Say: **"Hello"**
4. Wait for response

**Expected Results:**
- ✅ Greeting plays again
- ✅ System responds to "Hello"
- ✅ Previous tasks and memories still visible in sidebar
- ✅ Conversation log continues (not reset)

**Pass/Fail:** ___________

---

### Scenario 15: Stop Button
**Objective:** Verify manual stop

**Steps:**
1. While conversation is active (orb is blue/yellow/green)
2. Click the red stop button
3. Observe changes

**Expected Results:**
- ✅ Conversation stops immediately
- ✅ Speech synthesis stops
- ✅ Orb returns to gray
- ✅ Button turns blue
- ✅ Status shows "Ready"

**Pass/Fail:** ___________

---

### Scenario 16: Unrecognized Command
**Objective:** Verify fallback behavior

**Steps:**
1. Start conversation
2. Say: **"What's the weather today?"**
3. Wait for response

**Expected Results:**
- ✅ Response acknowledges the input
- ✅ Response: "I heard you say: 'What's the weather today?'. I'm Doraemon and I'm best at managing your tasks and memories..."
- ✅ Suggests available commands
- ✅ Conversation continues (doesn't end)

**Pass/Fail:** ___________

---

### Scenario 17: Rapid Commands
**Objective:** Verify system handles quick succession

**Steps:**
1. Say: **"Add task task one"**
2. Immediately after response, say: **"Add task task two"**
3. Immediately after response, say: **"Show my tasks"**

**Expected Results:**
- ✅ All commands processed in order
- ✅ Both tasks created
- ✅ List shows both tasks
- ✅ No errors or skipped commands

**Pass/Fail:** ___________

---

### Scenario 18: Visual State Transitions
**Objective:** Verify all visual states work

**Steps:**
1. Start conversation
2. Observe orb during one complete cycle:
   - Before speaking (blue - listening)
   - After speaking (yellow - thinking)
   - During response (green - speaking)
   - After response (blue - listening again)

**Expected Results:**
- ✅ Idle: Gray orb, no animation
- ✅ Listening: Blue orb, ripple rings
- ✅ Thinking: Yellow orb, gentle pulse
- ✅ Speaking: Green orb, bounce animation
- ✅ Status badge matches orb color
- ✅ Smooth transitions between states

**Pass/Fail:** ___________

---

### Scenario 19: Sidebar Responsiveness
**Objective:** Verify sidebar updates in real-time

**Steps:**
1. Keep sidebar visible
2. Add a task via voice
3. Observe sidebar during the process

**Expected Results:**
- ✅ Task appears immediately after API response
- ✅ Count updates instantly
- ✅ Slide-in animation plays
- ✅ No page refresh needed

**Pass/Fail:** ___________

---

### Scenario 20: Browser Refresh
**Objective:** Verify data persistence (or lack thereof)

**Steps:**
1. Note current tasks and memories
2. Refresh the browser page (F5)
3. Check sidebar

**Expected Results:**
- ✅ Page reloads successfully
- ✅ Tasks and memories are GONE (in-memory storage)
- ✅ Sidebar shows empty state
- ✅ System ready to use again

**Note:** This is expected behavior with in-memory storage.

**Pass/Fail:** ___________

---

## 🔧 API Testing (Optional)

### Test Backend Directly

**1. Test Agent Endpoint:**
```bash
curl -X POST http://localhost:8000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "add task test task"}'
```

**Expected:** JSON response with type, response, data

**2. Test Todo List:**
```bash
curl http://localhost:8000/todo/list
```

**Expected:** JSON with tasks array

**3. Test Memory List:**
```bash
curl http://localhost:8000/memory/list
```

**Expected:** JSON with memories array

**4. Test API Docs:**
- Open: `http://localhost:8000/docs`
- Expected: Swagger UI with all endpoints

---

## 📊 Test Summary

### Total Scenarios: 20

**Results:**
- Passed: _____ / 20
- Failed: _____ / 20
- Skipped: _____ / 20

### Critical Issues Found:
1. ___________________________________
2. ___________________________________
3. ___________________________________

### Minor Issues Found:
1. ___________________________________
2. ___________________________________
3. ___________________________________

### Recommendations:
1. ___________________________________
2. ___________________________________
3. ___________________________________

---

## 🎯 Acceptance Criteria

System is **READY FOR USE** if:

- ✅ All 20 scenarios pass
- ✅ No critical bugs found
- ✅ Voice recognition works consistently
- ✅ All CRUD operations function correctly
- ✅ UI is responsive and smooth
- ✅ No console errors

---

## 🐛 Common Issues & Solutions

### Issue: Microphone not detected
**Solution:** 
- Check browser permissions
- Try different browser (Chrome/Edge)
- Check system microphone settings

### Issue: Voice recognition stops working
**Solution:**
- Click stop button
- Restart conversation
- Refresh page if needed

### Issue: Tasks/memories don't appear
**Solution:**
- Check browser console for errors
- Verify backend is running
- Check network tab for API calls

### Issue: Response not speaking
**Solution:**
- Check system volume
- Verify speakers/headphones connected
- Try different voice in browser settings

---

## 📝 Testing Notes

**Tester Name:** ___________________  
**Date:** ___________________  
**Browser:** ___________________  
**OS:** ___________________  

**Additional Comments:**
_____________________________________________
_____________________________________________
_____________________________________________
_____________________________________________

---

## 🎉 Testing Complete!

If all scenarios pass, your Doraemon Voice Agent is **fully functional** and ready to use! 🚀

**Next Steps:**
1. Deploy to production (if needed)
2. Add custom features
3. Share with users
4. Gather feedback

---

*Happy Testing! 🧪*
