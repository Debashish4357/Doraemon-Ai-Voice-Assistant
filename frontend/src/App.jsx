import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import LiveVoiceAgent from './components/LiveVoiceAgent';
import TodoList from './components/TodoList';
import Sidebar from './components/Sidebar';
import CustomizeAgentModal from './components/CustomizeAgentModal';
import { LogIn, LogOut, Settings, CheckSquare, Mic, User, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AuthContext = createContext();

function Topbar({ user, login, logout, toggleSidebar, onOpenSettings }) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="h-16 glass-dark sticky top-0 z-50 px-6 flex items-center justify-between border-b border-white/5">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors">
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center neon-glow">
            <Mic size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            <span className="gradient-text">Doraemon</span>
            <span className="text-white/40 ml-1 font-light">AI</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1.5 pr-3 glass hover:bg-white/10 rounded-full transition-all duration-300"
            >
              <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-white/10 shadow-lg" />
              <span className="text-sm font-medium hidden md:block text-white/90">{user.displayName}</span>
            </button>
            
            <AnimatePresence>
              {showDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 glass-dark rounded-xl py-2 border border-white/10 shadow-2xl z-50 backdrop-blur-2xl"
                >
                  <button 
                    onClick={() => {
                      onOpenSettings();
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
                  >
                    <Settings size={16} /> Customize Agent
                  </button>
                  <div className="h-px bg-white/5 my-1 mx-2"></div>
                  <button onClick={logout} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 flex items-center gap-2 transition-colors">
                    <LogOut size={16} /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button 
            onClick={login}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-white px-5 py-2 rounded-full font-bold shadow-lg shadow-primary/20 transition-all duration-300 active:scale-95"
          >
            <LogIn size={18} />
            <span>Sign in</span>
          </button>
        )}
      </div>
    </header>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error('Login error:', e);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0f0f1a]">
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl neon-glow"
      />
      <span className="mt-4 text-white/40 text-sm font-medium tracking-widest uppercase">Initializing Doraemon</span>
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Router>
        <div className="flex flex-col h-screen overflow-hidden">
          <Topbar user={user} login={login} logout={logout} toggleSidebar={toggleSidebar} onOpenSettings={() => setIsSettingsOpen(true)} />
          
          <div className="flex flex-1 overflow-hidden relative">
            <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
            
            <main className="flex-1 overflow-y-auto custom-scrollbar relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={window.location.pathname}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {user ? (
                    <>
                      <Routes>
                        <Route path="/" element={<LiveVoiceAgent />} />
                        <Route path="/todos" element={<TodoList />} />
                      </Routes>
                      <CustomizeAgentModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-transparent to-primary/5">
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mb-8 glass neon-glow"
                      >
                        <Mic size={48} className="text-primary" />
                      </motion.div>
                      <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
                        Meet <span className="gradient-text">Doraemon</span>
                      </h2>
                      <p className="text-white/50 max-w-md text-lg leading-relaxed mb-10">
                        Your friendly AI assistant that learns your routine, manages your tasks, and makes life simpler through natural conversation.
                      </p>
                      <button 
                        onClick={login}
                        className="bg-white/10 hover:bg-white/15 text-white border border-white/10 px-8 py-4 rounded-2xl font-bold transition-all duration-300 backdrop-blur-md shadow-xl flex items-center gap-3 active:scale-95"
                      >
                        <User size={20} />
                        Get Started with Google
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
