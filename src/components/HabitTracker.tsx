import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Flame, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Habit {
  id: string;
  title: string;
  streak: number;
  last_completed: string | null;
  completed_today: boolean;
}

import { useAuth } from '../contexts/AuthContext';

export function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState('');
  const [loading, setLoading] = useState(true);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchHabits();
    }
  }, [user]);

  const fetchHabits = async () => {
    if (!supabase || !user) return;
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const now = new Date();
      // Use local date for better reliability in different timezones
      const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      const yesterdayDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toISOString().split('T')[0];

      const staleHabitIds: string[] = [];
      const formatted = (data || []).map((h: any) => {
        let currentStreak = h.streak || 0;
        const lastCompleted = h.last_completed;

        // Reset streak if missed days (last_completed is not today and not yesterday)
        if (lastCompleted && lastCompleted !== today && lastCompleted !== yesterday) {
          currentStreak = 0;
          staleHabitIds.push(h.id);
        }

        return {
          ...h,
          streak: currentStreak,
          completed_today: lastCompleted === today,
          last_completed: lastCompleted
        };
      });

      // Update stale streaks in background
      if (staleHabitIds.length > 0) {
        supabase.from('habits').update({ streak: 0 }).in('id', staleHabitIds).eq('user_id', user.id).then();
      }

      setHabits(formatted);
    } catch (err) {
      console.error('Fetch habits error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.trim() || !supabase || !user) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert([{ title: newHabit, user_id: user.id }])
        .select();
      if (error) throw error;
      if (data) setHabits([...habits, { ...data[0], completed_today: false }]);
      setNewHabit('');
    } catch (err) {
      console.error('Add habit error:', err);
    }
  };

  const toggleHabit = async (id: string, currentlyCompleted: boolean, currentStreak: number, lastCompleted: string | null) => {
    if (!supabase) return;
    
    const now = new Date();
    const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const yesterdayDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    let newStreak = currentStreak;
    let newLastCompleted = lastCompleted;

    if (currentlyCompleted) {
      newStreak = Math.max(0, currentStreak - 1);
      newLastCompleted = null;
    } else {
      newStreak = (lastCompleted === yesterday) ? currentStreak + 1 : 1;
      newLastCompleted = today;
    }

    // Optimistic update for better UX
    const previousHabits = [...habits];
    setHabits(habits.map(h => h.id === id ? { ...h, streak: newStreak, completed_today: !currentlyCompleted, last_completed: newLastCompleted } : h));

    try {
      const { error } = await supabase
        .from('habits')
        .update({ 
          streak: newStreak, 
          last_completed: newLastCompleted 
        })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Toggle habit error:', err);
      // Rollback on error
      setHabits(previousHabits);
    }
  };

  const deleteHabit = async (id: string) => {
    if (!supabase || !user) return;
    try {
      await supabase.from('habits').delete().eq('id', id).eq('user_id', user.id);
      setHabits(habits.filter(h => h.id !== id));
    } catch (err) {
      console.error('Delete habit error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Flame size={18} className="text-cyber-red" />
        <h2 className="font-display font-semibold text-lg text-white">Protocolo de Hábitos</h2>
      </div>

      <form onSubmit={addHabit} className="relative group">
        <input 
          type="text"
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="Implantar novo hábito..."
          className="w-full glass-input py-3 px-5 text-sm text-white placeholder:text-white/20 outline-none"
        />
        <button type="submit" className="absolute right-1 sm:right-2 top-1.5 sm:top-2 bottom-1.5 sm:bottom-2 px-3 sm:px-4 btn-primary flex items-center gap-2 text-[10px] sm:text-xs">
          <Plus size={14} />
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      </form>

      <div className="grid grid-cols-1 gap-3">
        <AnimatePresence mode="popLayout">
          {habits.map((habit) => (
            <motion.div
              key={habit.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => toggleHabit(habit.id, habit.completed_today, habit.streak, habit.last_completed)}
              className={cn(
                "glass-card p-4 flex items-center justify-between group transition-all cursor-pointer touch-manipulation",
                habit.completed_today ? "border-cyber-red/40 bg-cyber-red/[0.03]" : "hover:bg-white/[0.02]"
              )}
            >
              <div className="flex items-center gap-4">
                <div 
                  className={cn(
                    "w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all",
                    habit.completed_today 
                      ? "bg-cyber-red border-cyber-red text-white shadow-lg shadow-cyber-red/20" 
                      : "border-white/10 group-hover:border-cyber-red/40"
                  )}
                >
                  {habit.completed_today && <Check size={20} strokeWidth={3} />}
                </div>
                <div>
                  <h3 className={cn("text-sm font-semibold transition-all", habit.completed_today ? "text-white" : "text-white/70")}>
                    {habit.title}
                  </h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Flame size={12} className={habit.streak > 0 ? "text-cyber-red" : "text-white/10"} />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">
                      {habit.streak} {habit.streak === 1 ? 'Dia de Sequência' : 'Dias de Sequência'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHabitToDelete(habit);
                  }}
                  className="p-2 rounded-lg text-white/40 hover:text-cyber-red hover:bg-cyber-red/5 transition-all touch-manipulation"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {habitToDelete && (
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
              <h2 className="text-xl font-display font-bold text-white mb-2">Eliminar Protocolo?</h2>
              <p className="text-white/40 text-sm mb-8">
                Esta ação irá remover permanentemente o hábito <span className="text-white font-bold">"{habitToDelete.title}"</span> e zerar sua sequência.
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setHabitToDelete(null)}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/5 text-white/60 font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                >
                  Abortar
                </button>
                <button 
                  onClick={() => {
                    deleteHabit(habitToDelete.id);
                    setHabitToDelete(null);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-cyber-red text-white font-bold text-xs uppercase tracking-widest hover:bg-cyber-red/80 transition-all shadow-lg shadow-cyber-red/20"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
