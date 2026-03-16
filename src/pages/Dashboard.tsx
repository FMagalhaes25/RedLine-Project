import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Target, Zap, Clock, Trash2, Check, ChevronRight, Play, Pause, RotateCcw } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Task } from '../hooks/useAppLogic';
import { HabitTracker } from '../components/HabitTracker';
import { BrainDump } from '../components/BrainDump';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DashboardProps {
  tasks: Task[];
  newTask: string;
  setNewTask: (value: string) => void;
  newCategory: string;
  setNewCategory: (value: string) => void;
  addTask: (e?: React.FormEvent, titleOverride?: string, dateOverride?: Date) => Promise<void>;
  showOnlyPriority: boolean;
  setShowOnlyPriority: (show: boolean) => void;
  loading: boolean;
  xp: number;
  level: number;
  timer: number;
  setTimer: (timer: number) => void;
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  mode: 'focus' | 'break';
  setMode: (mode: 'focus' | 'break') => void;
  toggleComplete: (id: string, currentStatus: boolean) => Promise<void>;
  togglePriority: (id: string, currentPriority: boolean) => Promise<void>;
  toggleTheOneThing: (id: string, currentStatus: boolean) => Promise<void>;
  confirmDelete: (task: Task) => void;
  isToday: (dateString: string) => boolean;
}

export function Dashboard({
  tasks, newTask, setNewTask, newCategory, setNewCategory, addTask,
  showOnlyPriority, setShowOnlyPriority, loading, xp, level,
  timer, setTimer, isActive, setIsActive, mode, setMode,
  toggleComplete, togglePriority, toggleTheOneThing, confirmDelete, isToday
}: DashboardProps) {

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const dashboardTasks = tasks.filter(t => {
    if (t.scheduled_at) return isToday(t.scheduled_at);
    return isToday(t.created_at);
  });

  const filteredTasks = showOnlyPriority 
    ? dashboardTasks.filter(t => t.is_priority && !t.is_completed)
    : dashboardTasks;

  const top3Count = dashboardTasks.filter(t => t.is_priority && !t.is_completed).length;

  return (
    <motion.main 
      key="dashboard"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10"
    >
      {/* Left: Tasks */}
      <div className="lg:col-span-7 space-y-8">
        {/* Input Section */}
        <form onSubmit={addTask} className="relative group flex items-center">
          <div className="flex bg-black/20 rounded-xl overflow-hidden self-stretch sm:self-auto w-full">
            <select 
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="bg-transparent text-[10px] font-bold uppercase py-4 px-4 text-white/40 outline-none border-r border-white/5 cursor-pointer hover:text-cyber-red transition-colors min-w-[100px]"
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
              placeholder="Nova missão?"
              className="flex-1 glass-input border-none py-4 px-4 sm:px-6 text-sm text-white placeholder:text-white/20 outline-none min-w-0"
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

        {/* Top 3 Section (Inc. A Única Coisa) */}
        {top3Count > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-cyber-red flex items-center gap-2">
                 <Zap size={14} fill="currentColor" />
                 Foco Top 3 de Hoje
              </h3>
              <span className="text-[10px] font-mono text-white/20">
                {top3Count}/3 SLOTS
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {/* One Thing First */}
              {dashboardTasks.filter(t => t.is_the_one_thing && !t.is_completed).map(task => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="glass-card p-6 border-cyber-red bg-cyber-red/[0.05] shadow-[0_0_20px_rgba(255,45,85,0.1)] relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                     <Target size={40} />
                  </div>
                  <div className="flex items-center gap-4 relative z-10">
                    <button 
                      onClick={() => toggleComplete(task.id, task.is_completed)}
                      className="w-10 h-10 rounded-xl border-2 border-cyber-red bg-cyber-red text-white flex items-center justify-center animate-pulse"
                    >
                      <Check size={24} strokeWidth={4} />
                    </button>
                    <div className="flex-1">
                      <span className="text-lg font-bold text-white block mb-1">{task.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/50 uppercase font-black">MISSÃO ALPHA (ÚNICA)</span>
                        {task.category && <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-white/30">{task.category}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => confirmDelete(task)} className="p-2 text-white/20 hover:text-cyber-red transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Other Priority Tasks */}
              {dashboardTasks
                .filter(t => t.is_priority && !t.is_the_one_thing && !t.is_completed)
                .map(task => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="glass-card p-4 border-cyber-red/30 bg-cyber-red/[0.02] flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => toggleComplete(task.id, task.is_completed)}
                        className="w-8 h-8 rounded-lg border-2 border-cyber-red/50 text-cyber-red/50 hover:bg-cyber-red hover:text-white flex items-center justify-center transition-all"
                      >
                        {task.is_completed ? <Check size={18} /> : <Zap size={14} />}
                      </button>
                      <div>
                        <span className="text-sm font-bold text-white block">{task.title}</span>
                        <span className="text-[8px] text-white/30 uppercase font-bold tracking-widest">Prioridade Nível 2</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => toggleTheOneThing(task.id, !!task.is_the_one_thing)} className="p-2 text-white/20 hover:text-cyber-red transition-colors" title="Elevar para Missão Alpha"><Target size={16} /></button>
                      <button onClick={() => togglePriority(task.id, task.is_priority)} className="p-2 text-white/20 hover:text-cyber-red transition-colors"><Zap size={16} fill="currentColor" /></button>
                      <button onClick={() => confirmDelete(task)} className="p-2 text-white/20 hover:text-cyber-red transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </motion.div>
                ))}
            </div>
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
                "text-[10px] font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all",
                showOnlyPriority 
                  ? "bg-cyber-red text-white shadow-lg shadow-cyber-red/20" 
                  : "bg-white/5 text-white/40 hover:bg-white/10"
              )}
            >
              {showOnlyPriority ? "Todas" : "Foco Top 3"}
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
                        <span className="hidden sm:inline-block text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded bg-white/5 text-white/30 border border-white/5">
                          {task.category}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
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
                        onClick={() => confirmDelete(task)}
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
          
          <div className="flex items-center gap-2 mb-8 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 relative z-10">
            <Clock size={14} className="text-cyber-red" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Motor de Foco</span>
          </div>

          <div className={cn(
            "text-6xl sm:text-8xl font-display font-bold tracking-tighter mb-8 tabular-nums transition-all duration-500 relative z-10",
            isActive ? "text-cyber-red text-glow scale-105" : "text-white/90"
          )}>
            {formatTime(timer)}
          </div>

          <div className="flex gap-4 w-full relative z-10">
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
              className="p-4 glass-card border-white/10 hover:border-white/20 text-white/40 hover:text-white transition-all cursor-pointer"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          <div className="mt-8 flex p-1 bg-white/5 rounded-xl border border-white/10 w-full relative z-10">
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
              <span className="text-sm font-display font-bold text-white">{top3Count} / 3</span>
            </div>
          </div>
        </div>
      </div>
    </motion.main>
  );
}
