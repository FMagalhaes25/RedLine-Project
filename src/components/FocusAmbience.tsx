import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, CloudRain, TreePine, Timer, Music, X, Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SoundOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  url: string;
}

const SOUND_OPTIONS: SoundOption[] = [
  { id: 'none', name: 'Nenhum', icon: <VolumeX size={16} />, url: '' },
  { id: 'rain', name: 'Chuva', icon: <CloudRain size={16} />, url: '/sounds/rain.mp3.wav' },
  { id: 'forest', name: 'Floresta', icon: <TreePine size={16} />, url: '/sounds/florest.mp3.wav' },
  { id: 'lofi1', name: 'Lofi Alpha', icon: <Music size={16} />, url: '/sounds/lofi1.mp3.wav' },
  { id: 'lofi2', name: 'Lofi Beta', icon: <Music size={16} />, url: '/sounds/lofi2.mp3.wav' },
];

interface FocusAmbienceProps {
  isActive: boolean;
  mode: 'focus' | 'break';
}

export function FocusAmbience({ isActive, mode }: FocusAmbienceProps) {
  const [selectedSound, setSelectedSound] = useState<string>(() => localStorage.getItem('redline_focus_sound') || 'none');
  const [volume, setVolume] = useState<number>(() => Number(localStorage.getItem('redline_focus_volume')) || 0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    localStorage.setItem('redline_focus_sound', selectedSound);
  }, [selectedSound]);

  useEffect(() => {
    localStorage.setItem('redline_focus_volume', String(volume));
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const sound = SOUND_OPTIONS.find(s => s.id === selectedSound);
    
    if (isActive && mode === 'focus' && sound && sound.url) {
      if (!audioRef.current) {
        audioRef.current = new Audio(sound.url);
        audioRef.current.loop = true;
      } else if (audioRef.current.src !== sound.url) {
        audioRef.current.pause();
        audioRef.current = new Audio(sound.url);
        audioRef.current.loop = true;
      }
      
      audioRef.current.volume = volume;
      audioRef.current.play().catch(err => console.error("Erro ao reproduzir áudio:", err));
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }

    return () => {
      if (audioRef.current && (!isActive || mode !== 'focus')) {
        audioRef.current.pause();
      }
    };
  }, [isActive, mode, selectedSound]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="glass-card p-6 border-white/5 bg-white/[0.02]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
          <Music size={14} className="text-cyber-red" />
          Som Ambiente
        </h3>
        <div className="flex items-center gap-2">
          {volume === 0 ? <VolumeX size={14} className="text-white/20" /> : <Volume2 size={14} className="text-cyber-red" />}
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-24 accent-cyber-red h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {SOUND_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelectedSound(option.id)}
            className={cn(
              "flex items-center justify-between p-3 rounded-xl border transition-all group",
              selectedSound === option.id 
                ? "bg-cyber-red/10 border-cyber-red/40 text-white" 
                : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                selectedSound === option.id ? "bg-cyber-red text-white" : "bg-white/5 text-white/20 group-hover:text-white/40"
              )}>
                {option.icon}
              </div>
              <span className="text-xs font-bold uppercase tracking-tight">{option.name}</span>
            </div>
            {selectedSound === option.id && (
              <div className="w-5 h-5 rounded-full bg-cyber-red flex items-center justify-center shadow-lg shadow-cyber-red/20">
                <Check size={12} strokeWidth={4} />
              </div>
            )}
          </button>
        ))}
      </div>

      {isActive && mode === 'focus' && selectedSound !== 'none' && (
        <div className="mt-6 p-3 bg-cyber-red/5 border border-cyber-red/10 rounded-xl flex items-center gap-3 animate-pulse">
          <div className="flex gap-1">
            <div className="w-1 h-3 bg-cyber-red rounded-full" />
            <div className="w-1 h-3 bg-cyber-red rounded-full animate-bounce" />
            <div className="w-1 h-3 bg-cyber-red rounded-full animate-bounce [animation-delay:0.2s]" />
          </div>
          <span className="text-[10px] font-bold text-cyber-red uppercase tracking-widest">Áudio Alpha Ativo</span>
        </div>
      )}
    </div>
  );
}
