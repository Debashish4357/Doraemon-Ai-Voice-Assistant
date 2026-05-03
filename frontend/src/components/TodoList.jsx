import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { CheckCircle, Circle, Trash2, Plus, ListTodo, Search, Calendar, Sparkles, Activity, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function TodoList() {
  const { user } = useContext(AuthContext);
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [filter, setFilter] = useState("all"); 
  const [loading, setLoading] = useState(true);

  const fetchTodos = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/todos/${user.uid}`);
      const data = await res.json();
      setTodos(data);
    } catch (e) {
      console.error("Error fetching todos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
    // Poll every 5 seconds since we are no longer using real-time Firebase
    const interval = setInterval(fetchTodos, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const toggleTodo = async (todo) => {
    const newStatus = todo.status === "open" ? "closed" : "open";
    try {
      await fetch(`${API_BASE_URL}/todos/${user.uid}/${todo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      fetchTodos();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/todos/${user.uid}/${id}`, { method: "DELETE" });
      fetchTodos();
    } catch (e) {
      console.error(e);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      await fetch(`${API_BASE_URL}/todos/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          task: newTask,
          status: "open"
        })
      });
      setNewTask("");
      fetchTodos();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTodos = todos.filter(t => {
    if (filter === 'open') return t.status === 'open';
    if (filter === 'closed') return t.status === 'closed';
    return true;
  });

  const completionRate = todos.length > 0 ? Math.round((todos.filter(t => t.status === 'closed').length / todos.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-10">
      {/* Header Section */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm border border-indigo-100">
              <ListTodo size={20} />
            </div>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Productivity</span>
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Task Manager</h2>
          <p className="text-gray-500 font-medium max-w-lg">Using MongoDB & Python Backend (No Cloud Limits!)</p>
        </motion.div>

        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
          {['all', 'open', 'closed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                filter === f ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Stats & Add */}
        <div className="xl:col-span-4 space-y-6">
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-50 sticky top-24"
          >
            <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
              <Plus size={20} className="text-indigo-600" />
              Quick Task
            </h3>
            <form onSubmit={addTodo} className="space-y-4">
              <textarea 
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="What needs to be done?"
                rows="4"
                className="w-full bg-gray-50 border-none rounded-2xl p-5 text-gray-700 placeholder:text-gray-300 focus:ring-2 focus:ring-indigo-100 transition-all resize-none font-medium"
              />
              <button 
                type="submit" 
                disabled={!newTask.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-indigo-100 transition-all transform active:scale-95 flex items-center justify-center gap-3"
              >
                <Sparkles size={18} />
                Create Task
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-gray-50">
              <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">
                <span>Progress Tracker</span>
                <Activity size={14} />
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                    <span className="text-gray-500 text-sm font-bold">Open Tasks</span>
                  </div>
                  <span className="text-gray-900 font-black">{todos.filter(t => t.status === 'open').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-gray-500 text-sm font-bold">Completed</span>
                  </div>
                  <span className="text-green-600 font-black">{todos.filter(t => t.status === 'closed').length}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-indigo-600 uppercase">
                    <span>Efficiency</span>
                    <span>{completionRate}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${completionRate}%` }}
                      className="h-full bg-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Tasks List */}
        <div className="xl:col-span-8">
          <AnimatePresence mode="popLayout">
            {loading ? (
               <div className="space-y-4">
                 {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-3xl animate-pulse" />)}
               </div>
            ) : filteredTodos.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white rounded-[2.5rem] p-20 text-center border border-gray-100 shadow-sm"
              >
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <Search size={36} className="text-gray-200" />
                </div>
                <h3 className="text-2xl font-black text-gray-800 mb-3">All Caught Up!</h3>
                <p className="text-gray-400 max-w-sm mx-auto font-medium">No tasks found in MongoDB. Use your voice or the form on the left!</p>
              </motion.div>
            ) : (
              <div className="space-y-5">
                {filteredTodos.map((todo) => (
                  <motion.div
                    key={todo.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`group bg-white p-6 rounded-3xl border transition-all duration-500 flex items-center justify-between ${
                      todo.status === 'closed' ? 'border-green-50/50 bg-gray-50/30' : 'border-gray-50 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-5 flex-1 cursor-pointer" onClick={() => toggleTodo(todo)}>
                      <div className="mt-1">
                        {todo.status === 'closed' ? (
                          <CheckCircle className="text-green-500" size={26} />
                        ) : (
                          <Circle className="text-gray-100 group-hover:text-indigo-600 transition-colors" size={26} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-bold text-lg tracking-tight transition-all duration-500 ${
                          todo.status === 'closed' ? 'text-gray-300 line-through' : 'text-gray-800'
                        }`}>
                          {todo.text || todo.task}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <Clock size={12} />
                            {new Date(todo.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                          {todo.status === 'open' && (
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest">Active</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }}
                      className="p-3 text-gray-100 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={20} />
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
