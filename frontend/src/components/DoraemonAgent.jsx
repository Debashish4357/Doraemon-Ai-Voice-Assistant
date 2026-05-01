import { useState, useRef, useEffect, useCallback } from 'react';

const API        = 'http://localhost:8000';
const AVATAR_SRC = '/default.png';

const SUGGESTIONS = [
  { icon: '✅', label: 'Add task buy groceries',       msg: 'Add task buy groceries' },
  { icon: '🧠', label: 'Remember my exam is tomorrow', msg: 'Remember my exam is tomorrow' },
  { icon: '📋', label: 'Show my tasks',                msg: 'Show my tasks' },
  { icon: '💬', label: 'What did I tell you?',         msg: 'What did I tell you?' },
];

// ── TTS ────────────────────────────────────────────────────────────────────────
function speak(text, onStart, onEnd) {
  return new Promise((resolve) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.0; utt.pitch = 1.05; utt.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.lang === 'en-US' && v.name.includes('Google'))
           || voices.find(v => v.lang === 'en-US') || voices[0];
    if (v) utt.voice = v;
    utt.onstart = () => onStart?.();
    utt.onend   = () => { onEnd?.(); resolve(); };
    utt.onerror = () => { onEnd?.(); resolve(); };
    window.speechSynthesis.speak(utt);
  });
}

function playTone(freq = 660, dur = 0.1) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch (_) {}
}

// ── Typing dots component ──────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="typing-dots">
      <span /><span /><span />
    </div>
  );
}

// ── Single message bubble ──────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`msg-row ${isUser ? 'msg-row--user' : 'msg-row--agent'}`}>
      {!isUser && (
        <div className="msg-avatar">
          <img src={AVATAR_SRC} alt="Doraemon" />
        </div>
      )}
      <div className={`msg-bubble ${isUser ? 'msg-bubble--user' : 'msg-bubble--agent'}`}>
        {msg.typing ? <TypingDots /> : msg.text}
      </div>
      {isUser && <div className="msg-avatar msg-avatar--user">You</div>}
    </div>
  );
}

export default function DoraemonAgent() {
  const [messages,    setMessages]    = useState([]);   // { id, role, text, typing? }
  const [status,      setStatus]      = useState('idle');
  const [isRunning,   setIsRunning]   = useState(false);
  const [todos,       setTodos]       = useState([]);
  const [memories,    setMemories]    = useState([]);
  const [agentMode,   setAgentMode]   = useState('checking');
  const [textInput,   setTextInput]   = useState('');
  const [showModal,   setShowModal]   = useState(false);
  const [modalMode,   setModalMode]   = useState('add');
  const [editingTask, setEditingTask] = useState(null);
  const [modalText,   setModalText]   = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const recognitionRef = useRef(null);
  const shouldStopRef  = useRef(false);
  const bottomRef      = useRef(null);
  const inputRef       = useRef(null);
  const typingIdRef    = useRef(null);

  // auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Fetch sidebar data ───────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [tRes, mRes] = await Promise.all([
        fetch(`${API}/todo/list`), fetch(`${API}/memory/list`)
      ]);
      setTodos((await tRes.json()).tasks    || []);
      setMemories((await mRes.json()).memories || []);
    } catch (e) { console.error('[fetchData]', e); }
  }, []);

  // ── Init ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const d = await (await fetch(`${API}/agent/mode`)).json();
        setAgentMode(d.llm_powered ? 'llm_powered' : 'rule_based');
      } catch { setAgentMode('rule_based'); }
      fetchData();
    })();
  }, [fetchData]);

  // ── Add message to thread ────────────────────────────────────────────────────
  const pushMsg = useCallback((role, text, extra = {}) => {
    const id = Date.now() + Math.random();
    setMessages(prev => [...prev, { id, role, text, ...extra }]);
    return id;
  }, []);

  const updateMsg = useCallback((id, patch) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  }, []);

  // ── Send to agent ────────────────────────────────────────────────────────────
  const sendToAgent = useCallback(async (message) => {
    if (!message.trim()) return;

    // Add user bubble
    pushMsg('user', message);
    setStatus('thinking');

    // Add typing indicator for agent
    const typingId = pushMsg('agent', '', { typing: true });
    typingIdRef.current = typingId;

    try {
      const res   = await fetch(`${API}/agent/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, session_id: 'default' })
      });
      const data  = await res.json();
      const reply = data.response || "I'm not sure how to help.";

      console.log('[User]', message);
      console.log('[Agent]', reply);

      // Replace typing indicator with real reply
      updateMsg(typingId, { text: reply, typing: false });
      await fetchData();
      await speak(reply, () => setStatus('speaking'), () => setStatus('idle'));
      return reply;
    } catch (err) {
      console.error('[sendToAgent]', err);
      const errMsg = 'Connection error. Is the backend running on port 8000?';
      updateMsg(typingId, { text: errMsg, typing: false });
      await speak(errMsg, () => setStatus('speaking'), () => setStatus('idle'));
      return null;
    }
  }, [pushMsg, updateMsg, fetchData]);

  // ── Voice listen once ────────────────────────────────────────────────────────
  const listenOnce = useCallback(() => new Promise((resolve) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      pushMsg('agent', 'Speech Recognition not supported. Please use Chrome or Edge.');
      resolve({ text: null, stop: true });
      return;
    }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;
    setStatus('listening'); playTone(660, 0.1);
    rec.start();
    rec.onresult  = e => resolve({ text: e.results[0][0].transcript.trim(), stop: false });
    rec.onnomatch = () => resolve({ text: null, stop: false });
    rec.onerror   = e => {
      if (e.error === 'no-speech') resolve({ text: null, stop: false });
      else resolve({ text: null, stop: true });
    };
  }), [pushMsg]);

  // ── Conversation loop ────────────────────────────────────────────────────────
  const startConversation = useCallback(async () => {
    setIsRunning(true); shouldStopRef.current = false; setStatus('idle');
    while (!shouldStopRef.current) {
      const { text, stop } = await listenOnce();
      if (stop || shouldStopRef.current) break;
      if (!text) continue;
      await sendToAgent(text);
      if (['bye','goodbye','exit','quit'].some(k => text.toLowerCase().includes(k))) break;
      await new Promise(r => setTimeout(r, 400));
    }
    setIsRunning(false); setStatus('idle'); playTone(440, 0.1);
  }, [listenOnce, sendToAgent]);

  const stopConversation = useCallback(() => {
    shouldStopRef.current = true;
    recognitionRef.current?.abort();
    window.speechSynthesis.cancel();
    setIsRunning(false); setStatus('idle');
  }, []);

  // ── Text send ────────────────────────────────────────────────────────────────
  const sendText = useCallback(async () => {
    const msg = textInput.trim(); if (!msg) return;
    setTextInput(''); await sendToAgent(msg);
  }, [textInput, sendToAgent]);

  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); } };

  // ── Chip click ───────────────────────────────────────────────────────────────
  const onChip = msg => { sendToAgent(msg); };

  // ── Task CRUD ────────────────────────────────────────────────────────────────
  const deleteTask  = async id => { await fetch(`${API}/todo/delete/${id}`, { method: 'DELETE' }); fetchData(); };
  const openAdd     = () => { setModalMode('add'); setModalText(''); setEditingTask(null); setShowModal(true); };
  const openEdit    = t  => { setModalMode('edit'); setModalText(t.text); setEditingTask(t); setShowModal(true); };
  const submitModal = async () => {
    if (!modalText.trim()) return;
    if (modalMode === 'add') {
      await fetch(`${API}/todo/add`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ task: modalText.trim() }) });
    } else {
      await fetch(`${API}/todo/update/${editingTask.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ task: modalText.trim() }) });
    }
    setShowModal(false); setModalText(''); setEditingTask(null); fetchData();
  };

  useEffect(() => () => {
    shouldStopRef.current = true;
    recognitionRef.current?.abort();
    window.speechSynthesis.cancel();
  }, []);

  const isEmpty = messages.length === 0;

  // ── Status label ─────────────────────────────────────────────────────────────
  const statusLabel = { idle: null, listening: 'Listening...', thinking: 'Thinking...', speaking: 'Speaking...' }[status];

  return (
    <div className="app-root">

      {/* ── TOPBAR ──────────────────────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo">
            <img src={AVATAR_SRC} alt="Doraemon" />
          </div>
          <div>
            <div className="topbar-name">Doraemon AI</div>
            <div className="topbar-sub">Voice Assistant</div>
          </div>
        </div>

        <div className="topbar-right">
          {statusLabel && (
            <div className={`status-indicator status-${status}`}>
              {status === 'listening' && <span className="eq-bars"><b/><b/><b/><b/><b/></span>}
              {status === 'thinking'  && <span className="spin-dot">◌</span>}
              {status === 'speaking'  && <span className="wave-dot">🔊</span>}
              {statusLabel}
            </div>
          )}
          <div className="mode-pill">
            <span className="mode-dot" />
            {agentMode === 'llm_powered' ? '⚡ LLM Mode' : '📋 Rule-Based'}
          </div>
          <button className="icon-btn" onClick={() => setSidebarOpen(o => !o)} title="Toggle sidebar">
            ☰
          </button>
        </div>
      </header>

      {/* ── BODY ────────────────────────────────────────────────────── */}
      <div className="body-wrap">

        {/* ── CHAT AREA ───────────────────────────────────────────── */}
        <main className="chat-area">

          {/* Empty state — shown before any messages */}
          {isEmpty && (
            <div className="empty-state">
              <div className={`hero-avatar status-${status}`}>
                <div className="hero-ring" />
                <div className="hero-ring hero-ring2" />
                <div className="hero-circle">
                  <img src={AVATAR_SRC} alt="Doraemon" />
                </div>
              </div>
              <h2 className="empty-title">Hi, I'm Doraemon</h2>
              <p className="empty-sub">Your AI voice assistant. Ask me anything or try a suggestion below.</p>
              <div className="chip-grid">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="chip" onClick={() => onChip(s.msg)}>
                    <span className="chip-icon">{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat thread */}
          {!isEmpty && (
            <div className="chat-thread">
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}

        </main>

        {/* ── SIDEBAR ─────────────────────────────────────────────── */}
        {sidebarOpen && (
          <aside className="sidebar">

            {/* Tasks */}
            <div className="sb-card">
              <div className="sb-card-head">
                <span>✅</span>
                <span className="sb-card-title">Tasks</span>
                <span className="sb-badge">{todos.length}</span>
                <button className="sb-add" onClick={openAdd}>+</button>
              </div>
              {todos.length === 0 ? (
                <div className="sb-empty">No tasks yet</div>
              ) : (
                <div className="sb-list">
                  {todos.map(t => (
                    <div key={t.id} className="sb-item">
                      <span className="sb-dot" />
                      <span className="sb-item-text">{t.text}</span>
                      <div className="sb-item-actions">
                        <button onClick={() => openEdit(t)}>✎</button>
                        <button onClick={() => deleteTask(t.id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Memory */}
            <div className="sb-card">
              <div className="sb-card-head">
                <span>🧠</span>
                <span className="sb-card-title">Memory</span>
                <span className="sb-badge">{memories.length}</span>
              </div>
              {memories.length === 0 ? (
                <div className="sb-empty">Say "remember..."</div>
              ) : (
                <div className="sb-list">
                  {memories.map(m => (
                    <div key={m.id} className="sb-mem-item">
                      <span className="sb-mem-dot">◆</span>
                      <span>{m.content}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </aside>
        )}
      </div>

      {/* ── BOTTOM INPUT BAR ────────────────────────────────────────── */}
      <div className="input-dock">
        {/* Chips shown above input when chat is active */}
        {!isEmpty && (
          <div className="input-chips">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="chip chip--sm" onClick={() => onChip(s.msg)}>
                <span>{s.icon}</span> {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="input-bar">
          {/* Mic button */}
          <button
            className={`mic-btn ${isRunning ? 'mic-btn--active' : ''}`}
            onClick={isRunning ? stopConversation : startConversation}
            title={isRunning ? 'Stop listening' : 'Start voice'}
          >
            {isRunning
              ? <span className="mic-eq"><b/><b/><b/><b/><b/></span>
              : <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 17.93V21h2v-2.07A8.001 8.001 0 0 0 20 11h-2a6 6 0 0 1-12 0H4a8.001 8.001 0 0 0 7 7.93z"/>
                </svg>
            }
          </button>

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder="Message Doraemon..."
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={onKey}
          />

          {/* Send button */}
          <button
            className="send-btn"
            onClick={sendText}
            disabled={!textInput.trim()}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── TASK MODAL ──────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{modalMode === 'add' ? '➕ Add Task' : '✎ Edit Task'}</h3>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <input
              className="modal-inp"
              placeholder="Task description..."
              value={modalText}
              onChange={e => setModalText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitModal()}
              autoFocus
            />
            <div className="modal-foot">
              <button className="modal-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="modal-ok" onClick={submitModal} disabled={!modalText.trim()}>
                {modalMode === 'add' ? 'Add Task' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
