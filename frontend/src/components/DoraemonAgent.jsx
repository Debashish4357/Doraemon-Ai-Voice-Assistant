import { useState, useRef, useEffect, useCallback } from 'react';

const API = 'http://localhost:8000';

/**
 * Speak text using the browser's Speech Synthesis API.
 * Returns a promise that resolves when speaking is done.
 */
function speak(text, onStart, onEnd) {
  return new Promise((resolve) => {
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    utterance.volume = 1.0;
    
    // Prefer a clear English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) 
                   || voices.find(v => v.lang === 'en-US') 
                   || voices[0];
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => onStart?.();
    utterance.onend = () => { onEnd?.(); resolve(); };
    utterance.onerror = () => { onEnd?.(); resolve(); };
    
    window.speechSynthesis.speak(utterance);
  });
}

export default function DoraemonAgent() {
  const [status, setStatus] = useState('idle');       // idle | listening | thinking | speaking
  const [isRunning, setIsRunning] = useState(false);  // Is the conversation loop active?
  const [transcript, setTranscript] = useState('');   // Last user speech
  const [response, setResponse] = useState('Hi! I\'m Doraemon. Click the mic to start talking to me! 🎤');
  const [todos, setTodos] = useState([]);
  const [memories, setMemories] = useState([]);
  const [log, setLog] = useState([]);                 // Conversation history
  const [agentMode, setAgentMode] = useState('checking'); // checking | rule_based | llm_powered
  const [textInput, setTextInput] = useState('');         // Text input field
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState('add'); // add | edit
  const [editingTask, setEditingTask] = useState(null);
  const [newTaskText, setNewTaskText] = useState('');

  const recognitionRef = useRef(null);
  const shouldStopRef = useRef(false);    // Flag to break the loop

  // ─── Fetch sidebar data ────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [todosRes, memoriesRes] = await Promise.all([
        fetch(`${API}/todo/list`),
        fetch(`${API}/memory/list`)
      ]);
      const todosData = await todosRes.json();
      const memoriesData = await memoriesRes.json();
      setTodos(todosData.tasks || []);
      setMemories(memoriesData.memories || []);
    } catch (e) {
      console.error('Failed to fetch data:', e);
    }
  }, []);

  // ─── Check agent mode on mount ─────────────────────────────────────────────
  useEffect(() => {
    const checkMode = async () => {
      try {
        const res = await fetch(`${API}/agent/mode`);
        const data = await res.json();
        setAgentMode(data.llm_powered ? 'llm_powered' : 'rule_based');
        console.log('[Agent Mode]', data.llm_powered ? 'LLM-Powered (Groq)' : 'Rule-Based');
      } catch (e) {
        setAgentMode('rule_based');
        console.log('[Agent Mode] Rule-Based (fallback)');
      }
    };
    checkMode();
    fetchData();
  }, [fetchData]);

  // ─── Delete task ───────────────────────────────────────────────────────────
  const deleteTask = async (taskId) => {
    await fetch(`${API}/todo/delete/${taskId}`, { method: 'DELETE' });
    fetchData();
  };

  // ─── Add task manually ─────────────────────────────────────────────────────
  const addTaskManually = async () => {
    if (!newTaskText.trim()) return;
    
    try {
      await fetch(`${API}/todo/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: newTaskText.trim() })
      });
      setNewTaskText('');
      setShowTaskModal(false);
      fetchData();
      addLog('system', `Added task: "${newTaskText}"`);
    } catch (e) {
      console.error('Failed to add task:', e);
    }
  };

  // ─── Update task ───────────────────────────────────────────────────────────
  const updateTask = async () => {
    if (!newTaskText.trim() || !editingTask) return;
    try {
      await fetch(`${API}/todo/update/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: newTaskText.trim() })
      });
      setNewTaskText('');
      setEditingTask(null);
      setShowTaskModal(false);
      fetchData();
      addLog('system', `Updated task: "${newTaskText}"`);
    } catch (e) {
      console.error('Failed to update task:', e);
    }
  };

  // ─── Open task modal ───────────────────────────────────────────────────────
  const openAddTaskModal = () => {
    setTaskModalMode('add');
    setNewTaskText('');
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const openEditTaskModal = (task) => {
    setTaskModalMode('edit');
    setNewTaskText(task.text);
    setEditingTask(task);
    setShowTaskModal(true);
  };

  // ─── Add log entry ─────────────────────────────────────────────────────────
  const addLog = (role, text) => {
    setLog(prev => [...prev.slice(-20), { role, text, id: Date.now() }]);
  };

  // ─── Send text message ─────────────────────────────────────────────────────
  const sendTextMessage = async () => {
    if (!textInput.trim()) return;
    
    const message = textInput.trim();
    setTextInput('');
    addLog('user', message);
    setStatus('thinking');
    
    try {
      const useLLM = agentMode === 'llm_powered';
      const res = await fetch(`${API}/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, use_llm: useLLM })
      });
      const data = await res.json();
      const agentResponse = data.response;
      
      console.log('Agent response:', agentResponse);
      setResponse(agentResponse);
      addLog('agent', agentResponse);
      await fetchData();
      
      // Speak the response
      await speak(agentResponse, 
        () => setStatus('speaking'),
        () => setStatus('idle')
      );
    } catch (err) {
      console.error('Text message error:', err);
      const errMsg = 'Sorry, I had trouble processing your message.';
      setResponse(errMsg);
      addLog('agent', errMsg);
      setStatus('idle');
    }
  };

  // ─── Handle Enter key in text input ────────────────────────────────────────
  const handleTextKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  // ─── Single listen-respond cycle ───────────────────────────────────────────
  const listenAndRespond = useCallback(() => {
    return new Promise((resolve) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setResponse('❌ Your browser does not support Speech Recognition. Please use Chrome.');
        resolve(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setStatus('listening');
      recognition.start();

      recognition.onresult = async (event) => {
        const text = event.results[0][0].transcript;
        console.log('User said:', text);   // DEBUG
        setTranscript(text);
        addLog('user', text);
        
        setStatus('thinking');

        try {
          const useLLM = agentMode === 'llm_powered';
          const res = await fetch(`${API}/agent/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, use_llm: useLLM })
          });
          const data = await res.json();
          const agentResponse = data.response;

          console.log('Agent response:', agentResponse);  // DEBUG

          setResponse(agentResponse);
          addLog('agent', agentResponse);
          await fetchData(); // Update sidebar

          // Check for goodbye keywords to stop the loop
          const lower = text.toLowerCase();
          const isFarewell = ['bye', 'goodbye', 'exit', 'quit'].some(kw => lower.includes(kw));
          
          // Always speak the response
          await speak(agentResponse, 
            () => setStatus('speaking'),
            () => setStatus('idle')
          );

          resolve(!isFarewell); // false = stop loop on farewell

        } catch (err) {
          console.error('Agent fetch error:', err);  // DEBUG
          const errMsg = 'Sorry, I had trouble connecting to the server. Make sure the backend is running on port 8000.';
          setResponse(errMsg);
          addLog('agent', errMsg);
          await speak(errMsg, () => setStatus('speaking'), () => setStatus('idle'));
          resolve(false);
        }
      };

      recognition.onnomatch = () => {
        setTranscript('');
        resolve(true); // Continue loop on no match
      };

      recognition.onerror = (event) => {
        if (event.error === 'no-speech') {
          resolve(true); // Just keep listening
        } else if (event.error === 'aborted') {
          resolve(false);
        } else {
          setResponse(`Mic error: ${event.error}`);
          resolve(false);
        }
      };
    });
  }, [fetchData]);

  // ─── Start the conversation loop ───────────────────────────────────────────
  const startConversation = async () => {
    setIsRunning(true);
    shouldStopRef.current = false;

    // Just start listening — no hardcoded greeting.
    // The user will trigger a greeting by saying "hi" / "hello" if they want one.
    setResponse('Listening... Say something!');
    setStatus('idle');

    // Continuous listen loop
    while (!shouldStopRef.current) {
      const shouldContinue = await listenAndRespond();
      if (!shouldContinue || shouldStopRef.current) break;
      // Small pause between turns
      await new Promise(r => setTimeout(r, 300));
    }

    setIsRunning(false);
    setStatus('idle');
  };

  // ─── Stop the conversation ─────────────────────────────────────────────────
  const stopConversation = () => {
    shouldStopRef.current = true;
    recognitionRef.current?.abort();
    window.speechSynthesis.cancel();
    setIsRunning(false);
    setStatus('idle');
    setTranscript('');
  };

  // ─── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      shouldStopRef.current = true;
      recognitionRef.current?.abort();
      window.speechSynthesis.cancel();
    };
  }, []);

  // ─── Status label helper ───────────────────────────────────────────────────
  const statusLabel = {
    idle: 'Ready',
    listening: 'Listening...',
    thinking: 'Thinking...',
    speaking: 'Speaking...',
  }[status];

  return (
    <div className="app">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-brand">
          <div className="brand-icon">🤖</div>
          <div>
            <div className="brand-name">Doraemon</div>
            <div className="brand-tagline">Your AI Voice Assistant</div>
          </div>
        </div>
        <div className="header-status">
          <div className="status-dot"></div>
          {agentMode === 'llm_powered' ? 'LLM Mode (Groq)' : agentMode === 'rule_based' ? 'Rule-Based Mode' : 'Checking...'}
        </div>
      </header>

      {/* ── Main Voice Panel ────────────────────────────────────────── */}
      <main className="voice-panel">
        {/* Orb */}
        <div className="orb-container">
          <div className={`orb-rings ${status === 'listening' ? 'active' : ''}`}>
            <div className="orb-ring"></div>
            <div className="orb-ring"></div>
            <div className="orb-ring"></div>
          </div>
          <div className={`orb ${status}`} onClick={isRunning ? stopConversation : startConversation}>
            <span className="orb-icon">
              {status === 'idle' && '🤖'}
              {status === 'listening' && '🎙️'}
              {status === 'thinking' && '💭'}
              {status === 'speaking' && '🔊'}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`status-badge ${status}`}>
          {(status === 'listening' || status === 'thinking') && <div className="status-spinner"></div>}
          {statusLabel}
        </div>

        {/* Transcript (what user said) */}
        <div className="transcript-box">
          <div className="transcript-label">🎤 You said</div>
          <div className="transcript-text">
            {transcript || (isRunning ? 'Waiting for your voice...' : 'Click the orb to start talking!')}
          </div>
        </div>

        {/* Agent Response */}
        <div className="response-box">
          <div className="response-label">🤖 Doraemon says</div>
          <div className="response-text">{response}</div>
        </div>

        {/* Mic Button */}
        <button
          className={`mic-btn ${isRunning ? 'stop' : 'start'}`}
          onClick={isRunning ? stopConversation : startConversation}
        >
          {isRunning ? '⏹' : '🎤'}
        </button>
        <p className="mic-hint">
          {isRunning ? 'Click to stop the conversation' : 'Click to start talking with Doraemon'}
        </p>

        {/* Quick commands reference */}
        <div className="commands-box">
          <div className="commands-title">💡 Try saying:</div>
          <ul className="commands-list">
            <li>"Add task buy groceries"</li>
            <li>"Show my tasks"</li>
            <li>"Remember my exam is Monday"</li>
            <li>"What did I tell you?"</li>
            <li>"Goodbye" (to end)</li>
          </ul>
        </div>

        {/* Text Input Section */}
        <div className="text-input-section">
          <div className="text-input-header">
            <span>✍️ Type a message</span>
            <span className="text-hint">or use voice above</span>
          </div>
          <div className="text-input-container">
            <input
              type="text"
              className="text-input"
              placeholder="Type your message here..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleTextKeyPress}
              disabled={isRunning}
            />
            <button 
              className="send-btn"
              onClick={sendTextMessage}
              disabled={!textInput.trim() || isRunning}
            >
              ➤
            </button>
          </div>
        </div>
      </main>

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="sidebar">
        {/* Tasks */}
        <div className="sidebar-section">
          <div className="section-header">
            <div className="section-title">
              ✅ Tasks
            </div>
            <div className="section-actions">
              <span className="section-count">{todos.length}</span>
              <button className="add-task-btn" onClick={openAddTaskModal} title="Add task">
                +
              </button>
            </div>
          </div>
          {todos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              No tasks yet. Say "add task..." or click +
            </div>
          ) : (
            <div className="task-list">
              {todos.map(task => (
                <div key={task.id} className="task-item">
                  <div className="task-dot"></div>
                  <span className="task-text">{task.text}</span>
                  <div className="task-actions">
                    <button className="task-edit" onClick={() => openEditTaskModal(task)} title="Edit">
                      ✎
                    </button>
                    <button className="task-delete" onClick={() => deleteTask(task.id)} title="Delete">
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Memory */}
        <div className="sidebar-section">
          <div className="section-header">
            <div className="section-title">🧠 Memory</div>
            <span className="section-count">{memories.length}</span>
          </div>
          {memories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💭</div>
              No memories yet. Say "remember..."
            </div>
          ) : (
            <div className="memory-list">
              {memories.map(mem => (
                <div key={mem.id} className="memory-item">
                  {mem.content}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversation Log */}
        <div className="log-section">
          <div className="section-header">
            <div className="section-title">💬 Conversation</div>
          </div>
          {log.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🗨️</div>
              Your conversation will appear here.
            </div>
          ) : (
            <div className="log-list">
              {log.map(entry => (
                <div key={entry.id} className="log-item">
                  <div className={`log-avatar ${entry.role}`}>
                    {entry.role === 'user' ? 'U' : entry.role === 'agent' ? 'D' : '⚙'}
                  </div>
                  <div className="log-bubble">{entry.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── Task Modal ──────────────────────────────────────────────── */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{taskModalMode === 'add' ? '➕ Add New Task' : '✎ Edit Task'}</h3>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="modal-input"
                placeholder="Enter task description..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    taskModalMode === 'add' ? addTaskManually() : updateTask();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setShowTaskModal(false)}>
                Cancel
              </button>
              <button 
                className="modal-btn primary" 
                onClick={taskModalMode === 'add' ? addTaskManually : updateTask}
                disabled={!newTaskText.trim()}
              >
                {taskModalMode === 'add' ? 'Add Task' : 'Update Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
