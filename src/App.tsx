/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Target, 
  Zap, 
  Clock, 
  Trash2, 
  Check, 
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  Activity,
  LayoutDashboard,
  Calendar,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CalendarView } from './components/CalendarView';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  is_priority: boolean;
  created_at: string;
}

export default function App() {
  const [view, setView] = useState<'dashboard' | 'calendar'>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [showOnlyPriority, setShowOnlyPriority] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Focus Engine State
  const [timer, setTimer] = useState(30 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Supabase Connection & Fetch
  useEffect(() => {
    if (!supabase) {
      setError("SUPABASE_CONFIG_MISSING: Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase!
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      const local = localStorage.getItem('redline_tasks');
      if (local) setTasks(JSON.parse(local));
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const taskData = {
      title: newTask,
      is_completed: false,
      is_priority: tasks.filter(t => !t.is_completed && t.is_priority).length < 3,
      created_at: new Date().toISOString(),
    };

    try {
      if (supabase) {
        const { data, error } = await supabase.from('tasks').insert([taskData]).select();
        if (error) throw error;
        if (data) setTasks([data[0], ...tasks]);
      } else {
        const localTask = { ...taskData, id: Math.random().toString(36).substr(2, 9) };
        const updated = [localTask, ...tasks];
        setTasks(updated);
        localStorage.setItem('redline_tasks', JSON.stringify(updated));
      }
      setNewTask('');
    } catch (err) {
      console.error('Add error:', err);
    }
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      if (supabase) {
        await supabase.from('tasks').update({ is_completed: !currentStatus }).eq('id', id);
      }
      const updated = tasks.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t);
      setTasks(updated);
      localStorage.setItem('redline_tasks', JSON.stringify(updated));
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      if (supabase) {
        await supabase.from('tasks').delete().eq('id', id);
      }
      const updated = tasks.filter(t => t.id !== id);
      setTasks(updated);
      localStorage.setItem('redline_tasks', JSON.stringify(updated));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const togglePriority = async (id: string, currentPriority: boolean) => {
    if (!currentPriority && tasks.filter(t => !t.is_completed && t.is_priority).length >= 3) {
      return;
    }
    try {
      if (supabase) {
        await supabase.from('tasks').update({ is_priority: !currentPriority }).eq('id', id);
      }
      const updated = tasks.map(t => t.id === id ? { ...t, is_priority: !currentPriority } : t);
      setTasks(updated);
      localStorage.setItem('redline_tasks', JSON.stringify(updated));
    } catch (err) {
      console.error('Priority error:', err);
    }
  };

  // Timer Logic
  useEffect(() => {
    if (isActive && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsActive(false);
      alert(mode === 'focus' ? "Focus session complete!" : "Break over!");
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timer, mode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredTasks = showOnlyPriority 
    ? tasks.filter(t => t.is_priority && !t.is_completed)
    : tasks;

  return (
    <div className="min-h-screen flex flex-col items-center">
      {/* Navigation Rail (Modern Touch) */}
      <nav className="fixed left-0 top-0 h-full w-20 bg-black/40 backdrop-blur-md border-r border-white/5 hidden lg:flex flex-col items-center py-8 gap-8 z-50">
        <div className="w-12 h-12 rounded-2xl bg-cyber-red flex items-center justify-center shadow-lg shadow-cyber-red/30 mb-4">
          <Activity className="text-white" size={24} />
        </div>
        <button 
          onClick={() => setView('dashboard')}
          className={cn("p-3 transition-colors", view === 'dashboard' ? "text-cyber-red" : "text-white/40 hover:text-cyber-red")}
        >
          <LayoutDashboard size={22} />
        </button>
        <button 
          onClick={() => setView('calendar')}
          className={cn("p-3 transition-colors", view === 'calendar' ? "text-cyber-red" : "text-white/40 hover:text-cyber-red")}
        >
          <Calendar size={22} />
        </button>
        <button className="p-3 text-white/40 hover:text-cyber-red transition-colors mt-auto"><Settings size={22} /></button>
      </nav>

      <div className="w-full max-w-6xl px-4 md:px-8 lg:pl-32 py-8 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-white">
              RED<span className="text-cyber-red text-glow">LINE</span>
            </h1>
            <p className="text-xs text-white/40 font-medium uppercase tracking-widest mt-1">
              {view === 'dashboard' ? 'Modern Productivity OS' : 'Mission Archive & Schedule'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Mobile Nav Toggle */}
            <div className="lg:hidden flex gap-2">
              <button onClick={() => setView('dashboard')} className={cn("p-2 rounded-lg", view === 'dashboard' ? "bg-cyber-red/20 text-cyber-red" : "text-white/40")}><LayoutDashboard size={20} /></button>
              <button onClick={() => setView('calendar')} className={cn("p-2 rounded-lg", view === 'calendar' ? "bg-cyber-red/20 text-cyber-red" : "text-white/40")}><Calendar size={20} /></button>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-white/60">OPERATOR_01</span>
              <span className="text-[10px] text-cyber-red font-bold uppercase">System Active</span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-cyber-red/30 p-0.5">
              <img src="https://picsum.photos/seed/operator/100/100" className="rounded-full grayscale" alt="User" referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 glass-card border-cyber-red/50 bg-cyber-red/10 text-cyber-red flex items-center gap-3"
          >
            <AlertCircle size={18} />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
            <motion.main 
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left: Tasks */}
              <div className="lg:col-span-7 space-y-8">
                {/* Input Section */}
                <form onSubmit={addTask} className="relative group">
                  <input 
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="What's the next mission?"
                    className="w-full glass-input py-4 px-6 text-white placeholder:text-white/20 outline-none"
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 px-6 btn-primary flex items-center gap-2"
                  >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </form>

                {/* Task List */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Target size={18} className="text-cyber-red" />
                      <h2 className="font-display font-semibold text-lg">Mission Log</h2>
                    </div>
                    <button 
                      onClick={() => setShowOnlyPriority(!showOnlyPriority)}
                      className={cn(
                        "text-xs font-bold px-4 py-2 rounded-full transition-all",
                        showOnlyPriority 
                          ? "bg-cyber-red text-white shadow-lg shadow-cyber-red/20" 
                          : "bg-white/5 text-white/40 hover:bg-white/10"
                      )}
                    >
                      {showOnlyPriority ? "All Tasks" : "Top 3 Focus"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {loading ? (
                        <div className="py-12 text-center text-white/20 animate-pulse">Synchronizing...</div>
                      ) : filteredTasks.length === 0 ? (
                        <div className="py-12 text-center text-white/10 italic">No objectives found.</div>
                      ) : (
                        filteredTasks.map((task) => (
                          <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn(
                              "glass-card p-4 flex items-center justify-between group transition-all duration-300",
                              task.is_completed ? "opacity-40 grayscale" : "hover:bg-white/[0.05] hover:border-cyber-red/40",
                              task.is_priority && !task.is_completed && "border-cyber-red/60 bg-cyber-red/[0.02]"
                            )}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <button 
                                onClick={() => toggleComplete(task.id, task.is_completed)}
                                className={cn(
                                  "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                  task.is_completed 
                                    ? "bg-cyber-red border-cyber-red text-white" 
                                    : "border-white/20 hover:border-cyber-red"
                                )}
                              >
                                {task.is_completed && <Check size={14} strokeWidth={3} />}
                              </button>
                              <span className={cn(
                                "text-sm font-medium transition-all",
                                task.is_completed && "line-through text-white/40"
                              )}>
                                {task.title}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => togglePriority(task.id, task.is_priority)}
                                className={cn(
                                  "p-2 rounded-lg transition-colors",
                                  task.is_priority ? "text-cyber-red bg-cyber-red/10" : "text-white/20 hover:text-cyber-red hover:bg-cyber-red/5"
                                )}
                              >
                                <Zap size={16} fill={task.is_priority ? "currentColor" : "none"} />
                              </button>
                              <button 
                                onClick={() => deleteTask(task.id)}
                                className="p-2 rounded-lg text-white/20 hover:text-cyber-red hover:bg-cyber-red/5 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Right: Timer & Stats */}
              <div className="lg:col-span-5 space-y-8">
                <div className="glass-card p-8 flex flex-col items-center relative overflow-hidden">
                  {/* Background Glow */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyber-red/20 blur-[80px] rounded-full"></div>
                  
                  <div className="flex items-center gap-2 mb-8 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                    <Clock size={14} className="text-cyber-red" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Focus Engine</span>
                  </div>

                  <div className={cn(
                    "text-8xl font-display font-bold tracking-tighter mb-8 tabular-nums transition-all duration-500",
                    isActive ? "text-cyber-red text-glow scale-105" : "text-white/90"
                  )}>
                    {formatTime(timer)}
                  </div>

                  <div className="flex gap-4 w-full">
                    <button 
                      onClick={() => setIsActive(!isActive)}
                      className={cn(
                        "flex-1 py-4 btn-primary flex items-center justify-center gap-2",
                        isActive && "from-white/10 to-white/5 text-white shadow-none border border-white/10"
                      )}
                    >
                      {isActive ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Start Session</>}
                    </button>
                    <button 
                      onClick={() => { setIsActive(false); setTimer(mode === 'focus' ? 30 * 60 : 5 * 60); }}
                      className="p-4 glass-card border-white/10 hover:border-white/20 text-white/40 hover:text-white transition-all"
                    >
                      <RotateCcw size={20} />
                    </button>
                  </div>

                  <div className="mt-8 flex p-1 bg-white/5 rounded-xl border border-white/10 w-full">
                    <button 
                      onClick={() => { setMode('focus'); setTimer(30 * 60); setIsActive(false); }}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                        mode === 'focus' ? "bg-white/10 text-white shadow-sm" : "text-white/30 hover:text-white/60"
                      )}
                    >
                      Focus
                    </button>
                    <button 
                      onClick={() => { setMode('break'); setTimer(5 * 60); setIsActive(false); }}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                        mode === 'break' ? "bg-white/10 text-white shadow-sm" : "text-white/30 hover:text-white/60"
                      )}
                    >
                      Break
                    </button>
                  </div>
                </div>

                {/* Stats / Briefing */}
                <div className="glass-card p-6 space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <ChevronRight size={14} className="text-cyber-red" />
                    Performance Metrics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Active</p>
                      <p className="text-2xl font-display font-bold text-white">{tasks.filter(t => !t.is_completed).length}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Completed</p>
                      <p className="text-2xl font-display font-bold text-cyber-red">{tasks.filter(t => t.is_completed).length}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-cyber-red/5 rounded-2xl border border-cyber-red/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyber-red/20 flex items-center justify-center">
                        <Zap size={16} className="text-cyber-red" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Priority Slots</span>
                    </div>
                    <span className="text-sm font-display font-bold text-white">{tasks.filter(t => t.is_priority && !t.is_completed).length} / 3</span>
                  </div>
                </div>
              </div>
            </motion.main>
          ) : (
            <motion.main
              key="calendar"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <CalendarView tasks={tasks} />
            </motion.main>
          )}
        </AnimatePresence>

        <footer className="mt-auto pt-12 text-[10px] text-white/20 uppercase tracking-[0.4em] text-center">
          Redline Productivity OS // v2.0.4 // Connection Secure
        </footer>
      </div>
    </div>
  );
}
