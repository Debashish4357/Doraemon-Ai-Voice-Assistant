import React, { createContext, useState, useEffect } from 'react';
import { auth, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import LiveVoiceAgent from './components/LiveVoiceAgent';
import { LogIn, Sparkles } from 'lucide-react';

export const AuthContext = createContext();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleSignOut = () => signOut(auth);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0f0f1a]">
        <div className="relative w-24 h-24 mb-8">
           <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin"></div>
           <div className="absolute inset-4 rounded-full border-b-2 border-red-500 animate-spin-slow"></div>
        </div>
        <p className="text-blue-400 font-mono text-sm tracking-widest uppercase animate-pulse">Initializing Doraemon AI...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0f0f1a] relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/20 rounded-full blur-[120px]"></div>
        
        <div className="z-10 flex flex-col items-center max-w-md w-full px-8 text-center">
          <div className="w-20 h-20 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
            <Sparkles className="text-blue-400 w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Doraemon <span className="text-blue-500">AI</span></h1>
          <p className="text-white/40 mb-12 text-lg">Your futuristic voice companion with task management and memory.</p>
          
          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-50 transition-all active:scale-[0.98] shadow-xl shadow-white/5"
          >
            <LogIn size={20} />
            Sign in with Google
          </button>
          
          <p className="mt-8 text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">Secure Neural Link Required</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, handleSignOut }}>
      <LiveVoiceAgent />
    </AuthContext.Provider>
  );
}


