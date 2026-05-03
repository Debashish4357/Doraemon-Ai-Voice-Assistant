import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import { Mic, CheckSquare, History, Sparkles, ChevronRight, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const SidebarItem = ({ to, icon: Icon, label, active }) => (
  <Link 
    to={to} 
    className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 group ${
      active 
        ? 'bg-indigo-600 shadow-lg shadow-indigo-200 text-white' 
        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg transition-colors ${active ? 'bg-white/20 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-white group-hover:text-indigo-600'}`}>
        <Icon size={18} />
      </div>
      <span className="font-semibold text-sm tracking-tight">{label}</span>
    </div>
    {active && <ChevronRight size={16} className="text-white/70" />}
  </Link>
);

export default function Sidebar() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchSessions = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/memory/sessions/${user.uid}`);
        const data = await res.json();
        setSessions(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 10000); // Refresh history every 10s
    return () => clearInterval(interval);
  }, [user]);

  return (
    <aside className="hidden lg:flex w-72 bg-white border-r border-gray-100 flex-col h-full overflow-hidden">
      {/* Navigation section */}
      <div className="p-6 space-y-2">
        <div className="px-3 mb-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Primary Navigation</div>
        <SidebarItem 
          to="/" 
          icon={Mic} 
          label="Voice Agent" 
          active={location.pathname === '/'} 
        />
        <SidebarItem 
          to="/todos" 
          icon={CheckSquare} 
          label="Task Manager" 
          active={location.pathname === '/todos'} 
        />
      </div>

      <div className="h-px bg-gray-50 mx-6 my-2"></div>

      {/* Session History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-200">
        <div>
          <div className="px-3 mb-5 flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">MongoDB History</span>
            <History size={14} className="text-gray-300" />
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <div className="px-3 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="px-3 py-8 text-center border-2 border-dashed border-gray-50 rounded-2xl">
                <MessageSquare size={24} className="text-gray-200 mx-auto mb-2" />
                <p className="text-[11px] text-gray-400 font-medium">No sessions saved yet</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div 
                  key={session.id}
                  className="w-full text-left px-4 py-3 rounded-2xl hover:bg-gray-50 group transition-all cursor-default border border-transparent hover:border-gray-100"
                >
                  <div className="text-xs font-bold text-gray-700 group-hover:text-indigo-600 truncate mb-1">
                    {session.summary || "New Conversation"}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-medium italic">
                      {new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {session.processed && (
                      <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">Analyzed</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tip Box */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[1.5rem] p-5 border border-indigo-100/50">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-indigo-500" />
            <span className="text-[11px] font-black text-indigo-700 uppercase tracking-wider">Local Mode</span>
          </div>
          <p className="text-xs text-indigo-800/70 leading-relaxed font-medium">
            Your data is now being saved to MongoDB for free. No credit card required!
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 mt-auto">
        <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
              {user?.displayName?.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active User</p>
              <p className="text-xs font-bold text-gray-700 truncate max-w-[100px]">{user?.displayName}</p>
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
        </div>
      </div>
    </aside>
  );
}
