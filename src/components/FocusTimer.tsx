import React from 'react';
import { Play, Pause, RotateCcw, Clock, Coffee, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FocusTimerProps {
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
}

export function FocusTimer({
  timer,
  setTimer,
  focusDurationMinutes,
  updateFocusDuration,
  breakDurationMinutes,
  updateBreakDuration,
  isActive,
  setIsActive,
  mode,
  setMode
}: FocusTimerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'focus' 
    ? (timer / (focusDurationMinutes * 60)) * 100 
    : (timer / (breakDurationMinutes * 60)) * 100;

  const quickTimesFocus = [25, 50, 90];
  const quickTimesBreak = [5, 10, 15];

  return (
    <div className="glass-card p-8 flex flex-col items-center relative overflow-hidden group">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-red/20 to-transparent"></div>
      <div className={cn(
        "absolute -top-24 -right-24 w-64 h-64 bg-cyber-red/5 blur-[100px] rounded-full transition-opacity duration-1000",
        isActive ? "opacity-100" : "opacity-40"
      )}></div>

      {/* Header Badge */}
      <div className="flex items-center gap-3 mb-10 bg-white/[0.03] px-5 py-2 rounded-full border border-white/10 backdrop-blur-md relative z-10 transition-all group-hover:border-cyber-red/30">
        {mode === 'focus' ? (
          <Target size={14} className="text-cyber-red animate-pulse" />
        ) : (
          <Coffee size={14} className="text-blue-400" />
        )}
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">
          {mode === 'focus' ? 'Protocolo de Foco' : 'Recuperação Neural'}
        </span>
      </div>

      {/* Main Timer Display */}
      <div className="relative mb-12 flex items-center justify-center">
        {/* Progress Ring (Visual Only) */}
        <svg className="w-64 h-64 sm:w-80 sm:h-80 -rotate-90 opacity-20">
          <circle
            cx="50%"
            cy="50%"
            r="48%"
            fill="none"
            stroke="white"
            strokeWidth="1"
            className="transition-all duration-1000"
          />
          <circle
            cx="50%"
            cy="50%"
            r="48%"
            fill="none"
            stroke={mode === 'focus' ? '#FF0033' : '#60A5FA'}
            strokeWidth="3"
            strokeDasharray="100 100"
            strokeDashoffset={100 - progress}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className={cn(
            "text-7xl sm:text-8xl font-display font-bold tracking-tight tabular-nums transition-all duration-700",
            isActive 
              ? mode === 'focus' ? "text-cyber-red text-glow scale-105" : "text-blue-400 scale-105" 
              : "text-white/80"
          )}>
            {formatTime(timer)}
          </div>
          <div className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-bold mt-2">
            Restante
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 w-full mb-10 relative z-10">
        <button 
          onClick={() => setIsActive(!isActive)}
          className={cn(
            "flex-[2] py-5 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all duration-300",
            isActive 
              ? "bg-white/5 text-white border border-white/10 hover:bg-white/10" 
              : mode === 'focus' 
                ? "bg-cyber-red text-white shadow-lg shadow-cyber-red/20 hover:scale-[1.02] active:scale-[0.98]"
                : "bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          {isActive ? <><Pause size={18} /> Pausar</> : <><Play size={18} /> Iniciar Protocolo</>}
        </button>
        <button 
          onClick={() => { 
            setIsActive(false); 
            setTimer(mode === 'focus' ? focusDurationMinutes * 60 : breakDurationMinutes * 60); 
          }}
          className="flex-1 p-5 glass-card border-white/5 hover:border-white/10 text-white/30 hover:text-white transition-all group/reset"
        >
          <RotateCcw size={18} className="group-hover/reset:rotate-[-180deg] transition-transform duration-500" />
        </button>
      </div>

      {/* Settings Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
        {/* Focus Duration Selection */}
        <div className={cn(
          "p-5 rounded-2xl border transition-all duration-500",
          mode === 'focus' ? "bg-white/[0.04] border-white/10" : "bg-transparent border-transparent opacity-40 grayscale"
        )}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Foco</span>
            <span className="text-xs font-bold text-cyber-red font-display">{focusDurationMinutes}:00</span>
          </div>
          <div className="flex gap-2">
            {quickTimesFocus.map(t => (
              <button
                key={t}
                disabled={isActive}
                onClick={() => updateFocusDuration(t)}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                  focusDurationMinutes === t ? "bg-cyber-red text-white" : "bg-white/5 text-white/30 hover:bg-white/10"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button disabled={isActive} onClick={() => updateFocusDuration(focusDurationMinutes - 5)} className="text-white/20 hover:text-white/60"><ChevronLeft size={16} /></button>
            <input 
              type="range" min="1" max="180" step="1" 
              value={focusDurationMinutes} 
              disabled={isActive}
              onChange={(e) => updateFocusDuration(Number(e.target.value))}
              className="flex-1 h-1 bg-white/10 rounded-full appearance-none accent-cyber-red cursor-pointer"
            />
            <button disabled={isActive} onClick={() => updateFocusDuration(focusDurationMinutes + 5)} className="text-white/20 hover:text-white/60"><ChevronRight size={16} /></button>
          </div>
        </div>

        {/* Break Duration Selection */}
        <div className={cn(
          "p-5 rounded-2xl border transition-all duration-500",
          mode === 'break' ? "bg-white/[0.04] border-white/10" : "bg-transparent border-transparent opacity-40 grayscale"
        )}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Intervalo</span>
            <span className="text-xs font-bold text-blue-400 font-display">{breakDurationMinutes}:00</span>
          </div>
          <div className="flex gap-2">
            {quickTimesBreak.map(t => (
              <button
                key={t}
                disabled={isActive}
                onClick={() => updateBreakDuration(t)}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                  breakDurationMinutes === t ? "bg-blue-500 text-white" : "bg-white/5 text-white/30 hover:bg-white/10"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button disabled={isActive} onClick={() => updateBreakDuration(breakDurationMinutes - 1)} className="text-white/20 hover:text-white/60"><ChevronLeft size={16} /></button>
            <input 
              type="range" min="1" max="60" step="1" 
              value={breakDurationMinutes} 
              disabled={isActive}
              onChange={(e) => updateBreakDuration(Number(e.target.value))}
              className="flex-1 h-1 bg-white/10 rounded-full appearance-none accent-blue-500 cursor-pointer"
            />
            <button disabled={isActive} onClick={() => updateBreakDuration(breakDurationMinutes + 1)} className="text-white/20 hover:text-white/60"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* Mode Toggle Tabs */}
      <div className="mt-8 flex p-1.5 bg-white/[0.02] rounded-2xl border border-white/5 w-full relative z-10 transition-all hover:border-white/10">
        <button 
          onClick={() => setMode('focus')}
          className={cn(
            "flex-1 py-3 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 flex items-center justify-center gap-2",
            mode === 'focus' ? "bg-white/5 text-cyber-red shadow-lg" : "text-white/20 hover:text-white/40"
          )}
        >
          <Target size={12} /> Foco Principal
        </button>
        <button 
          onClick={() => setMode('break')}
          className={cn(
            "flex-1 py-3 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 flex items-center justify-center gap-2",
            mode === 'break' ? "bg-white/5 text-blue-400 shadow-lg" : "text-white/20 hover:text-white/40"
          )}
        >
          <Coffee size={12} /> Descanso Tático
        </button>
      </div>
    </div>
  );
}
