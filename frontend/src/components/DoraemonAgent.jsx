import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare, ListTodo, Brain, Menu, X, Plus, Edit2, Trash2 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import InputBar from './InputBar';

const API = 'http://localhost:8000';
const AVATAR_SRC = '/default.png';

const SUGGESTIONS = [
  { icon: <ListTodo size={16} />, label: 'Add task buy groceries', msg: 'Add task buy groceries' },
  { icon: <Brain size={16} />, label: 'Remember my exam is tomorrow', msg: 'Remember my exam is tomorrow' },
  { icon: <MessageSquare size={16} />, label: 'Show my tasks', msg: 'Show my tasks' },
  { icon: <Sparkles size={16} />, label: 'What did I tell you?', msg: 'What did I tell you?' },
];

/* ── TTS ─────────────────────────────────────────────────────────────────── */
/* ── TTS ─────────────────────────────────────────────────────────────────── */
function speak(text, onStart, onEnd) {
  return new Promise(resolve => {
    if (!window.speechSynthesis) {
      console.error("Speech Synthesis not supported");
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    // Small delay to ensure previous speech is fully canceled
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.0; 
      u.pitch = 1.1; 
      u.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      // Try to find a friendly/Google voice, fallback to any English, then first available
      const v = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
             || voices.find(v => v.lang.startsWith('en-US'))
             || voices.find(v => v.lang.startsWith('en'))
             || voices[0];
      
      if (v) u.voice = v;

      u.onstart = () => {
        console.log("TTS started speaking");
        onStart?.();
      };
      u.onend = () => {
        onEnd?.();
        resolve();
      };
      u.onerror = (err) => {
        console.error("TTS Error:", err);
        onEnd?.();
        resolve();
      };

      window.speechSynthesis.speak(u);
    }, 100);
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

export default function DoraemonAgent() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [todos, setTodos] = useState([]);
  const [memories, setMemories] = useState([]);
  const [agentMode, setAgentMode] = useState('checking');
  const [textInput, setTextInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingTask, setEditingTask] = useState(null);
  const [modalText, setModalText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const recognitionRef = useRef(null);
  const shouldStopRef  = useRef(false);
  const bottomRef      = useRef(null);

  /* auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* fetch sidebar */
  const fetchData = useCallback(async () => {
    try {
      const [tRes, mRes] = await Promise.all([
        fetch(`${API}/todo/list`), fetch(`${API}/memory/list`)
      ]);
      setTodos((await tRes.json()).tasks    || []);
      setMemories((await mRes.json()).memories || []);
    } catch (e) { console.error(e); }
  }, []);

  /* init */
  useEffect(() => {
    (async () => {
      try {
        const d = await (await fetch(`${API}/agent/mode`)).json();
        setAgentMode(d.llm_powered ? 'llm_powered' : 'rule_based');
      } catch { setAgentMode('rule_based'); }
      fetchData();
    })();
  }, [fetchData]);

  /* push message */
  const pushMsg = useCallback((role, text, extra = {}) => {
    const id = Date.now() + Math.random();
    setMessages(prev => [...prev, { id, role, text, ...extra }]);
    return id;
  }, []);

  const updateMsg = useCallback((id, patch) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  }, []);

  /* send to agent */
  const sendToAgent = useCallback(async (message) => {
    if (!message.trim()) return;
    pushMsg('user', message);
    setStatus('thinking');
    const tid = pushMsg('assistant', '', { typing: true });
    try {
      const res  = await fetch(`${API}/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, session_id: 'default' })
      });
      const data  = await res.json();
      const reply = data.response || "I'm not sure how to help.";
      updateMsg(tid, { text: reply, typing: false });
      await fetchData();
      await speak(reply, () => setStatus('speaking'), () => setStatus('idle'));
      return reply;
    } catch (err) {
      const msg = 'Connection error. Is the backend running?';
      updateMsg(tid, { text: msg, typing: false });
      await speak(msg, () => setStatus('speaking'), () => setStatus('idle'));
      return null;
    }
  }, [pushMsg, updateMsg, fetchData]);

  /* voice listen once */
  const listenOnce = useCallback(() => new Promise(resolve => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { pushMsg('assistant', 'Speech Recognition not supported. Use Chrome.'); resolve({ text: null, stop: true }); return; }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;
    setStatus('listening'); playTone(660, 0.1);
    rec.start();
    rec.onresult  = e => resolve({ text: e.results[0][0].transcript.trim(), stop: false });
    rec.onnomatch = () => resolve({ text: null, stop: false });
    rec.onerror   = e => resolve({ text: null, stop: e.error !== 'no-speech' });
  }), [pushMsg]);

  /* conversation loop */
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

  /* text send */
  const sendText = useCallback(async () => {
    const msg = textInput.trim(); if (!msg) return;
    setTextInput(''); await sendToAgent(msg);
  }, [textInput, sendToAgent]);

  /* task CRUD */
  const deleteTask  = async id => { await fetch(`${API}/todo/delete/${id}`, { method: 'DELETE' }); fetchData(); };
  const openAdd     = () => { setModalMode('add'); setModalText(''); setEditingTask(null); setShowModal(true); };
  const openEdit    = t  => { setModalMode('edit'); setModalText(t.text); setEditingTask(t); setShowModal(true); };
  const submitModal = async () => {
    if (!modalText.trim()) return;
    if (modalMode === 'add') {
      await fetch(`${API}/todo/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task: modalText.trim() }) });
    } else {
      await fetch(`${API}/todo/update/${editingTask.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task: modalText.trim() }) });
    }
    setShowModal(false); setModalText(''); setEditingTask(null); fetchData();
  };

  useEffect(() => () => {
    shouldStopRef.current = true;
    recognitionRef.current?.abort();
    window.speechSynthesis.cancel();
  }, []);

  const isEmpty = messages.length === 0;

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden">
      {/* Background with fixes */}
      <div className="bg-doraemon" />
      <div className="bg-gradient-overlay" />

      {/* Topbar */}
      <header className="h-16 flex items-center justify-between px-6 z-50 glass-card !border-x-0 !border-t-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md border border-white/50">
            <img src={AVATAR_SRC} alt="Doraemon" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-none">Doraemon AI</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Voice Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {status !== 'idle' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 shadow-sm animate-fade-in">
              <span className={`w-2 h-2 rounded-full ${status === 'listening' ? 'bg-red-500 animate-pulse' : status === 'thinking' ? 'bg-amber-500 animate-spin' : 'bg-green-500 animate-bounce'}`} />
              <span className="text-xs font-semibold text-blue-600 capitalize">{status}...</span>
            </div>
          )}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 border border-white shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
              {agentMode === 'llm_powered' ? 'LLM Mode' : 'Rule Mode'}
            </span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto scroll-smooth pb-32 pt-6 flex flex-col items-center px-4">
          <div className="w-full max-w-[800px] flex flex-col">
            <AnimatePresence>
              {isEmpty ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                >
                  <div className="w-24 h-24 mb-6 rounded-3xl glass-card flex items-center justify-center animate-pulse-soft">
                    <img src={AVATAR_SRC} alt="Doraemon" className="w-16 h-16 object-contain" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2 drop-shadow-sm">Hello, I'm Doraemon</h2>
                  <p className="text-black font-medium max-w-md mb-8">How can I help you today? You can talk to me about tasks, memories, or just chat.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                    {SUGGESTIONS.map((s, i) => (
                      <button 
                        key={i} 
                        onClick={() => sendToAgent(s.msg)}
                        className="flex items-center gap-3 p-4 glass-card hover:bg-blue-50/50 hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          {s.icon}
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col">
                  {messages.map(m => (
                    <MessageBubble key={m.id} msg={m} avatar={AVATAR_SRC} />
                  ))}
                </div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} className="h-4" />
          </div>
        </main>

        {/* Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-80 h-full !border-y-0 !border-r-0 glass-card p-4 flex flex-col gap-4 z-30"
            >
              {/* Tasks Card */}
              <div className="flex flex-col bg-white/10 rounded-2xl border border-white/20 shadow-sm overflow-hidden flex-1">
                <div className="p-3 flex items-center justify-between border-b border-white/10 bg-white/20">
                  <div className="flex items-center gap-2">
                    <ListTodo size={16} className="text-blue-500" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tasks</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold">{todos.length}</span>
                  </div>
                  <button onClick={openAdd} className="p-1 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                  {todos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 opacity-40">
                      <ListTodo size={32} strokeWidth={1} />
                      <span className="text-[10px] font-medium mt-2">No tasks yet</span>
                    </div>
                  ) : (
                    todos.map((t, i) => {
                      const colors = ['bg-emerald-400', 'bg-amber-400', 'bg-rose-400', 'bg-purple-400', 'bg-orange-400'];
                      const dotColor = colors[i % colors.length] || 'bg-blue-400';
                      return (
                        <div key={t.id} className="group flex items-center gap-2 p-2 rounded-xl hover:bg-blue-600/30 transition-all border border-transparent hover:border-blue-400/40 shadow-sm hover:shadow-md">
                          <div className={`w-1.5 h-1.5 rounded-full ${dotColor} shadow-sm`} />
                          <span className="flex-1 text-xs text-slate-600 font-medium line-clamp-2">{t.text}</span>
                          <div className="hidden group-hover:flex items-center gap-1">
                            <button onClick={() => openEdit(t)} className="p-1 text-slate-400 hover:text-blue-500 transition-colors"><Edit2 size={12} /></button>
                            <button onClick={() => deleteTask(t.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Memory Card */}
              <div className="flex flex-col bg-white/10 rounded-2xl border border-white/20 shadow-sm overflow-hidden flex-1">
                <div className="p-3 flex items-center gap-2 border-b border-white/10 bg-white/20">
                  <Brain size={16} className="text-amber-500" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Memory</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold">{memories.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                  {memories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 opacity-40">
                      <Brain size={32} strokeWidth={1} />
                      <span className="text-[10px] font-medium mt-2">No memories</span>
                    </div>
                  ) : (
                    memories.map(m => (
                      <div key={m.id} className="p-2 rounded-xl bg-white/10 border border-white/20 flex items-start gap-2 hover:bg-blue-600/30 hover:border-blue-400/40 transition-all cursor-default group">
                        <Sparkles size={12} className="text-amber-400 mt-0.5 shrink-0" />
                        <span className="text-[11px] text-slate-600 leading-tight flex-1">{m.text}</span>
                        <button 
                          onClick={() => deleteMemory(m.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-red-400 rounded-md transition-all"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Input Bar */}
      <InputBar 
        status={status}
        isRunning={isRunning}
        textInput={textInput}
        setTextInput={setTextInput}
        toggleListening={isRunning ? stopConversation : startConversation}
        handleTextSubmit={sendText}
      />

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-white"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">
                  {modalMode === 'add' ? 'Add New Task' : 'Update Task'}
                </h3>
                <textarea
                  className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-700 font-medium resize-none h-32"
                  placeholder="What needs to be done?"
                  value={modalText}
                  onChange={e => setModalText(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="p-4 bg-slate-50 flex gap-3 justify-end">
                <button 
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitModal}
                  disabled={!modalText.trim()}
                  className="px-8 py-2.5 rounded-xl text-sm font-bold bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-all shadow-lg shadow-blue-200"
                >
                  {modalMode === 'add' ? 'Add Task' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
