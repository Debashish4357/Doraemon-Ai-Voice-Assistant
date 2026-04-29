import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mic, CheckSquare, History, Bookmark, Sparkles, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ to, icon: Icon, label, active, onClick }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 group ${
      active 
        ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border border-white/10 shadow-lg' 
        : 'hover:bg-white/5 text-white/50 hover:text-white'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg transition-colors ${active ? 'bg-primary text-white neon-glow' : 'bg-white/5 text-white/30 group-hover:bg-white/10'}`}>
        <Icon size={18} />
      </div>
      <span className="font-semibold text-sm tracking-wide">{label}</span>
    </div>
    {active && (
      <motion.div layoutId="active-indicator">
        <ChevronRight size={16} className="text-primary" />
      </motion.div>
    )}
  </Link>
);

export default function Sidebar({ isOpen, closeSidebar }) {
  const location = useLocation();

  const history = [
    { id: 1, title: 'Morning Routine', time: '2h ago' },
    { id: 2, title: 'Shopping List', time: '5h ago' },
    { id: 3, title: 'Project Planning', time: 'Yesterday' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        className={`fixed lg:static inset-y-0 left-0 w-80 glass-dark border-r border-white/5 z-[70] flex flex-col transition-all duration-500 transform lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between lg:hidden">
          <h2 className="text-xl font-bold gradient-text">Menu</h2>
          <button onClick={closeSidebar} className="p-2 hover:bg-white/5 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-2">
          <div className="px-3 mb-2 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Dashboard</div>
          <SidebarItem 
            to="/" 
            icon={Mic} 
            label="Voice Agent" 
            active={location.pathname === '/'} 
            onClick={closeSidebar}
          />
          <SidebarItem 
            to="/todos" 
            icon={CheckSquare} 
            label="To-Do List" 
            active={location.pathname === '/todos'} 
            onClick={closeSidebar}
          />
        </div>

        <div className="h-px bg-white/5 mx-6 my-2"></div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          <div>
            <div className="px-3 mb-3 flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Recent Sessions</span>
              <History size={12} className="text-white/20" />
            </div>
            <div className="space-y-1">
              {history.map((session) => (
                <button 
                  key={session.id}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 group transition-all duration-200"
                >
                  <div className="text-sm font-medium text-white/70 group-hover:text-white truncate">{session.title}</div>
                  <div className="text-[10px] text-white/30 mt-0.5">{session.time}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="px-3 mb-3 flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Saved Insights</span>
              <Bookmark size={12} className="text-white/20" />
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-yellow-500" />
                <span className="text-xs font-bold text-white/90">Daily Tip</span>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed italic">
                "Doraemon learns better when you speak naturally. Try sharing your mood today!"
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-6 text-center">
          <div className="text-[10px] text-white/10 font-medium tracking-widest uppercase">
            v2.0.4 Premium
          </div>
        </div>
      </motion.aside>
    </>
  );
}
