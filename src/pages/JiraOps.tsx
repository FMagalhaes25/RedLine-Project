import React from 'react';
import { motion } from 'motion/react';
import { KanbanSquare, Lock, Wrench } from 'lucide-react';

export function JiraOps() {
  return (
    <motion.main
      key="jira"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center justify-center min-h-[60vh] relative z-10"
    >
      <div className="glass-card p-10 md:p-16 border-cyber-red/20 bg-cyber-red/[0.02] relative overflow-hidden max-w-lg w-full text-center">
        {/* Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyber-red/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Icon stack */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-cyber-red/[0.06] border border-cyber-red/20 flex items-center justify-center">
              <KanbanSquare size={36} className="text-cyber-red/60" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-black border border-white/10 flex items-center justify-center">
              <Wrench size={14} className="text-white/30" />
            </div>
            <div className="absolute -top-2 -left-2 w-7 h-7 rounded-xl bg-black border border-white/10 flex items-center justify-center">
              <Lock size={12} className="text-white/20" />
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyber-red">
              Módulo Jira // Em Desenvolvimento
            </p>
            <h2 className="text-2xl font-display font-bold text-white">
              Em Breve
            </h2>
            <p className="text-sm text-white/40 leading-relaxed max-w-xs mx-auto">
              A integração com o Jira está sendo construída. Em breve você poderá visualizar suas issues, sprints e backlog diretamente por aqui.
            </p>
          </div>

          {/* Feature list */}
          <div className="w-full space-y-2 pt-2">
            {[
              'Visualização de issues do dia',
              'Sprint ativa e backlog pessoal',
              'Alertas de tarefas atrasadas',
              'Sincronização segura via Edge Function',
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-left"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-red/40 shrink-0" />
                <span className="text-xs text-white/30 uppercase tracking-wider">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.main>
  );
}