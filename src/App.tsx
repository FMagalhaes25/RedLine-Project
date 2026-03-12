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
import { HabitTracker } from './components/HabitTracker';
import { BrainDump } from './components/BrainDump';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  is_priority: boolean;
  is_the_one_thing?: boolean;
  category?: string;
  created_at: string;
  scheduled_at?: string;
}

export default function App() {
  const [view, setView] = useState<'dashboard' | 'calendar'>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [showOnlyPriority, setShowOnlyPriority] = useState(false);
  const [loading, setLoading] = useState(true);
  // Operator Stats (XP & Leveling)
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [missionsCompleted, setMissionsCompleted] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [lastSessionRating, setLastSessionRating] = useState(0);

  // Focus Engine State
  const [timer, setTimer] = useState(30 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Supabase Connection & Fetch
  useEffect(() => {
    if (!supabase) {
      setError("CONFIG_SUPABASE_AUSENTE: Por favor, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
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

  const addTask = async (e?: React.FormEvent, titleOverride?: string, dateOverride?: Date) => {
    if (e) e.preventDefault();
    const titleToUse = titleOverride || newTask;
    if (!titleToUse.trim()) return;

    const taskData = {
      title: titleToUse,
      is_completed: false,
      is_priority: tasks.filter(t => !t.is_completed && t.is_priority).length < 3,
      category: dateOverride ? 'Agendado' : newCategory,
      created_at: new Date().toISOString(),
      scheduled_at: dateOverride ? dateOverride.toISOString() : new Date().toISOString(),
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
      if (!titleOverride) setNewTask('');
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

  const toggleTheOneThing = async (id: string, currentStatus: boolean) => {
    try {
      if (supabase) {
        // Reset all others first (simplified local update)
        await supabase.from('tasks').update({ is_the_one_thing: false }).neq('id', id);
        await supabase.from('tasks').update({ is_the_one_thing: !currentStatus }).eq('id', id);
      }
      const updated = tasks.map(t => ({
        ...t,
        is_the_one_thing: t.id === id ? !currentStatus : false
      }));
      setTasks(updated);
    } catch (err) {
      console.error('The One Thing error:', err);
    }
  };

  const handleReview = async (rating: number) => {
    try {
      if (supabase) {
        await supabase.from('focus_reviews').insert([{ rating, session_duration: 30 }]);
      }
      setLastSessionRating(rating);
      setShowReview(false);
    } catch (err) {
      console.error('Review error:', err);
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
      // Award XP on completion
      if (mode === 'focus') {
        const xpGained = 50;
        setXp(prev => prev + xpGained);
        if ((xp + xpGained) >= level * 500) {
          setLevel(prev => prev + 1);
          setXp(0);
        }
        setShowReview(true);
      } else {
        alert("Intervalo encerrado!");
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timer, mode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isToday = (dateString: string) => {
    const d = new Date(dateString);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const dashboardTasks = tasks.filter(t => {
    if (t.scheduled_at) return isToday(t.scheduled_at);
    return isToday(t.created_at);
  });

  const filteredTasks = showOnlyPriority 
    ? dashboardTasks.filter(t => t.is_priority && !t.is_completed)
    : dashboardTasks;

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center transition-colors duration-1000",
      isActive && mode === 'focus' ? "bg-[#0A0203]" : "bg-[#050505]"
    )}>
      {/* Tactical Background Pulse */}
      <AnimatePresence>
        {isActive && mode === 'focus' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(255, 45, 85, 0.03) 0%, transparent 70%)',
            }}
          >
            <motion.div 
              className="absolute inset-0 bg-cyber-red/5"
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
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
            <p className="text-[10px] text-cyber-red font-bold uppercase tracking-widest mt-1">
              {view === 'dashboard' ? 'SO de Produtividade Moderna' : 'Arquivo de Missões & Agenda'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Mobile Nav Toggle */}
            <div className="lg:hidden flex gap-2">
              <button onClick={() => setView('dashboard')} className={cn("p-2 rounded-lg", view === 'dashboard' ? "bg-cyber-red/20 text-cyber-red" : "text-white/40")}><LayoutDashboard size={20} /></button>
              <button onClick={() => setView('calendar')} className={cn("p-2 rounded-lg", view === 'calendar' ? "bg-cyber-red/20 text-cyber-red" : "text-white/40")}><Calendar size={20} /></button>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-white/60 text-right">OPERADOR_01 <span className="text-cyber-red ml-2">[NÍVEL {level}]</span></span>
              <div className="w-32 h-1 bg-white/5 rounded-full mt-1 overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-cyber-red" 
                  initial={{ width: 0 }}
                  animate={{ width: `${(xp / (level * 500)) * 100}%` }}
                />
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-cyber-red/30 p-0.5 relative group cursor-pointer">
              <img src="https://picsum.photos/seed/operator/100/100" className="rounded-full grayscale" alt="User" referrerPolicy="no-referrer" />
              <div className="absolute -bottom-1 -right-1 bg-cyber-red text-[8px] font-black px-1.5 py-0.5 rounded-full border border-black text-white">
                QG
              </div>
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
                <form onSubmit={addTask} className="relative group flex items-center">
                  <div className="flex bg-black/20 rounded-xl overflow-hidden self-stretch sm:self-auto">
                    <select 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="bg-transparent text-[10px] font-bold uppercase py-4 px-4 text-white/40 outline-none border-r border-white/5 cursor-pointer hover:text-cyber-red transition-colors"
                    >
                      <option className="bg-[#050505]">Geral</option>
                      <option className="bg-[#050505]">Construção</option>
                      <option className="bg-[#050505]">Aprendizado</option>
                      <option className="bg-[#050505]">Saúde</option>
                      <option className="bg-[#050505]">Admin</option>
                    </select>
                    <input 
                      type="text"
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      placeholder="Qual a próxima missão para hoje?"
                      className="flex-1 glass-input border-none py-4 px-6 text-white placeholder:text-white/20 outline-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-6 btn-primary flex items-center gap-2"
                  >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Adicionar</span>
                  </button>
                </form>

                {/* The One Thing (A Única Coisa) Section */}
                {dashboardTasks.find(t => t.is_the_one_thing && !t.is_completed) && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-cyber-red flex items-center gap-2">
                       <Zap size={14} fill="currentColor" />
                       A Única Coisa
                    </h3>
                    {dashboardTasks.filter(t => t.is_the_one_thing && !t.is_completed).map(task => (
                      <motion.div
                        key={task.id}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-card p-6 border-cyber-red bg-cyber-red/[0.05] shadow-[0_0_20px_rgba(255,45,85,0.1)] relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-2 opacity-20">
                           <Target size={40} />
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                          <button 
                            onClick={() => toggleComplete(task.id, task.is_completed)}
                            className="w-10 h-10 rounded-xl border-2 border-cyber-red bg-cyber-red text-white flex items-center justify-center animate-pulse"
                          >
                            <Check size={24} strokeWidth={4} />
                          </button>
                          <div>
                            <span className="text-lg font-bold text-white block mb-1">{task.title}</span>
                            <span className="text-[10px] text-white/50 uppercase font-black">MISSÃO PRIORITÁRIA ALPHA</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Task List - Blurred during Dopamine Lock */}
                <div className={cn(
                  "space-y-6 transition-all duration-700",
                  isActive && mode === 'focus' && "blur-md opacity-20 pointer-events-none grayscale"
                )}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Target size={18} className="text-cyber-red" />
                      <h2 className="font-display font-semibold text-lg">Registro de Missões</h2>
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
                      {showOnlyPriority ? "Todas as Tarefas" : "Foco Top 3"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {loading ? (
                        <div className="py-12 text-center text-white/20 animate-pulse">Sincronizando...</div>
                      ) : filteredTasks.length === 0 ? (
                        <div className="py-12 text-center text-white/10 italic">Nenhuma missão encontrada.</div>
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
                              {task.category && (
                                <span className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded bg-white/5 text-white/30 border border-white/5">
                                  {task.category}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => toggleTheOneThing(task.id, !!task.is_the_one_thing)}
                                className={cn(
                                  "p-2 rounded-lg transition-colors",
                                  task.is_the_one_thing ? "text-cyber-red bg-cyber-red/10" : "text-white/20 hover:text-cyber-red hover:bg-cyber-red/5"
                                )}
                                title="Marcar como A Única Coisa"
                              >
                                <Target size={16} fill={task.is_the_one_thing ? "currentColor" : "none"} />
                              </button>
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

              {/* Focus Center - Main Column */}
              <div className="lg:col-span-5 space-y-8 z-20">
                <div className="glass-card p-8 flex flex-col items-center relative overflow-hidden">
                  {/* Background Glow */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyber-red/20 blur-[80px] rounded-full"></div>
                  
                  <div className="flex items-center gap-2 mb-8 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                    <Clock size={14} className="text-cyber-red" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Motor de Foco</span>
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
                      {isActive ? <><Pause size={20} /> Pausar</> : <><Play size={20} /> Iniciar Sessão</>}
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
                      Foco
                    </button>
                    <button 
                      onClick={() => { setMode('break'); setTimer(5 * 60); setIsActive(false); }}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                        mode === 'break' ? "bg-white/10 text-white shadow-sm" : "text-white/30 hover:text-white/60"
                      )}
                    >
                      Intervalo
                    </button>
                  </div>
                </div>

                {/* Neural Link: Distraction Shield - Always Active for offloading thoughts */}
                <BrainDump />

                {/* Secondary Components - Blurred during Dopamine Lock */}
                <div className={cn(
                  "space-y-8 transition-all duration-700",
                  isActive && mode === 'focus' && "blur-md opacity-20 pointer-events-none grayscale"
                )}>
                  {/* Habit Tracker Section */}
                  <HabitTracker />

                  {/* Mission Briefing / Stats */}
                  <div className="glass-card p-6 space-y-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <ChevronRight size={14} className="text-cyber-red" />
                        Briefing de Missão
                      </h3>
                      <div className="text-[9px] font-mono text-cyber-red animate-pulse">
                        // LINK_SEGURO_ATIVO
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-cyber-red opacity-50"></div>
                        <div className="flex justify-between items-end mb-2">
                          <p className="text-[10px] font-bold text-white/30 uppercase">Patente Operacional</p>
                          <p className="text-xs font-bold text-cyber-red">NÍVEL {level}</p>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-cyber-red shadow-[0_0_10px_rgba(255,45,85,0.5)]" 
                            initial={{ width: 0 }}
                            animate={{ width: `${(xp / (level * 500)) * 100}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-white/20 mt-2 text-right font-mono">{xp} / {level * 500} XP PARA O PRÓXIMO NÍVEL</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-colors">
                          <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Ativas</p>
                          <p className="text-2xl font-display font-bold text-white">{tasks.filter(t => !t.is_completed).length}</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-colors">
                          <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Concluídas</p>
                          <p className="text-2xl font-display font-bold text-cyber-red">{tasks.filter(t => t.is_completed).length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-cyber-red/5 rounded-2xl border border-cyber-red/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyber-red/20 flex items-center justify-center">
                          <Zap size={16} className="text-cyber-red" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Vagas de Prioridade</span>
                      </div>
                      <span className="text-sm font-display font-bold text-white">{tasks.filter(t => t.is_priority && !t.is_completed).length} / 3</span>
                    </div>
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
              <CalendarView 
                tasks={tasks} 
                onAddTask={addTask}
                onToggleComplete={toggleComplete}
              />
            </motion.main>
          )}
        </AnimatePresence>

        <footer className="mt-auto pt-12 text-[10px] text-white/20 uppercase tracking-[0.4em] text-center">
          Redline Productivity OS // v2.3.0 // Conexão Segura
        </footer>
      </div>

      {/* Focus Review Modal */}
      <AnimatePresence>
        {showReview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="glass-card p-10 max-w-md w-full border-cyber-red/40 bg-cyber-red/[0.02] text-center"
            >
              <div className="flex justify-center mb-6">
                 <div className="w-16 h-16 rounded-full bg-cyber-red/20 flex items-center justify-center border border-cyber-red/30">
                    <Target className="text-cyber-red" size={32} />
                 </div>
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">Sessão Concluída</h2>
              <p className="text-white/40 text-sm mb-8 uppercase tracking-widest font-mono">Como foi a qualidade do seu foco?</p>
              
              <div className="flex justify-center gap-4 mb-10">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star}
                    onClick={() => handleReview(star)}
                    className="group transition-all hover:scale-125"
                  >
                    <Zap 
                       size={36} 
                       className={cn(
                          "transition-colors",
                          star <= 3 ? "text-white/10 group-hover:text-cyber-red" : "text-white/10 group-hover:text-cyber-red"
                        )}
                       fill="none" 
                       strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>

              <blockquote className="text-[10px] text-white/30 italic uppercase tracking-tighter mb-8 px-4">
                 "A disciplina é a ponte entre as metas e as realizações."
              </blockquote>

              <button 
                 onClick={() => setShowReview(false)}
                 className="text-[10px] font-bold text-white/20 hover:text-white uppercase tracking-[0.2em]"
              >
                Ignorar Relatório
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
