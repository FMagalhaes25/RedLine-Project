import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Calendar, Activity, User, KanbanSquare, LogOut } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AppView } from '../hooks/useAppLogic';

// Local CN replacement
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  view: AppView;
  setView: (view: AppView) => void;
  signOut: () => void;
  level: number;
  xp: number;
  isActive: boolean;
  mode: 'focus' | 'break';
  operatorName?: string | null;
  operatorAvatarUrl?: string | null;
  operatorEmail?: string | null;
}

export function Layout({ children, view, setView, signOut, level, xp, isActive, mode, operatorName, operatorAvatarUrl, operatorEmail }: LayoutProps) {
  const displayName = operatorName?.trim() || operatorEmail?.split('@')[0] || 'OPERADOR_01';

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

      {/* Navigation Rail */}
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
        <button 
          onClick={() => setView('jira')}
          className={cn("p-3 transition-colors", view === 'jira' ? "text-cyber-red" : "text-white/40 hover:text-cyber-red")}
          title="Operações Jira"
        >
          <KanbanSquare size={22} />
        </button>
        <div className="mt-auto flex flex-col items-center gap-4">
          <button
            onClick={() => setView('profile')}
            className={cn(
              "w-14 h-14 rounded-2xl border transition-all overflow-hidden flex items-center justify-center",
              view === 'profile'
                ? "border-cyber-red/60 bg-cyber-red/10"
                : "border-white/5 bg-white/[0.02] hover:border-cyber-red/30"
            )}
            title="Abrir perfil"
          >
            <User
              size={20}
              className={cn(
                "transition-colors",
                view === 'profile' ? "text-cyber-red" : "text-white/45"
              )}
            />
          </button>
          <button onClick={signOut} className="p-3 text-white/40 hover:text-cyber-red transition-colors" title="Sair do sistema">
             <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </nav>

      <div className="w-full max-w-6xl px-4 md:px-8 lg:pl-32 py-8 flex flex-col min-h-screen relative z-10">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-white">
              RED<span className="text-cyber-red text-glow">LINE</span>
            </h1>
            <p className="text-[10px] text-cyber-red font-bold uppercase tracking-widest mt-1">
              {view === 'dashboard' && 'Produtividade Moderna'}
              {view === 'calendar' && 'Arquivo de Missões'}
              {view === 'jira' && 'Operações Jira'}
              {view === 'profile' && 'Identidade do Operador'}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-white/60 text-right">
                {displayName.toUpperCase()} <span className="text-cyber-red ml-2">[NÍVEL {level}]</span>
              </span>
              {operatorEmail && (
                <span className="text-[10px] text-white/25 mt-1">{operatorEmail}</span>
              )}
              <div className="w-32 h-1 bg-white/5 rounded-full mt-1 overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-cyber-red" 
                  initial={{ width: 0 }}
                  animate={{ width: `${(xp / (level * 500)) * 100}%` }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setView('profile')}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-cyber-red/30 p-0.5 relative group cursor-pointer"
              title="Abrir perfil"
            >
              <img
                src={operatorAvatarUrl || "https://picsum.photos/seed/operator/100/100"}
                className="rounded-full grayscale object-cover w-full h-full"
                alt={displayName}
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1 -right-1 bg-cyber-red text-[7px] sm:text-[8px] font-black px-1 sm:px-1.5 py-0.5 rounded-full border border-black text-white">
                QG
              </div>
            </button>
          </div>
        </header>

        {/* Page Content */}
        {children}

        <footer className="mt-auto pt-12 text-[10px] text-white/20 uppercase tracking-[0.4em] text-center pb-24 lg:pb-0">
          Redline Productivity OS // v2.3.0 // Conexão Segura
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-t border-white/5 flex items-center justify-around px-1 py-2">
        <button
          onClick={() => setView('dashboard')}
          className={cn("flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors", view === 'dashboard' ? "text-cyber-red" : "text-white/40 hover:text-white/70")}
        >
          <LayoutDashboard size={20} />
          <span className="text-[8px] uppercase tracking-widest font-bold">Base</span>
        </button>
        <button
          onClick={() => setView('calendar')}
          className={cn("flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors", view === 'calendar' ? "text-cyber-red" : "text-white/40 hover:text-white/70")}
        >
          <Calendar size={20} />
          <span className="text-[8px] uppercase tracking-widest font-bold">Missões</span>
        </button>
        <button
          onClick={() => setView('jira')}
          className={cn("flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors", view === 'jira' ? "text-cyber-red" : "text-white/40 hover:text-white/70")}
        >
          <KanbanSquare size={20} />
          <span className="text-[8px] uppercase tracking-widest font-bold">Jira</span>
        </button>
        <button
          onClick={() => setView('profile')}
          className={cn("flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors", view === 'profile' ? "text-cyber-red" : "text-white/40 hover:text-white/70")}
        >
          <User size={20} />
          <span className="text-[8px] uppercase tracking-widest font-bold">Perfil</span>
        </button>
        <button
          onClick={signOut}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors text-white/40 hover:text-cyber-red"
          title="Sair do sistema"
        >
          <LogOut size={20} />
          <span className="text-[8px] uppercase tracking-widest font-bold">Sair</span>
        </button>
      </nav>
    </div>
  );
}
