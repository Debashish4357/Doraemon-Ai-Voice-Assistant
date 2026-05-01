import { useState, useRef, useEffect, useCallback } from 'react';

const API = 'http://localhost:8000';

// ── Doraemon avatar — uses the image from /public/default.png
const AVATAR_SRC = '/default.png';

// ── Suggestion chips shown below the avatar
const SUGGESTIONS = [
  { icon: '✅', label: 'Add task buy groceries',        msg: 'Add task buy groceries' },
  { icon: '🧠', label: 'Remember my exam is tomorrow',  msg: 'Remember my exam is tomorrow' },
  { icon: '📋', label: 'Show my tasks',                 msg: 'Show my tasks' },
  { icon: '💬', label: 'What did I tell you?',          msg: 'What did I tell you?' },
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

// ── Tone beep ──────────────────────────────────────────────────────────────────
function playTone(freq = 660, dur = 0.1) {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch (_) {}
}

export default function DoraemonAgent() {
  const [status,      setStatus]      = useState('idle');
  const [isRunning,   setIsRunning]   = useState(false);
  const [transcript,  setTranscript]  = useState('');
  const [agentReply,  setAgentReply]  = useState('');
  const [todos,       setTodos]       = useState([]);
  const [memories,    setMemories]    = useState([]);
  const [log,         setLog]         = useState([]);
  const [agentMode,   setAgentMode]   = useState('checking');
  const [textInput,   setTextInput]   = useState('');
  const [showModal,   setShowModal]   = useState(false);
  const [modalMode,   setModalMode]   = useState('add');
  const [editingTask, setEditingTask] = useState(null);
  const [modalText,   setModalText]   = useState('');
  const [showSettings,setShowSettings]= useState(false);

  const recognitionRef = useRef(null);
  const shouldStopRef  = useRef(false);
  const logEndRef      = useRef(null);
  const inputRef       = useRef(null);

  // auto-scroll log
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [log]);

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

  // ── Log helper ───────────────────────────────────────────────────────────────
  const addLog = useCallback((role, text) => {
    setLog(prev => [...prev.slice(-40), { role, text, id: Date.now() + Math.random() }]);
  }, []);

  // ── Send to agent ────────────────────────────────────────────────────────────
  const sendToAgent = useCallback(async (message) => {
    if (!message.trim()) return;
    addLog('user', message);
    setStatus('thinking');
    try {
      const res  = await fetch(`${API}/agent/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, session_id: 'default' })
      });
      const data  = await res.json();
      const reply = data.response || "I'm not sure how to help.";
      console.log('[User]', message, '\n[Agent]', reply);
      setAgentReply(reply);
      addLog('agent', reply);
      await fetchData();
      await speak(reply, () => setStatus('speaking'), () => setStatus('idle'));
      return reply;
    } catch (err) {
      console.error('[sendToAgent]', err);
      const msg = 'Connection error. Is the backend running?';
      setAgentReply(msg);
      addLog('agent', msg);
      await speak(msg, () => setStatus('speaking'), () => setStatus('idle'));
      return null;
    }
  }, [addLog, fetchData]);

  // ── Voice listen once ────────────────────────────────────────────────────────
  const listenOnce = useCallback(() => new Promise((resolve) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setAgentReply('Speech Recognition not supported. Use Chrome.'); resolve({ text: null, stop: true }); return; }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;
    setStatus('listening'); playTone(660, 0.1);
    rec.start();
    rec.onresult  = e => { setTranscript(e.results[0][0].transcript.trim()); resolve({ text: e.results[0][0].transcript.trim(), stop: false }); };
    rec.onnomatch = () => resolve({ text: null, stop: false });
    rec.onerror   = e => {
      if (e.error === 'no-speech') resolve({ text: null, stop: false });
      else if (e.error === 'aborted') resolve({ text: null, stop: true });
      else resolve({ text: null, stop: true });
    };
  }), []);

  // ── Conversation loop ────────────────────────────────────────────────────────
  const startConversation = useCallback(async () => {
    setIsRunning(true); shouldStopRef.current = false;
    setTranscript(''); setStatus('idle');
    while (!shouldStopRef.current) {
      const { text, stop } = await listenOnce();
      if (stop || shouldStopRef.current) break;
      if (!text) continue;
      await sendToAgent(text);
      if (['bye','goodbye','exit','quit','stop'].some(k => text.toLowerCase().includes(k))) break;
      await new Promise(r => setTimeout(r, 400));
    }
    setIsRunning(false); setStatus('idle'); playTone(440, 0.1);
  }, [listenOnce, sendToAgent]);

  const stopConversation = useCallback(() => {
    shouldStopRef.current = true;
    recognitionRef.current?.abort();
    window.speechSynthesis.cancel();
    setIsRunning(false); setStatus('idle'); setTranscript('');
  }, []);

  // ── Text send ────────────────────────────────────────────────────────────────
  const sendText = useCallback(async () => {
    const msg = textInput.trim(); if (!msg) return;
    setTextInput(''); await sendToAgent(msg);
  }, [textInput, sendToAgent]);

  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); } };

  // ── Chip click ───────────────────────────────────────────────────────────────
  const onChip = (msg) => { setTextInput(msg); inputRef.current?.focus(); sendToAgent(msg); };

  // ── Task CRUD ────────────────────────────────────────────────────────────────
  const deleteTask = async id => { await fetch(`${API}/todo/delete/${id}`, { method: 'DELETE' }); fetchData(); };
  const openAdd    = () => { setModalMode('add'); setModalText(''); setEditingTask(null); setShowModal(true); };
  const openEdit   = t  => { setModalMode('edit'); setModalText(t.text); setEditingTask(t); setShowModal(true); };
  const submitModal = async () => {
    if (!modalText.trim()) return;
    if (modalMode === 'add') {
      await fetch(`${API}/todo/add`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ task: modalText.trim() }) });
      addLog('system', `Task added: "${modalText.trim()}"`);
    } else {
      await fetch(`${API}/todo/update/${editingTask.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ task: modalText.trim() }) });
      addLog('system', `Task updated: "${modalText.trim()}"`);
    }
    setShowModal(false); setModalText(''); setEditingTask(null); fetchData();
  };

  useEffect(() => () => { shouldStopRef.current = true; recognitionRef.current?.abort(); window.speechSynthesis.cancel(); }, []);

  // ── Status helpers ───────────────────────────────────────────────────────────
  const statusConfig = {
    idle:      { label: 'Ready',        icon: '●', color: '#94a3b8' },
    listening: { label: 'Listening...', icon: '🎤', color: '#3b82f6' },
    thinking:  { label: 'Thinking...',  icon: '💭', color: '#f59e0b' },
    speaking:  { label: 'Speaking...',  icon: '🔊', color: '#10b981' },
  };
  const sc = statusConfig[status];

  return (
    <div className="da-root">

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="da-header">
        <div className="da-header-brand">
          <div className="da-header-avatar">
            <img src={AVATAR_SRC} alt="Doraemon" />
          </div>
          <div>
            <div className="da-header-name">Doraemon</div>
            <div className="da-header-sub">AI Voice Assistant</div>
          </div>
        </div>
        <div className="da-header-right">
          <div className="da-mode-badge">
            <span className="da-mode-dot"></span>
            {agentMode === 'llm_powered' ? 'LLM Mode' : agentMode === 'rule_based' ? 'Rule-Based' : '...'}
          </div>
          <button className="da-settings-btn" onClick={() => setShowSettings(s => !s)}>
            ⚙ Settings
          </button>
        </div>
      </header>

      {/* ── MAIN LAYOUT ─────────────────────────────────────────────── */}
      <div className="da-layout">

        {/* ── CENTER PANEL ──────────────────────────────────────────── */}
        <main className="da-center">

          {/* Avatar */}
          <div className={`da-avatar-wrap ${status}`}>
            <div className="da-avatar-ring"></div>
            <div className="da-avatar-ring da-ring2"></div>
            <div className="da-avatar-circle">
              <img src={AVATAR_SRC} alt="Doraemon" className="da-avatar-img" />
            </div>
          </div>

          {/* Status indicator */}
          <div className="da-status-pill" style={{ color: sc.color, borderColor: sc.color + '40', background: sc.color + '12' }}>
            {status === 'listening' && <span className="da-eq"><span/><span/><span/><span/><span/></span>}
            {status === 'thinking'  && <span className="da-spin">◌</span>}
            {status === 'speaking'  && <span className="da-bounce">🔊</span>}
            {status === 'idle'      && <span>●</span>}
            &nbsp;{sc.label}
          </div>

          {/* Agent reply bubble */}
          {agentReply && (
            <div className="da-reply-bubble">
              <span className="da-reply-icon">🤖</span>
              <span className="da-reply-text">{agentReply}</span>
            </div>
          )}

          {/* Transcript */}
          {transcript && (
            <div className="da-transcript">
              <span className="da-transcript-icon">🎤</span>
              <span>{transcript}</span>
            </div>
          )}

          {/* Suggestion chips */}
          <div className="da-chips">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="da-chip" onClick={() => onChip(s.msg)}>
                <span>{s.icon}</span> {s.label}
              </button>
            ))}
          </div>

          {/* Floating input bar */}
          <div className="da-input-bar">
            <button
              className={`da-mic-btn ${isRunning ? 'active' : ''}`}
              onClick={isRunning ? stopConversation : startConversation}
              title={isRunning ? 'Stop' : 'Start voice'}
            >
              {isRunning ? '⏹' : '🎤'}
            </button>
            <input
              ref={inputRef}
              type="text"
              className="da-input"
              placeholder="Message Doraemon..."
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={onKey}
            />
            <button className="da-send-btn" onClick={sendText} disabled={!textInput.trim()}>
              ➤
            </button>
          </div>

        </main>

        {/* ── RIGHT SIDEBAR ─────────────────────────────────────────── */}
        <aside className="da-sidebar">

          {/* Tasks */}
          <div className="da-card">
            <div className="da-card-header">
              <span className="da-card-icon">✅</span>
              <span className="da-card-title">TASKS</span>
              <span className="da-card-count">{todos.length}</span>
              <button className="da-add-btn" onClick={openAdd}>+</button>
            </div>
            {todos.length === 0 ? (
              <div className="da-empty">
                <span className="da-empty-icon">📋</span>
                <span>No tasks yet</span>
              </div>
            ) : (
              <div className="da-task-list">
                {todos.map(t => (
                  <div key={t.id} className="da-task-item">
                    <span className="da-task-dot"></span>
                    <span className="da-task-text">{t.text}</span>
                    <div className="da-task-btns">
                      <button onClick={() => openEdit(t)} title="Edit">✎</button>
                      <button onClick={() => deleteTask(t.id)} title="Delete">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Memory */}
          <div className="da-card">
            <div className="da-card-header">
              <span className="da-card-icon">🧠</span>
              <span className="da-card-title">MEMORY</span>
              <span className="da-card-count">{memories.length}</span>
            </div>
            {memories.length === 0 ? (
              <div className="da-empty">
                <span className="da-empty-icon">💭</span>
                <span>Say "remember..."</span>
              </div>
            ) : (
              <div className="da-memory-list">
                {memories.map(m => (
                  <div key={m.id} className="da-memory-item">
                    <span className="da-memory-dot">◆</span>
                    <span>{m.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conversation log */}
          <div className="da-card da-card-log">
            <div className="da-card-header">
              <span className="da-card-icon">💬</span>
              <span className="da-card-title">CONVERSATION</span>
            </div>
            {log.length === 0 ? (
              <div className="da-empty">
                <span className="da-empty-icon">🗨️</span>
                <span>Chat will appear here</span>
              </div>
            ) : (
              <div className="da-log-list">
                {log.map(e => (
                  <div key={e.id} className={`da-log-item da-log-${e.role}`}>
                    <span className="da-log-avatar">
                      {e.role === 'user' ? 'U' : e.role === 'agent' ? 'D' : '⚙'}
                    </span>
                    <span className="da-log-text">{e.text}</span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            )}
          </div>

        </aside>
      </div>

      {/* ── TASK MODAL ──────────────────────────────────────────────── */}
      {showModal && (
        <div className="da-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="da-modal" onClick={e => e.stopPropagation()}>
            <div className="da-modal-header">
              <h3>{modalMode === 'add' ? '➕ Add Task' : '✎ Edit Task'}</h3>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <input
              className="da-modal-input"
              placeholder="Task description..."
              value={modalText}
              onChange={e => setModalText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitModal()}
              autoFocus
            />
            <div className="da-modal-footer">
              <button className="da-modal-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="da-modal-ok" onClick={submitModal} disabled={!modalText.trim()}>
                {modalMode === 'add' ? 'Add' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
