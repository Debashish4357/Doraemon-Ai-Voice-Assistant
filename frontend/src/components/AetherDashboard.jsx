import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../App';
import { Mic, Square, Loader2, Sparkles, Database, CheckCircle, Circle, BrainCircuit, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = "http://localhost:8000";

export default function AetherDashboard() {
  const { user, handleSignOut } = useContext(AuthContext);
  
  // Voice State
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState("System Online. Waiting for input.");
  const [logs, setLogs] = useState([]);
  
  // Data State
  const [todos, setTodos] = useState([]);
  const [memories, setMemories] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Audio Refs
  const webSocketRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);
  const transcriptRef = useRef("");
  
  // Playback queue logic
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);

  // Fetch initial data
  const fetchData = async () => {
    if (!user) return;
    try {
      const [todosRes, memoryRes] = await Promise.all([
        fetch(`${API_BASE_URL}/todos/${user.uid}`),
        fetch(`${API_BASE_URL}/memory/list/${user.uid}`)
      ]);
      const todosData = await todosRes.json();
      const memoryData = await memoryRes.json();
      setTodos(todosData);
      setMemories(memoryData);
    } catch (e) {
      addLog("Data sync failed.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const addLog = (msg) => {
    setLogs(prev => [msg, ...prev].slice(0, 8));
    setStatus(msg);
  };

  const startConnection = async () => {
    try {
      addLog("Initializing AETHER protocol...");
      const tokenRes = await fetch(`${API_BASE_URL}/agent/token`);
      const { client_secret } = await tokenRes.json();

      const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
      webSocketRef.current = new WebSocket(url);
      
      webSocketRef.current.onopen = async () => {
        addLog("Neural link established. Listening...");
        setIsActive(true);
        
        webSocketRef.current.send(JSON.stringify({
          type: "auth",
          token: client_secret.value
        }));

        // Fetch context to inject
        let contextText = "No previous context.";
        try {
          const contextRes = await fetch(`${API_BASE_URL}/memory/context/${user.uid}`);
          const contextData = await contextRes.json();
          if (contextData.summary) contextText = contextData.summary;
        } catch(e) {}

        const instructions = `You are AETHER, an advanced J.A.R.V.I.S. style AI assistant. 
        Context from last session: ${contextText}.
        The user's name is ${user.displayName}. 
        Keep your responses extremely concise, analytical, and professional. Use a calm, robotic tone.`;

        webSocketRef.current.send(JSON.stringify({
          type: "session.update",
          session: {
            instructions: instructions,
            modalities: ["text", "audio"],
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            turn_detection: { type: "server_vad" },
            input_audio_transcription: { model: "whisper-1" }
          }
        }));

        startAudioStreaming();
      };

      webSocketRef.current.onmessage = handleWebSocketMessage;
    } catch (e) {
      addLog("System failure: " + e.message);
    }
  };

  const handleWebSocketMessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === "conversation.item.transcription.completed") {
      transcriptRef.current += "\n" + data.transcript;
      addLog("Processing input...");
    }

    if (data.type === "response.audio.delta") {
      playAudioDelta(data.delta);
    }
  };

  const endSession = async () => {
    setIsActive(false);
    addLog("Terminating neural link...");

    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (webSocketRef.current) webSocketRef.current.close();

    if (transcriptRef.current.trim()) {
      addLog("Extracting actionable intelligence...");
      try {
        await fetch(`${API_BASE_URL}/agent/session/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            transcript: transcriptRef.current
          })
        });
        addLog("Databases synchronized.");
        fetchData();
      } catch (e) {
        addLog("Sync error.");
      }
    }
    transcriptRef.current = "";
  };

  // --- AUDIO LOGIC (PCM16) ---
  const startAudioStreaming = async () => {
    streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    
    const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
    processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

    source.connect(processorRef.current);
    processorRef.current.connect(audioContextRef.current.destination);

    processorRef.current.onaudioprocess = (e) => {
      if (webSocketRef.current?.readyState === WebSocket.OPEN) {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = floatTo16BitPCM(inputData);
        webSocketRef.current.send(JSON.stringify({
          type: "input_audio_buffer.append",
          audio: arrayBufferToBase64(pcmData)
        }));
      }
    };
  };

  const playAudioDelta = (base64Delta) => {
    const binaryString = window.atob(base64Delta);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 0x8000;
    }

    const audioBuffer = audioContextRef.current.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);
    
    audioQueueRef.current.push(audioBuffer);
    playNextInBuffer();
  };

  const playNextInBuffer = () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    
    isPlayingRef.current = true;
    const buffer = audioQueueRef.current.shift();
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      isPlayingRef.current = false;
      playNextInBuffer();
    };
    source.start();
  };

  const floatTo16BitPCM = (output) => {
    const buffer = new ArrayBuffer(output.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < output.length; i++) {
      const s = Math.max(-1, Math.min(1, output[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  };

  const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return window.btoa(binary);
  };

  const toggleTodo = async (todo) => {
    const newStatus = todo.status === "open" ? "closed" : "open";
    await fetch(`${API_BASE_URL}/todos/${user.uid}/${todo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#050b14] text-[#e0f2fe] font-sans selection:bg-[#00f0ff] selection:text-black overflow-x-hidden flex flex-col p-6 lg:p-10 relative">
      
      {/* Background Grid Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" 
           style={{ backgroundImage: 'radial-gradient(#00f0ff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      
      {/* Header */}
      <header className="flex justify-between items-center mb-10 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-[#00f0ff]/30 flex items-center justify-center rounded bg-[#0a1128] shadow-[0_0_15px_rgba(0,240,255,0.1)]">
            <BrainCircuit size={20} className="text-[#00f0ff]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-[0.2em] uppercase neon-text text-[#00f0ff]">AETHER</h1>
            <p className="text-[10px] text-[#0088ff] font-mono tracking-widest uppercase">J.A.R.V.I.S. Interface Protocol v2.1</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-widest text-[#0088ff]/60">Authorized User</span>
            <span className="font-mono text-sm text-[#e0f2fe]">{user?.displayName || "Admin"}</span>
          </div>
          <button onClick={handleSignOut} className="px-4 py-2 border border-red-500/30 text-red-400 text-xs uppercase tracking-widest font-bold hover:bg-red-500/10 transition-colors">
            Disengage
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 z-10 h-full">
        
        {/* Left Panel: Tasks */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="glass-panel p-6 h-full flex flex-col rounded-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00f0ff] to-transparent opacity-50"></div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black uppercase tracking-[0.15em] text-[#00f0ff] flex items-center gap-2">
                <Database size={16} /> Active Directives
              </h2>
              <span className="text-xs font-mono text-[#0088ff]/70">{todos.filter(t=>t.status==='open').length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {loadingData ? (
                <div className="text-center py-10 text-[#0088ff]/50 text-xs font-mono animate-pulse">Accessing Data Cores...</div>
              ) : todos.length === 0 ? (
                <div className="text-center py-10 text-[#0088ff]/50 text-xs font-mono">No active directives.</div>
              ) : (
                todos.map(todo => (
                  <div key={todo.id} onClick={() => toggleTodo(todo)} className={`p-3 border transition-colors cursor-pointer flex gap-3 ${todo.status === 'closed' ? 'border-[#0088ff]/20 bg-[#0088ff]/5 opacity-50' : 'border-[#00f0ff]/30 hover:border-[#00f0ff] hover:bg-[#00f0ff]/5'}`}>
                    {todo.status === 'closed' ? <CheckCircle size={16} className="text-[#0088ff] mt-0.5 shrink-0" /> : <Circle size={16} className="text-[#00f0ff] mt-0.5 shrink-0" />}
                    <span className={`text-sm ${todo.status === 'closed' ? 'line-through text-[#0088ff]' : 'text-[#e0f2fe]'}`}>{todo.task}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Center Panel: Voice Interface */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-10 glass-panel rounded-xl relative">
           {/* Decorative UI elements */}
           <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#00f0ff]/30"></div>
           <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#00f0ff]/30"></div>
           <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#00f0ff]/30"></div>
           <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#00f0ff]/30"></div>

          <div className="relative mb-16 flex justify-center items-center h-64 w-64">
            {/* Outer Rotating Ring */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: isActive ? 2 : 20, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-dashed border-[#00f0ff]/20"
            />
            
            {/* Inner Ring */}
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: isActive ? 3 : 15, ease: "linear" }}
              className="absolute inset-4 rounded-full border border-t-[#00f0ff] border-r-transparent border-b-transparent border-l-[#0088ff] opacity-50"
            />

            {/* Core Orb */}
            <div className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center cursor-pointer transition-all duration-700 ${isActive ? 'bg-[#00f0ff]/10 neon-glow scale-110' : 'bg-[#0a1128] border border-[#00f0ff]/30 hover:border-[#00f0ff] hover:bg-[#00f0ff]/5'}`} onClick={isActive ? endSession : startConnection}>
              {isActive ? (
                <Activity size={40} className="text-[#00f0ff] animate-pulse" />
              ) : (
                <Mic size={40} className="text-[#0088ff]" />
              )}
            </div>
          </div>

          <div className="text-center w-full max-w-md mx-auto">
            <div className="mb-6 px-4 py-2 bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono uppercase tracking-widest inline-block">
              {status}
            </div>
            
            <div className="h-40 overflow-y-auto text-left font-mono text-xs space-y-2 text-[#0088ff]/80 custom-scrollbar pr-2">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-[#00f0ff] opacity-50">{'>'}</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Memories */}
        <div className="lg:col-span-3 flex flex-col gap-6">
           <div className="glass-panel p-6 h-full flex flex-col rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-[#00f0ff] to-transparent opacity-50"></div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black uppercase tracking-[0.15em] text-[#00f0ff] flex items-center gap-2">
                <Sparkles size={16} /> Memory Banks
              </h2>
              <span className="text-xs font-mono text-[#0088ff]/70">{memories.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {loadingData ? (
                 <div className="text-center py-10 text-[#0088ff]/50 text-xs font-mono animate-pulse">Syncing...</div>
              ) : memories.length === 0 ? (
                <div className="text-center py-10 text-[#0088ff]/50 text-xs font-mono">Memory banks empty.</div>
              ) : (
                memories.map(mem => (
                  <div key={mem.id} className="p-3 bg-[#0a1128]/50 border-l-2 border-[#00f0ff] text-sm text-[#e0f2fe]/90">
                    "{mem.content}"
                    <div className="mt-2 text-[9px] font-mono text-[#0088ff]/60 uppercase tracking-wider">
                      {new Date(mem.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
