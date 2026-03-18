import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Check, Zap, Trash2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Task } from '../hooks/useAppLogic';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  showOnlyPriority: boolean;
  setShowOnlyPriority: (show: boolean) => void;
  toggleComplete: (id: string, currentStatus: boolean) => Promise<void>;
  toggleTheOneThing: (id: string, currentStatus: boolean) => Promise<void>;
  togglePriority: (id: string, currentPriority: boolean) => Promise<void>;
  confirmDelete: (task: Task) => void;
  isActive: boolean;
  mode: 'focus' | 'break';
}

export function TaskList({
  tasks,
  loading,
  showOnlyPriority,
  setShowOnlyPriority,
  toggleComplete,
  toggleTheOneThing,
  togglePriority,
  confirmDelete,
  isActive,
  mode
}: TaskListProps) {
  return (
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
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center text-white/10 italic">Nenhuma missão encontrada.</div>
          ) : (
            tasks.map((task) => (
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
  );
}
