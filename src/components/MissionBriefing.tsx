import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Zap } from 'lucide-react';
import { Task } from '../hooks/useAppLogic';

interface MissionBriefingProps {
  tasks: Task[];
  level: number;
  xp: number;
}

export function MissionBriefing({ tasks, level, xp }: MissionBriefingProps) {
  const top3Count = tasks.filter(t => t.is_priority && !t.is_completed).length;

  return (
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
  );
}
