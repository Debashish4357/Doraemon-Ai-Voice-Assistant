import { useState, useRef, useEffect, useCallback } from 'react';

const API = 'http://localhost:8000';

// ── TTS helper ─────────────────────────────────────────────────────────────────
function speak(text, onStart, onEnd) {
  return new Promise((resolve) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate  = 1.0;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    // Pick best available English voice
    const voices = window.speechSynthesis.getVoices();
    const voice  = voices.find(v => v.lang === 'en-US' && v.name.includes('Google'))
                || voices.find(v => v.lang === 'en-US')
                || voices[0];
    if (voice) utterance.voice = voice;

    utterance.onstart = () => onStart?.();
    utterance.onend   = () => { onEnd?.(); resolve(); };
    utterance.onerror = () => { onEnd?.(); resolve(); };
    window.speechSynthesis.speak(utterance);
  });
}

// ── Tone beep helper ───────────────────────────────────────────────────────────
function playTone(freq = 440, duration = 0.12, type = 'sine') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (_) {}
}

export default function DoraemonAgent() {
  const [status,        setStatus]        = useState('idle');
  const [isRunning,     setIsRunning]      = useState(false);
  const [transcript,    setTranscript]     = useState('');
  const [response,      setResponse]       = useState("Hi! I'm Doraemon. Click 🎤 to start talking.");
  const [todos,         setTodos]          = useState([]);
  const [memories,      setMemories]       = useState([]);
  const [log,           setLog]            = useState([]);
  const [agentMode,     setAgentMode]      = useState('checking');
  const [textInput,     setTextInput]      = useState('');
  const [showModal,     setShowModal]      = useState(false);
  const [modalMode,     setModalMode]      = useState('add');   // 'add' | 'edit'
  const [editingTask,   setEditingTask]    = useState(null);
  const [modalText,     setModalText]      = useState('');

  const recognitionRef  = useRef(null);
  const shouldStopRef   = useRef(false);
  const logEndRef       = useRef(null);

  // ── Auto-scroll conversation log ────────────────────────────────────────────
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [log]);

  // ── Fetch sidebar data ───────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [tRes, mRes] = await Promise.all([
        fetch(`${API}/todo/list`),
        fetch(`${API}/memory/list`)
      ]);
      const tData = await tRes.json();
      const mData = await mRes.json();
      setTodos(tData.tasks    || []);
      setMemories(mData.memories || []);
    } catch (e) {
      console.error('[fetchData]', e);
    }
  }, []);

  // ── Check agent mode + initial data load ────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API}/agent/mode`);
        const data = await res.json();
        setAgentMode(data.llm_powered ? 'llm_powered' : 'rule_based');
        console.log('[Mode]', data.active_mode, data.model);
      } catch {
        setAgentMode('rule_based');
      }
      fetchData();
    })();
  }, [fetchData]);

  // ── Add to conversation log ──────────────────────────────────────────────────
  const addLog = useCallback((role, text) => {
    setLog(prev => [...prev.slice(-30), { role, text, id: Date.now() + Math.random() }]);
  }, []);

  // ── Send message to backend ──────────────────────────────────────────────────
  const sendToAgent = useCallback(async (message) => {
    if (!message.trim()) return;
    addLog('user', message);
    setStatus('thinking');

    try {
      const res  = await fetch(`${API}/agent/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message, session_id: 'default' })
      });
      const data = await res.json();
      const reply = data.response || "I'm not sure how to help with that.";

      console.log('[User]', message);
      console.log('[Agent]', reply);

      setResponse(reply);
      addLog('agent', reply);
      await fetchData();

      await speak(reply, () => setStatus('speaking'), () => setStatus('idle'));
      return reply;
    } catch (err) {
      console.error('[sendToAgent]', err);
      const errMsg = 'Connection error. Is the backend running on port 8000?';
      setResponse(errMsg);
      addLog('agent', errMsg);
      await speak(errMsg, () => setStatus('speaking'), () => setStatus('idle'));
      return null;
    }
  }, [addLog, fetchData]);

  // ── Single voice listen cycle ────────────────────────────────────────────────
  const listenOnce = useCallback(() => {
    return new Promise((resolve) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        setResponse('Speech Recognition not supported. Use Chrome or Edge.');
        resolve({ text: null, stop: true });
        return;
      }

      const rec = new SR();
      recognitionRef.current = rec;
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      setStatus('listening');
      playTone(660, 0.1);
      rec.start();

      rec.onresult = (e) => {
        const text = e.results[0][0].transcript.trim();
        setTranscript(text);
        resolve({ text, stop: false });
      };

      rec.onnomatch = () => resolve({ text: null, stop: false });

      rec.onerror = (e) => {
        if (e.error === 'no-speech')  resolve({ text: null, stop: false });
        else if (e.error === 'aborted') resolve({ text: null, stop: true });
        else { console.warn('[SpeechError]', e.error); resolve({ text: null, stop: true }); }
      };
    });
  }, []);

  // ── Continuous conversation loop ─────────────────────────────────────────────
  const startConversation = useCallback(async () => {
    setIsRunning(true);
    shouldStopRef.current = false;
    setTranscript('');
    setStatus('idle');

    while (!shouldStopRef.current) {
      const { text, stop } = await listenOnce();
      if (stop || shouldStopRef.current) break;
      if (!text) continue;

      const reply = await sendToAgent(text);

      // Stop loop on farewell
      const lower = text.toLowerCase();
      const isFarewell = ['bye', 'goodbye', 'exit', 'quit', 'stop'].some(kw => lower.includes(kw));
      if (isFarewell || shouldStopRef.current) break;

      // Brief pause before next listen
      await new Promise(r => setTimeout(r, 400));
    }

    setIsRunning(false);
    setStatus('idle');
    playTone(440, 0.1);
  }, [listenOnce, sendToAgent]);

  // ── Stop conversation ────────────────────────────────────────────────────────
  const stopConversation = useCallback(() => {
    shouldStopRef.current = true;
    recognitionRef.current?.abort();
    window.speechSynthesis.cancel();
    setIsRunning(false);
    setStatus('idle');
    setTranscript('');
  }, []);

  // ── Text input send ──────────────────────────────────────────────────────────
  const sendText = useCallback(async () => {
    const msg = textInput.trim();
    if (!msg) return;
    setTextInput('');
    await sendToAgent(msg);
  }, [textInput, sendToAgent]);

  const onTextKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); }
  };

  // ── Task CRUD ────────────────────────────────────────────────────────────────
  const deleteTask = async (id) => {
    await fetch(`${API}/todo/delete/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const openAddModal = () => {
    setModalMode('add'); setModalText(''); setEditingTask(null); setShowModal(true);
  };

  const openEditModal = (task) => {
    setModalMode('edit'); setModalText(task.text); setEditingTask(task); setShowModal(true);
  };

  const submitModal = async () => {
    if (!modalText.trim()) return;
    if (modalMode === 'add') {
      await fetch(`${API}/todo/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: modalText.trim() })
      });
      addLog('system', `Task added: "${modalText.trim()}"`);
    } else {
      await fetch(`${API}/todo/update/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: modalText.trim() })
      });
      addLog('system', `Task updated: "${modalText.trim()}"`);
    }
    setShowModal(false); setModalText(''); setEditingTask(null);
    fetchData();
  };

  // ── Cleanup ──────────────────────────────────────────────────────────────────
  useEffect(() => () => {
    shouldStopRef.current = true;
    recognitionRef.current?.abort();
    window.speechSynthesis.cancel();
  }, []);

  // ── Status label ─────────────────────────────────────────────────────────────
  const statusLabel = { idle: 'Ready', listening: 'Listening...', thinking: 'Thinking...', speaking: 'Speaking...' }[status];
  const modeLabel   = agentMode === 'llm_powered' ? '⚡ LLM Mode' : agentMode === 'rule_based' ? '📋 Rule-Based' : '...';

  return (
    <div className="app">

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-brand">
          <div className="brand-icon">🤖</div>
          <div>
            <div className="brand-name">Doraemon</div>
            <div className="brand-tagline">AI Voice Assistant</div>
          </div>
        </div>
        <div className="header-status">
          <div className="status-dot"></div>
          {modeLabel}
        </div>
      </header>

      {/* ── MAIN PANEL ──────────────────────────────────────────────── */}
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
              {status === 'idle'      && '🤖'}
              {status === 'listening' && '🎙️'}
              {status === 'thinking'  && '💭'}
              {status === 'speaking'  && '🔊'}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <div className={`status-badge ${status}`}>
          {(status === 'listening' || status === 'thinking') && <div className="status-spinner"></div>}
          {statusLabel}
        </div>

        {/* Transcript */}
        <div className="transcript-box">
          <div className="transcript-label">🎤 You said</div>
          <div className="transcript-text">
            {transcript || (isRunning ? 'Waiting for your voice...' : 'Click the orb or mic button to start')}
          </div>
        </div>

        {/* Response */}
        <div className="response-box">
          <div className="response-label">🤖 Doraemon says</div>
          <div className="response-text">{response}</div>
        </div>

        {/* Mic button */}
        <button className={`mic-btn ${isRunning ? 'stop' : 'start'}`}
                onClick={isRunning ? stopConversation : startConversation}>
          {isRunning ? '⏹' : '🎤'}
        </button>
        <p className="mic-hint">
          {isRunning ? 'Click to stop' : 'Click to start voice conversation'}
        </p>

        {/* Quick commands */}
        <div className="commands-box">
          <div className="commands-title">💡 Try saying:</div>
          <ul className="commands-list">
            <li>"Add task buy groceries"</li>
            <li>"Show my tasks"</li>
            <li>"Delete task buy groceries"</li>
            <li>"Remember my exam is Monday"</li>
            <li>"What did I tell you?"</li>
          </ul>
        </div>

        {/* Text input — always enabled */}
        <div className="text-input-section">
          <div className="text-input-header">
            <span>✍️ Or type a message</span>
            <span className="text-hint">works alongside voice</span>
          </div>
          <div className="text-input-container">
            <input
              type="text"
              className="text-input"
              placeholder="Type here and press Enter..."
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={onTextKey}
            />
            <button className="send-btn" onClick={sendText} disabled={!textInput.trim()}>
              ➤
            </button>
          </div>
        </div>

      </main>

      {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
      <aside className="sidebar">

        {/* Tasks */}
        <div className="sidebar-section">
          <div className="section-header">
            <div className="section-title">✅ Tasks</div>
            <div className="section-actions">
              <span className="section-count">{todos.length}</span>
              <button className="add-task-btn" onClick={openAddModal} title="Add task">+</button>
            </div>
          </div>
          {todos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              No tasks yet. Say "add task…" or click +
            </div>
          ) : (
            <div className="task-list">
              {todos.map(task => (
                <div key={task.id} className="task-item">
                  <div className="task-dot"></div>
                  <span className="task-text">{task.text}</span>
                  <div className="task-actions">
                    <button className="task-edit"   onClick={() => openEditModal(task)} title="Edit">✎</button>
                    <button className="task-delete" onClick={() => deleteTask(task.id)} title="Delete">✕</button>
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
              No memories yet. Say "remember…"
            </div>
          ) : (
            <div className="memory-list">
              {memories.map(mem => (
                <div key={mem.id} className="memory-item">{mem.content}</div>
              ))}
            </div>
          )}
        </div>

        {/* Conversation log */}
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
              <div ref={logEndRef} />
            </div>
          )}
        </div>

      </aside>

      {/* ── TASK MODAL ──────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalMode === 'add' ? '➕ Add Task' : '✎ Edit Task'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="modal-input"
                placeholder="Task description..."
                value={modalText}
                onChange={e => setModalText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitModal()}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="modal-btn primary" onClick={submitModal} disabled={!modalText.trim()}>
                {modalMode === 'add' ? 'Add Task' : 'Update Task'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
