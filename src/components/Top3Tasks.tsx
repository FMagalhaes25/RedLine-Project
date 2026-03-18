import React from 'react';
import { motion } from 'motion/react';
import { Zap, Target, Check, Trash2 } from 'lucide-react';
import { Task } from '../hooks/useAppLogic';

interface Top3TasksProps {
  tasks: Task[];
  toggleComplete: (id: string, currentStatus: boolean) => Promise<void>;
  toggleTheOneThing: (id: string, currentStatus: boolean) => Promise<void>;
  togglePriority: (id: string, currentPriority: boolean) => Promise<void>;
  confirmDelete: (task: Task) => void;
}

export function Top3Tasks({
  tasks,
  toggleComplete,
  toggleTheOneThing,
  togglePriority,
  confirmDelete
}: Top3TasksProps) {
  const top3Count = tasks.filter(t => t.is_priority && !t.is_completed).length;

  if (top3Count === 0) return null;

  return (
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
        {tasks.filter(t => t.is_the_one_thing && !t.is_completed).map(task => (
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
        {tasks
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
  );
}
