import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Zap, Trash2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Task } from '../hooks/useAppLogic';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ModalsProps {
  showReview: boolean;
  handleReview: (rating: number) => void;
  setShowReview: (show: boolean) => void;
  taskToDelete: Task | null;
  setTaskToDelete: (task: Task | null) => void;
  deleteTask: (id: string) => void;
}

export function Modals({ showReview, handleReview, setShowReview, taskToDelete, setTaskToDelete, deleteTask }: ModalsProps) {
  return (
    <>
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
                          "transition-colors text-white/10 group-hover:text-cyber-red"
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

      <AnimatePresence>
        {taskToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="glass-card p-8 max-w-sm w-full border-cyber-red/40 bg-cyber-red/[0.02] text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-cyber-red/20 flex items-center justify-center mx-auto mb-6 border border-cyber-red/30">
                <Trash2 className="text-cyber-red" size={24} />
              </div>
              <h2 className="text-xl font-display font-bold text-white mb-2">Eliminar Missão?</h2>
              <p className="text-white/40 text-sm mb-8">
                Esta ação enviará a missão <span className="text-white font-bold">"{taskToDelete.title}"</span> para o arquivo permanente.
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setTaskToDelete(null)}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/5 text-white/60 font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                >
                  Abortar
                </button>
                <button 
                  onClick={() => deleteTask(taskToDelete.id)}
                  className="flex-1 py-3 px-4 rounded-xl bg-cyber-red text-white font-bold text-xs uppercase tracking-widest hover:shadow-lg hover:shadow-cyber-red/20 transition-all"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
