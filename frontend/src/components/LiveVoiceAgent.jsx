import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../App';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { Mic, Square, Loader2, Volume2, Activity, Send, MessageSquare, Terminal, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Waveform = ({ active }) => (
  <div className="flex items-center gap-1.5 h-12">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        animate={active ? { 
          height: [8, Math.random() * 40 + 10, 8],
          opacity: [0.3, 1, 0.3]
        } : { height: 8, opacity: 0.2 }}
        transition={{ repeat: Infinity, duration: 0.5 + Math.random(), ease: "easeInOut" }}
        className="w-1.5 bg-gradient-to-t from-primary to-secondary rounded-full"
      />
    ))}
  </div>
);

export default function LiveVoiceAgent() {
  const { user } = useContext(AuthContext);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState("Ready"); // Ready, Connecting, Listening, Thinking, Speaking
  const [logs, setLogs] = useState([]);
  const [transcript, setTranscript] = useState([
    { role: 'doraemon', text: `Hi ${user.displayName}! I'm Doraemon, your AI assistant. How can I help you today?` }
  ]);
  
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, transcript]);

  const addLog = (msg) => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
  };

  const playTone = (frequency, duration, type = "sine") => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = frequency;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.log("Audio feedback error:", e);
    }
  };

  const startAgent = async () => {
    setIsConnecting(true);
    setStatus("Connecting");
    addLog("Initializing session...");
    playTone(600, 0.2, "square"); // Startup tone

    try {
      const fetchKey = httpsCallable(functions, 'fetchAPIKey');
      const { data } = await fetchKey();
      
      const HOST = "generativelanguage.googleapis.com";
      const MODEL = "models/gemini-2.0-flash-exp"; 
      const url = `wss://${HOST}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${data.apiKey}`;
      
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = async () => {
        addLog("WebSocket connected.");
        setStatus("Listening");
        
        ws.send(JSON.stringify({
          setup: {
            model: MODEL,
            systemInstruction: {
              parts: [{ text: `You are Doraemon, a friendly AI assistant for ${user.displayName}. Be helpful, concise, and futuristic. End the conversation gracefully if the user says "thank you" or "bye".` }]
            }
          }
        }));

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
          
          const source = audioContextRef.current.createMediaStreamSource(stream);
          processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
          
          processorRef.current.onaudioprocess = (e) => {
            const channelData = e.inputBuffer.getChannelData(0);
            const pcm16 = new Int16Array(channelData.length);
            for (let i = 0; i < channelData.length; i++) {
              pcm16[i] = Math.max(-1, Math.min(1, channelData[i])) * 0x7FFF;
            }
            const base64Audio = btoa(String.fromCharCode.apply(null, new Uint8Array(pcm16.buffer)));
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                realtimeInput: { mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: base64Audio }] }
              }));
            }
          };

          source.connect(processorRef.current);
          processorRef.current.connect(audioContextRef.current.destination);
          setIsRecording(true);
          setIsConnecting(false);
          addLog("Microphone active.");

        } catch (err) {
          addLog(`Mic Error: ${err.message}`);
          setIsConnecting(false);
        }
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.serverContent) {
           setStatus("Speaking");
           addLog("Received response...");
        }
      };

      ws.onclose = () => stopAgentInternal(false);

    } catch (e) {
      addLog(`Failed to start: ${e.message}`);
      setIsConnecting(false);
    }
  };

  const stopAgentInternal = async (save) => {
    setIsRecording(false);
    setIsConnecting(false);
    setStatus("Ready");
    
    if (processorRef.current) processorRef.current.disconnect();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (wsRef.current) wsRef.current.close();
    
    if (save) {
      addLog("Syncing session...");
      try {
        const saveSession = httpsCallable(functions, 'saveSession');
        await saveSession({ transcript: "Session summary goes here." });
        addLog("Sync complete.");
      } catch (e) {
        addLog(`Sync failed: ${e.message}`);
      }
    }
  };

  const stopAgent = () => {
    playTone(300, 0.3, "square"); // Shutdown tone
    stopAgentInternal(true);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Main Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/5 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] transition-all duration-1000 ${isRecording ? 'scale-150 opacity-50' : 'scale-100 opacity-20'}`}></div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 w-full max-w-lg"
        >
          {/* Main Interaction Card */}
          <div className="glass-dark rounded-[40px] p-10 flex flex-col items-center border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-white/5 border border-white/5">
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{status}</span>
            </div>

            <div className="relative mb-12">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isRecording ? stopAgent : startAgent}
                disabled={isConnecting}
                className={`w-40 h-40 rounded-full flex items-center justify-center relative transition-all duration-500 ${
                  isRecording 
                    ? 'bg-red-500 neon-glow shadow-red-500/20' 
                    : 'bg-gradient-to-br from-primary to-secondary neon-glow shadow-primary/20'
                }`}
              >
                {isConnecting ? (
                  <Loader2 size={56} className="text-white animate-spin" />
                ) : isRecording ? (
                  <Square size={48} className="text-white fill-white" />
                ) : (
                  <Mic size={56} className="text-white" />
                )}
                
                {/* Pulsating Rings */}
                {isRecording && (
                  <div className="absolute inset-0">
                    <div className="absolute inset-[-20px] rounded-full border border-red-500/20 animate-pulse"></div>
                    <div className="absolute inset-[-40px] rounded-full border border-red-500/10 animate-pulse delay-75"></div>
                  </div>
                )}
              </motion.button>
            </div>

            <Waveform active={isRecording} />
            
            <p className="text-white/40 text-center mt-10 text-sm font-medium h-6">
              {isRecording ? "Listening to your thoughts..." : "Tap to start chatting with Doraemon"}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Side Chat/Logs Panel */}
      <div className="w-full lg:w-[450px] flex flex-col glass-dark bg-black/40 backdrop-blur-3xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <MessageSquare size={18} />
            </div>
            <h3 className="font-bold text-sm uppercase tracking-wider">Conversation</h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/30 border border-white/5 font-mono">Real-time</span>
        </div>

        {/* Chat Bubbles */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <AnimatePresence>
            {transcript.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex items-center gap-2 mb-1.5 px-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.role === 'doraemon' ? <Sparkles size={10} className="text-primary" /> : <User size={10} className="text-white/30" />}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                    {msg.role === 'doraemon' ? 'Doraemon' : 'You'}
                  </span>
                </div>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-primary/20 text-white rounded-tr-none border border-primary/20' 
                    : 'glass text-white/90 rounded-tl-none border border-white/5'
                }`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={logEndRef} />
        </div>

        {/* System Logs (Dev Mode) */}
        <div className="h-48 border-t border-white/5 bg-black/40 p-4">
          <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
            <Terminal size={12} />
            System Runtime
          </div>
          <div className="h-32 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1.5">
            {logs.length === 0 ? (
              <div className="text-white/10 italic">Initializing logging pipeline...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-white/20 shrink-0">{log.time}</span>
                  <span className="text-primary/60 shrink-0">➜</span>
                  <span className="text-white/60">{log.msg}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
