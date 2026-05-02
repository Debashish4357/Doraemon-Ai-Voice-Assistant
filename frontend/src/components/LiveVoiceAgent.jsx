import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../App';
import { Mic, MicOff, Play, Square, Loader2, Sparkles, MessageSquare, Volume2, Shield, Settings, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = "http://localhost:8000";

export default function LiveVoiceAgent() {
  const { user } = useContext(AuthContext);
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [logs, setLogs] = useState([]);
  const [memorySummary, setMemorySummary] = useState("");
  const [isFetchingMemory, setIsFetchingMemory] = useState(true);
  const [agentConfig, setAgentConfig] = useState({ name: "Doraemon", gender: "male" });
  
  // Realtime Audio Refs
  const webSocketRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);
  const transcriptRef = useRef(""); // To store full conversation for summarization

  const addLog = (msg) => {
    setLogs(prev => [msg, ...prev].slice(0, 5));
    setStatus(msg);
  };

  // Fetch context from MongoDB/FastAPI
  useEffect(() => {
    if (!user) return;
    
    const fetchContext = async () => {
      setIsFetchingMemory(true);
      try {
        const res = await fetch(`${API_BASE_URL}/memory/context/${user.uid}`);
        const data = await res.json();
        if (data.summary) {
          setMemorySummary(data.summary);
          addLog("Previous memory synced.");
        }
      } catch (e) {
        addLog("Offline context mode.");
      } finally {
        setIsFetchingMemory(false);
      }
    };
    fetchContext();
  }, [user]);

  const startConnection = async () => {
    try {
      addLog("Fetching secure token...");
      const tokenRes = await fetch(`${API_BASE_URL}/agent/token`);
      const { client_secret } = await tokenRes.json();

      const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
      webSocketRef.current = new WebSocket(url);
      
      webSocketRef.current.onopen = () => {
        addLog("Voice channel active.");
        setIsActive(true);
        
        // Auth with token
        webSocketRef.current.send(JSON.stringify({
          type: "auth",
          token: client_secret.value
        }));

        // Initial Instructions with Memory Context
        const instructions = `You are ${agentConfig.name}, a helpful AI assistant. 
        Context from last session: ${memorySummary || "None"}.
        The user's name is ${user.displayName}. 
        Keep your responses brief and natural for voice.`;

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
      addLog("Connection failed: " + e.message);
    }
  };

  const handleWebSocketMessage = (event) => {
    const data = JSON.parse(event.data);
    
    // Store transcripts for background summarization
    if (data.type === "conversation.item.transcription.completed") {
      transcriptRef.current += "\n" + data.transcript;
    }

    if (data.type === "response.audio.delta") {
      playAudioDelta(data.delta);
    }
  };

  const endSession = async () => {
    setIsActive(false);
    addLog("Ending session...");

    // Stop audio
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (webSocketRef.current) webSocketRef.current.close();

    // TRIGGER AI SUMMARY & TASK EXTRACTION IN FASTAPI
    if (transcriptRef.current.trim()) {
      addLog("Processing insights...");
      try {
        await fetch(`${API_BASE_URL}/agent/session/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            transcript: transcriptRef.current
          })
        });
        addLog("Tasks updated in MongoDB!");
      } catch (e) {
        addLog("Save failed locally.");
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

  // Playback queue logic
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl">
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-100 p-12 border border-gray-100 text-center relative overflow-hidden">
          {/* Status Badge */}
          <div className="flex justify-center mb-10">
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
              {status}
            </div>
          </div>

          {/* AI Avatar / Pulse */}
          <div className="relative mb-12 flex justify-center">
            <AnimatePresence>
              {isActive && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1.5, opacity: 0.2 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-indigo-400 rounded-full blur-3xl"
                />
              )}
            </AnimatePresence>
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-700 ${isActive ? 'bg-indigo-600 scale-110 shadow-2xl shadow-indigo-300' : 'bg-gray-50'}`}>
              {isActive ? <Volume2 size={48} className="text-white animate-bounce" /> : <Mic size={48} className="text-gray-300" />}
            </div>
          </div>

          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
            {isActive ? `Listening to ${user?.displayName?.split(' ')[0]}...` : `Hello, I'm ${agentConfig.name}`}
          </h2>
          <p className="text-gray-400 font-medium mb-10 max-w-sm mx-auto leading-relaxed">
            {isActive ? "I'm ready for your thoughts, tasks, or a simple chat." : "Ready for our next voice session? I'll remember everything we talk about."}
          </p>

          <div className="flex flex-col gap-4 max-w-xs mx-auto">
            {!isActive ? (
              <button 
                onClick={startConnection}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Mic size={20} /> Connect Agent
              </button>
            ) : (
              <button 
                onClick={endSession}
                className="bg-red-500 hover:bg-red-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-red-100 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Square size={18} fill="currentColor" /> Finish Session
              </button>
            )}
          </div>

          {/* Log Area */}
          <div className="mt-12 pt-10 border-t border-gray-50 text-left">
            <div className="flex items-center gap-2 mb-4">
              <History size={14} className="text-gray-400" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Real-time Activity</span>
            </div>
            <div className="space-y-3">
              {logs.map((log, i) => (
                <div key={i} className="text-xs font-bold text-gray-600 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-indigo-200"></div>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
