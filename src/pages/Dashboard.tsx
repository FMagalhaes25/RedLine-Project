import React from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { Task } from '../hooks/useAppLogic';
import { HabitTracker } from '../components/HabitTracker';
import { Top3Tasks } from '../components/Top3Tasks';
import { TaskList } from '../components/TaskList';
import { MissionBriefing } from '../components/MissionBriefing';

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
  toggleComplete: (id: string, currentStatus: boolean) => Promise<void>;
  togglePriority: (id: string, currentPriority: boolean) => Promise<void>;
  toggleTheOneThing: (id: string, currentStatus: boolean) => Promise<void>;
  confirmDelete: (task: Task) => void;
  isToday: (dateString: string) => boolean;
  isActive: boolean;
  mode: 'focus' | 'break';
}

export function Dashboard({
  tasks, newTask, setNewTask, newCategory, setNewCategory, addTask,
  showOnlyPriority, setShowOnlyPriority, loading, xp, level,
  toggleComplete, togglePriority, toggleTheOneThing, confirmDelete, isToday,
  isActive, mode
}: DashboardProps) {
  
  const dashboardTasks = tasks.filter(t => {
    if (t.scheduled_at) return isToday(t.scheduled_at);
    return isToday(t.created_at);
  });

  const filteredTasks = showOnlyPriority 
    ? dashboardTasks.filter(t => t.is_priority && !t.is_completed)
    : dashboardTasks;

  return (
    <motion.main 
      key="dashboard"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10"
    >
      {/* Left Column: Mission Control (Tasks) */}
      <div className="lg:col-span-7 space-y-10">
        {/* Input Section */}
        <form onSubmit={addTask} className="relative group flex items-center">
          <div className="flex bg-black/20 rounded-xl overflow-hidden self-stretch sm:self-auto w-full border border-white/5 focus-within:border-cyber-red/30 transition-colors">
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
              className="flex-1 bg-transparent border-none py-4 px-4 sm:px-6 text-sm text-white placeholder:text-white/20 outline-none min-w-0"
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

        {/* Top 3 Section */}
        <Top3Tasks 
          tasks={dashboardTasks}
          toggleComplete={toggleComplete}
          toggleTheOneThing={toggleTheOneThing}
          togglePriority={togglePriority}
          confirmDelete={confirmDelete}
        />

        {/* Task List */}
        <TaskList 
          tasks={filteredTasks}
          loading={loading}
          showOnlyPriority={showOnlyPriority}
          setShowOnlyPriority={setShowOnlyPriority}
          toggleComplete={toggleComplete}
          toggleTheOneThing={toggleTheOneThing}
          togglePriority={togglePriority}
          confirmDelete={confirmDelete}
          isActive={isActive}
          mode={mode}
        />
      </div>

      {/* Right Column: Operator Briefing & Habits */}
      <div className="lg:col-span-5 space-y-8">
        {/* Mission Briefing / Stats */}
        <MissionBriefing 
          tasks={dashboardTasks}
          level={level}
          xp={xp}
        />

        {/* Habit Tracker Section */}
        <div className={isActive && mode === 'focus' ? "blur-sm opacity-50 pointer-events-none" : ""}>
          <HabitTracker />
        </div>

        {/* Alpha Protocol Info */}
        <div className="glass-card p-6 border-cyber-red/10 bg-cyber-red/[0.02]">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyber-red mb-2">Protocolo Alpha // v2.3</h4>
          <p className="text-[10px] text-white/40 leading-relaxed font-mono">
            SISTEMA_RECURSIVO: Focar em "A Única Coisa" aumenta a eficiência neuronal em 40%. 
            Mantenha a constância para subir de patente operacional.
          </p>
        </div>
      </div>
    </motion.main>
  );
}
