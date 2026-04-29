import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle, Circle, Trash2, Plus, ListTodo, Search, Filter, Calendar, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TodoList() {
  const { user } = useContext(AuthContext);
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [filter, setFilter] = useState("all"); // all, open, closed

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, "todos", user.uid, "items"),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setTodos(items);
    });
    
    return () => unsubscribe();
  }, [user]);

  const toggleTodo = async (id, currentStatus) => {
    const newStatus = currentStatus === "open" ? "closed" : "open";
    await updateDoc(doc(db, "todos", user.uid, "items", id), { status: newStatus });
  };

  const deleteTodo = async (id) => {
    await deleteDoc(doc(db, "todos", user.uid, "items", id));
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    await addDoc(collection(db, "todos", user.uid, "items"), {
      text: newTask,
      status: "open",
      createdAt: serverTimestamp()
    });
    setNewTask("");
  };

  const filteredTodos = todos.filter(t => {
    if (filter === 'open') return t.status === 'open';
    if (filter === 'closed') return t.status === 'closed';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-12">
      {/* Header Section */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary neon-glow">
              <ListTodo size={24} />
            </div>
            <span className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Productivity</span>
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">Task Manager</h2>
          <p className="text-white/40 font-medium">Manage tasks extracted by Doraemon or added manually.</p>
        </motion.div>

        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
          {['all', 'open', 'closed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                filter === f ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/30 hover:text-white/60'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Card */}
        <div className="lg:col-span-1">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-dark p-6 rounded-3xl border border-white/10 sticky top-24"
          >
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Plus size={20} className="text-primary" />
              Quick Add
            </h3>
            <form onSubmit={addTodo} className="space-y-4">
              <div className="relative">
                <textarea 
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="What's on your mind?"
                  rows="4"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none"
                />
              </div>
              <button 
                type="submit" 
                disabled={!newTask.trim()}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                Create Task
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="flex items-center justify-between text-xs font-bold text-white/20 uppercase tracking-widest mb-4">
                <span>Statistics</span>
                <Activity size={14} />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-sm">Open Tasks</span>
                  <span className="text-white font-mono">{todos.filter(t => t.status === 'open').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-sm">Completed</span>
                  <span className="text-green-400 font-mono">{todos.filter(t => t.status === 'closed').length}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(todos.filter(t => t.status === 'closed').length / (todos.length || 1)) * 100}%` }}
                    className="h-full bg-primary neon-glow"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tasks List */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="popLayout">
            {filteredTodos.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-dark rounded-3xl p-16 text-center border border-white/5"
              >
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search size={32} className="text-white/20" />
                </div>
                <h3 className="text-xl font-bold text-white/80 mb-2">Clear Skies!</h3>
                <p className="text-white/40 max-w-xs mx-auto">No tasks found matching your filter. Time to relax or start something new.</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {filteredTodos.map((todo) => (
                  <motion.div
                    key={todo.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                    className={`group glass-dark p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                      todo.status === 'closed' ? 'border-green-500/20 bg-green-500/5' : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-4 flex-1 cursor-pointer" onClick={() => toggleTodo(todo.id, todo.status)}>
                      <div className="mt-1">
                        {todo.status === 'closed' ? (
                          <CheckCircle className="text-green-500" size={22} />
                        ) : (
                          <Circle className="text-white/20 group-hover:text-primary transition-colors" size={22} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold text-sm leading-relaxed transition-all duration-300 ${
                          todo.status === 'closed' ? 'text-white/30 line-through' : 'text-white/90'
                        }`}>
                          {todo.text}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-white/20 uppercase tracking-wider">
                            <Calendar size={10} />
                            {todo.createdAt?.toDate ? new Date(todo.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                          </div>
                          {todo.status === 'open' && (
                            <div className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                              In Progress
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => deleteTodo(todo.id)}
                      className="p-2.5 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
