import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../App';
import { Mic, Square, Loader2, Volume2, Activity, MessageSquare, Terminal, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
  const [status, setStatus] = useState("Ready"); 
  const [logs, setLogs] = useState([]);
  const [transcript, setTranscript] = useState([
    { role: 'doraemon', text: `Hi ${user?.displayName || 'there'}! I'm Doraemon, now powered by OpenAI. How can I help you?` }
  ]);
  
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const logEndRef = useRef(null);
  const audioQueue = useRef([]);
  const isPlaying = useRef(false);

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

  const processAudioQueue = async () => {
    if (isPlaying.current || audioQueue.current.length === 0) return;
    isPlaying.current = true;
    
    if (!audioContextRef.current) return;

    while (audioQueue.current.length > 0) {
      const pcmData = audioQueue.current.shift();
      const audioBuffer = audioContextRef.current.createBuffer(1, pcmData.length, 24000);
      audioBuffer.getChannelData(0).set(pcmData);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      const playPromise = new Promise(resolve => {
        source.onended = resolve;
        source.start();
      });
      
      await playPromise;
    }
    
    isPlaying.current = false;
  };

  const startAgent = async () => {
    setIsConnecting(true);
    setStatus("Connecting");
    addLog("Fetching OpenAI session...");
    playTone(600, 0.2, "square");

    try {
      // 1. Get ephemeral token from backend
      const tokenResponse = await fetch(`${BACKEND_URL}/agent/token`);
      if (!tokenResponse.ok) throw new Error("Failed to get OpenAI token. Is the backend running?");
      const data = await tokenResponse.json();
      const ephemeralKey = data.client_secret.value;

      // 2. Initialize Audio Context (24kHz for OpenAI)
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // 3. Connect to OpenAI Realtime WebSocket (Using ephemeral key in URL for browser support)
      const url = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        addLog("OpenAI Connected.");
        setStatus("Listening");

        // Send Session Update (Initial instructions)
        ws.send(JSON.stringify({
          type: "session.update",
          session: {
            instructions: `You are Doraemon, a friendly AI assistant for ${user?.displayName || 'the user'}. Speak casually and keep responses concise for voice interaction.`,
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            turn_detection: { type: "server_vad" }
          }
        }));

        startMicStream(ws);
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        
        switch (msg.type) {
          case "response.audio.delta":
            const binary = atob(msg.delta);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const pcm16 = new Int16Array(bytes.buffer);
            const float32 = new Float32Array(pcm16.length);
            for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768;
            
            audioQueue.current.push(float32);
            processAudioQueue();
            break;

          case "response.audio_transcript.done":
            setTranscript(prev => [...prev, { role: 'doraemon', text: msg.transcript }]);
            break;

          case "conversation.item.input_audio_transcription.completed":
            setTranscript(prev => [...prev, { role: 'user', text: msg.transcript }]);
            break;

          case "response.output_item.added":
            setStatus("Speaking");
            break;

          case "error":
            addLog(`OpenAI Error: ${msg.error.message}`);
            break;
        }
      };

      ws.onclose = () => stopAgentInternal(false);

    } catch (e) {
      addLog(`Failed to start OpenAI: ${e.message}`);
      setIsConnecting(false);
      setStatus("Ready");
    }
  };

  const startMicStream = async (ws) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current.onaudioprocess = (e) => {
        const channelData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(channelData.length);
        for (let i = 0; i < channelData.length; i++) {
          pcm16[i] = Math.max(-1, Math.min(1, channelData[i])) * 32767;
        }
        const base64Audio = btoa(String.fromCharCode.apply(null, new Uint8Array(pcm16.buffer)));
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: "input_audio_buffer.append",
            audio: base64Audio
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

  const stopAgentInternal = async (save) => {
    setIsRecording(false);
    setIsConnecting(false);
    setStatus("Ready");
    
    if (processorRef.current) processorRef.current.disconnect();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (wsRef.current) wsRef.current.close();
    
    if (save) {
      addLog("Session synced.");
    }
  };

  const stopAgent = () => {
    playTone(300, 0.3, "square");
    stopAgentInternal(true);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-screen bg-[#0f0f1a] text-white">
      {/* Main Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] transition-all duration-1000 ${isRecording ? 'scale-150 opacity-50' : 'scale-100 opacity-20'}`}></div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative z-10 w-full max-w-lg">
          <div className="bg-white/5 backdrop-blur-xl rounded-[40px] p-10 flex flex-col items-center border border-white/10 shadow-2xl">
            <div className="flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-white/5 border border-white/5">
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">OpenAI • {status}</span>
            </div>

            <div className="relative mb-12">
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={isRecording ? stopAgent : startAgent}
                disabled={isConnecting}
                className={`w-40 h-40 rounded-full flex items-center justify-center relative transition-all duration-500 ${
                  isRecording ? 'bg-secondary shadow-lg shadow-secondary/20' : 'bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/20'
                }`}
              >
                {isConnecting ? <Loader2 size={56} className="text-white animate-spin" /> : isRecording ? <Square size={48} className="text-white fill-white" /> : <Mic size={56} className="text-white" />}
              </motion.button>
            </div>
            <Waveform active={isRecording} />
            <p className="text-white/40 text-center mt-10 text-sm font-medium h-6">{isRecording ? "OpenAI is listening..." : "Tap to start OpenAI Voice Mode"}</p>
          </div>
        </motion.div>
      </div>

      {/* Transcript Panel */}
      <div className="w-full lg:w-[450px] flex flex-col bg-black/40 backdrop-blur-3xl border-l border-white/5">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg text-secondary"><MessageSquare size={18} /></div>
            <h3 className="font-bold text-sm uppercase tracking-wider">Live Transcript</h3>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence>
            {transcript.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-secondary/20 text-white' : 'bg-white/5 text-white/90'}`}>{msg.text}</div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
