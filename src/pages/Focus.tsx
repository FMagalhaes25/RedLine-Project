import React from 'react';
import { motion } from 'motion/react';
import { FocusTimer } from '../components/FocusTimer';
import { FocusBlocklistManager } from '../components/FocusBlocklistManager';
import { FocusAmbience } from '../components/FocusAmbience';
import { BrainDump } from '../components/BrainDump';
import { FocusBlockedSite } from '../hooks/useAppLogic';

interface FocusProps {
  timer: number;
  setTimer: (timer: number) => void;
  focusDurationMinutes: number;
  updateFocusDuration: (minutes: number) => void;
  breakDurationMinutes: number;
  updateBreakDuration: (minutes: number) => void;
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  mode: 'focus' | 'break';
  setMode: (mode: 'focus' | 'break') => void;
  blockedSites: FocusBlockedSite[];
  blocklistLoading: boolean;
  addBlockedSite: (domain: string) => Promise<boolean>;
  updateBlockedSite: (id: string, domain: string) => Promise<boolean>;
  removeBlockedSite: (id: string) => Promise<boolean>;
}

export function Focus({
  timer, setTimer, focusDurationMinutes, updateFocusDuration, 
  breakDurationMinutes, updateBreakDuration,
  isActive, setIsActive, mode, setMode,
  blockedSites, blocklistLoading, addBlockedSite, updateBlockedSite, removeBlockedSite
}: FocusProps) {
  return (
    <motion.main
      key="focus"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10"
    >
      {/* Left Column: Focus Timer and Brain Dump */}
      <div className="lg:col-span-7 space-y-8">
        <FocusTimer
          timer={timer}
          setTimer={setTimer}
          focusDurationMinutes={focusDurationMinutes}
          updateFocusDuration={updateFocusDuration}
          breakDurationMinutes={breakDurationMinutes}
          updateBreakDuration={updateBreakDuration}
          isActive={isActive}
          setIsActive={setIsActive}
          mode={mode}
          setMode={setMode}
        />
        
        <BrainDump />
      </div>

      {/* Right Column: Site Blocking and Ambience */}
      <div className="lg:col-span-5 space-y-8">
        <FocusAmbience isActive={isActive} mode={mode} />

        <div className="glass-card p-6 sm:p-8">
          <FocusBlocklistManager
            blockedSites={blockedSites}
            blocklistLoading={blocklistLoading}
            addBlockedSite={addBlockedSite}
            updateBlockedSite={updateBlockedSite}
            removeBlockedSite={removeBlockedSite}
          />
        </div>

        {/* Focus Tips / Info */}
        <div className="glass-card p-6 border-white/5 bg-white/[0.02]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-cyber-red mb-4">Protocolo de Foco</h3>
          <ul className="space-y-3 text-xs text-white/60 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-cyber-red font-mono">•</span>
              A "Blindagem de sites" impede distrações em níveis profundos do sistema.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyber-red font-mono">•</span>
              Use o "Brain Dump" para descarregar pensamentos aleatórios sem perder o foco.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyber-red font-mono">•</span>
              Sessões de 25-50 minutos são ideais para manutenção do estado de Flow.
            </li>
          </ul>
        </div>
      </div>
    </motion.main>
  );
}
