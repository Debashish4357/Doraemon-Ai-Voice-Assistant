import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, User, Save, Mic } from 'lucide-react';

export default function CustomizeAgentModal({ isOpen, onClose, currentName = "Doraemon" }) {
  const [name, setName] = useState(currentName);
  const [gender, setGender] = useState("friendly");

  const handleSave = () => {
    // In a real app, this would call the backend
    console.log("Saving agent config:", { name, gender });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md glass-dark border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-8 pb-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary neon-glow">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Customize Agent</h2>
                  <p className="text-xs text-white/30 font-medium uppercase tracking-widest mt-0.5">Configuration</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] ml-1">Agent Identity</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold"
                    placeholder="Enter agent name..."
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] ml-1">Vocal Personality</label>
                <div className="grid grid-cols-2 gap-3">
                  {['friendly', 'professional', 'robotic', 'enthusiastic'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setGender(type)}
                      className={`p-4 rounded-2xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 flex flex-col items-center gap-2 ${
                        gender === type 
                          ? 'bg-primary/20 border-primary text-white neon-glow' 
                          : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'
                      }`}
                    >
                      <Mic size={14} className={gender === type ? 'text-primary' : 'text-white/20'} />
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleSave}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <Save size={20} />
                  Save Changes
                </button>
              </div>
            </div>

            {/* Subtle Footer Decor */}
            <div className="h-1.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-50"></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
