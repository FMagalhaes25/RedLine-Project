import { useState, useEffect, useRef, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  is_priority: boolean;
  is_the_one_thing?: boolean;
  category?: string;
  created_at: string;
  scheduled_at?: string;
}

export type AppView = 'dashboard' | 'calendar' | 'profile';

export function useAppLogic() {
  const [view, setView] = useState<AppView>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [showOnlyPriority, setShowOnlyPriority] = useState(false);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [lastSessionRating, setLastSessionRating] = useState(0);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const { user, signOut } = useAuth();

  // Focus Engine State
  const [timer, setTimer] = useState(30 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!supabase) {
      setError("CONFIG_SUPABASE_AUSENTE: Por favor, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase!
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      const local = localStorage.getItem('redline_tasks');
      if (local) setTasks(JSON.parse(local));
    } finally {
      setLoading(false);
    }
  };

  const isToday = (dateString: string) => {
    const d = new Date(dateString);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const addTask = async (e?: FormEvent, titleOverride?: string, dateOverride?: Date) => {
    if (e) e.preventDefault();
    const titleToUse = titleOverride || newTask;
    if (!titleToUse.trim()) return;

    const taskData = {
      title: titleToUse,
      is_completed: false,
      is_priority: tasks.filter(t => !t.is_completed && t.is_priority && (t.scheduled_at ? isToday(t.scheduled_at) : isToday(t.created_at))).length < 3,
      category: dateOverride ? 'Agendado' : newCategory,
      created_at: new Date().toISOString(),
      scheduled_at: dateOverride ? dateOverride.toISOString() : new Date().toISOString(),
      user_id: user?.id,
    };

    try {
      if (supabase) {
        const { data, error } = await supabase.from('tasks').insert([taskData]).select();
        if (error) throw error;
        if (data) setTasks([data[0], ...tasks]);
      } else {
        const localTask = { ...taskData, id: Math.random().toString(36).substr(2, 9) };
        const updated = [localTask, ...tasks];
        setTasks(updated);
        localStorage.setItem('redline_tasks', JSON.stringify(updated));
      }
      if (!titleOverride) setNewTask('');
    } catch (err) {
      console.error('Add error:', err);
    }
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      if (supabase && user) {
        await supabase.from('tasks').update({ is_completed: !currentStatus }).eq('id', id).eq('user_id', user.id);
      }
      const updated = tasks.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t);
      setTasks(updated);
      localStorage.setItem('redline_tasks', JSON.stringify(updated));
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const confirmDelete = (task: Task) => {
    setTaskToDelete(task);
  };

  const deleteTask = async (id: string) => {
    try {
      if (supabase && user) {
        await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id);
      }
      const updated = tasks.filter(t => t.id !== id);
      setTasks(updated);
      localStorage.setItem('redline_tasks', JSON.stringify(updated));
      setTaskToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const togglePriority = async (id: string, currentPriority: boolean) => {
    if (!currentPriority && tasks.filter(t => !t.is_completed && t.is_priority && (t.scheduled_at ? isToday(t.scheduled_at) : isToday(t.created_at))).length >= 3) {
      setError("LIMITE_ATINGIDO: O Top 3 de hoje já está completo. Conclua uma missão ou remova a prioridade.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    try {
      if (supabase && user) {
        await supabase.from('tasks').update({ is_priority: !currentPriority }).eq('id', id).eq('user_id', user.id);
      }
      const updated = tasks.map(t => t.id === id ? { ...t, is_priority: !currentPriority } : t);
      setTasks(updated);
      localStorage.setItem('redline_tasks', JSON.stringify(updated));
    } catch (err) {
      console.error('Priority error:', err);
    }
  };

  const toggleTheOneThing = async (id: string, currentStatus: boolean) => {
    try {
      if (supabase && user) {
        await supabase.from('tasks').update({ is_the_one_thing: false }).neq('id', id).eq('user_id', user.id);
        await supabase.from('tasks').update({ 
          is_the_one_thing: !currentStatus,
          is_priority: true 
        }).eq('id', id).eq('user_id', user.id);
      }
      const updated = tasks.map(t => {
        if (t.id === id) {
          return { ...t, is_the_one_thing: !currentStatus, is_priority: true };
        }
        return { ...t, is_the_one_thing: false };
      });
      setTasks(updated);
    } catch (err) {
      console.error('The One Thing error:', err);
    }
  };

  const handleReview = async (rating: number) => {
    try {
      if (supabase && user) {
        await supabase.from('focus_reviews').insert([{ rating, session_duration: 30, user_id: user.id }]);
      }
      setLastSessionRating(rating);
      setShowReview(false);
    } catch (err) {
      console.error('Review error:', err);
    }
  };

  useEffect(() => {
    if (isActive && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsActive(false);
      if (mode === 'focus') {
        const xpGained = 50;
        setXp(prev => prev + xpGained);
        if ((xp + xpGained) >= level * 500) {
          setLevel(prev => prev + 1);
          setXp(0);
        }
        setShowReview(true);
      } else {
        alert("Intervalo encerrado!");
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timer, mode, level, xp]);


  return {
    view, setView,
    tasks,
    newTask, setNewTask,
    newCategory, setNewCategory,
    showOnlyPriority, setShowOnlyPriority,
    loading,
    xp, setXp,
    level, setLevel,
    error, setError,
    showReview, setShowReview,
    lastSessionRating,
    taskToDelete, setTaskToDelete, confirmDelete,
    user, signOut,
    timer, setTimer,
    isActive, setIsActive,
    mode, setMode,
    addTask,
    toggleComplete,
    deleteTask,
    togglePriority,
    toggleTheOneThing,
    handleReview,
    isToday
  };
}
