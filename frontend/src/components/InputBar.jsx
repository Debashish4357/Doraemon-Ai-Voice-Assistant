import React from 'react';
import { Mic, Send, Square } from 'lucide-react';

export default function InputBar({
  status,
  isRunning,
  textInput,
  setTextInput,
  toggleListening,
  handleTextSubmit
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 flex justify-center z-40 bg-gradient-to-t from-slate-50/80 to-transparent">
      <div className="w-full max-w-[800px] glass-input rounded-full p-1.5 flex items-center gap-2 group transition-all duration-300">
        
        {/* Mic Button */}
        <button
          onClick={toggleListening}
          className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
            isRunning 
              ? 'bg-red-500 text-white shadow-lg shadow-red-200' 
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
          title={isRunning ? "Stop Listening" : "Start Listening"}
        >
          {isRunning ? (
            <>
              <Square size={20} fill="currentColor" />
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25"></span>
            </>
          ) : (
            <Mic size={22} />
          )}
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
          placeholder={status === 'listening' ? "I'm listening..." : "Message Doraemon..."}
          className="flex-1 bg-transparent border-none outline-none px-2 text-slate-700 placeholder-slate-400 font-medium text-base"
          disabled={status === 'thinking'}
        />

        {/* Send Button */}
        <button
          onClick={handleTextSubmit}
          disabled={!textInput.trim() || status === 'thinking'}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white hover:bg-blue-600 hover:scale-105 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:scale-100 transition-all duration-300 shadow-md"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
