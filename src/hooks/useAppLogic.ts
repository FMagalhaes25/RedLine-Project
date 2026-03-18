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

export interface FocusBlockedSite {
  id: string;
  domain: string;
  created_at: string;
}

export type AppView = 'dashboard' | 'focus' | 'calendar' | 'jira' | 'profile' | 'privacy';

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
  const [blockedSites, setBlockedSites] = useState<FocusBlockedSite[]>([]);
  const [blocklistLoading, setBlocklistLoading] = useState(true);
  const { user, signOut } = useAuth();

  // Focus Engine State
  const [focusDurationMinutes, setFocusDurationMinutes] = useState(() => {
    const local = localStorage.getItem('redline_focus_duration_minutes');
    const parsed = Number(local);
    if (Number.isFinite(parsed) && parsed >= 5 && parsed <= 180) {
      return parsed;
    }
    return 30;
  });
  const [breakDurationMinutes, setBreakDurationMinutes] = useState(() => {
    const local = localStorage.getItem('redline_break_duration_minutes');
    const parsed = Number(local);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 60) {
      return parsed;
    }
    return 5;
  });
  const [timer, setTimer] = useState(focusDurationMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>(() => {
    const local = localStorage.getItem('redline_focus_mode');
    return (local as 'focus' | 'break') || 'focus';
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const focusStartedAtRef = useRef<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setError("CONFIG_SUPABASE_AUSENTE: Por favor, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }
    fetchTasks();
    fetchBlockedSites();
  }, [user]);

  const normalizeBlockedSiteDomain = (value: string) => {
    return value
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split('?')[0];
  };

  const updateFocusDuration = (minutes: number) => {
    const normalized = Math.max(1, Math.min(180, Math.floor(minutes || 30)));
    setFocusDurationMinutes(normalized);
    localStorage.setItem('redline_focus_duration_minutes', String(normalized));

    if (!isActive && mode === 'focus') {
      setTimer(normalized * 60);
    }
  };

  const updateBreakDuration = (minutes: number) => {
    const normalized = Math.max(1, Math.min(60, Math.floor(minutes || 5)));
    setBreakDurationMinutes(normalized);
    localStorage.setItem('redline_break_duration_minutes', String(normalized));

    if (!isActive && mode === 'break') {
      setTimer(normalized * 60);
    }
  };

  const toggleMode = (newMode: 'focus' | 'break') => {
    if (newMode === mode) return;
    setMode(newMode);
    localStorage.setItem('redline_focus_mode', newMode);
    if (!isActive) {
      setTimer(newMode === 'focus' ? focusDurationMinutes * 60 : breakDurationMinutes * 60);
    }
  };

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

  const fetchBlockedSites = async () => {
    if (!user) {
      setBlockedSites([]);
      setBlocklistLoading(false);
      return;
    }

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('focus_blocklist')
          .select('id, domain, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setBlockedSites(data || []);
        localStorage.setItem('redline_focus_blocklist', JSON.stringify(data || []));
      } else {
        const local = localStorage.getItem('redline_focus_blocklist');
        setBlockedSites(local ? JSON.parse(local) : []);
      }
    } catch (err) {
      console.error('Blocklist fetch error:', err);
      const local = localStorage.getItem('redline_focus_blocklist');
      setBlockedSites(local ? JSON.parse(local) : []);
    } finally {
      setBlocklistLoading(false);
    }
  };

  const addBlockedSite = async (rawDomain: string) => {
    const domain = normalizeBlockedSiteDomain(rawDomain);

    if (!domain || !domain.includes('.')) {
      setError('SITE_INVALIDO: Informe um domínio válido, como youtube.com.');
      setTimeout(() => setError(null), 3000);
      return false;
    }

    if (blockedSites.some((site) => site.domain === domain)) {
      setError('SITE_DUPLICADO: Este domínio já está na sua blindagem de foco.');
      setTimeout(() => setError(null), 3000);
      return false;
    }

    try {
      if (supabase && user) {
        const { data, error } = await supabase
          .from('focus_blocklist')
          .insert([{ user_id: user.id, domain }])
          .select('id, domain, created_at')
          .single();

        if (error) throw error;

        const updated = [...blockedSites, data];
        setBlockedSites(updated);
        localStorage.setItem('redline_focus_blocklist', JSON.stringify(updated));
      } else {
        const localSite = {
          id: crypto.randomUUID(),
          domain,
          created_at: new Date().toISOString(),
        };
        const updated = [...blockedSites, localSite];
        setBlockedSites(updated);
        localStorage.setItem('redline_focus_blocklist', JSON.stringify(updated));
      }
      return true;
    } catch (err) {
      console.error('Blocklist add error:', err);
      setError('BLOQUEIO_NAO_SALVO: Não foi possível adicionar o domínio.');
      setTimeout(() => setError(null), 3000);
      return false;
    }
  };

  const updateBlockedSite = async (id: string, rawDomain: string) => {
    const domain = normalizeBlockedSiteDomain(rawDomain);

    if (!domain || !domain.includes('.')) {
      setError('SITE_INVALIDO: Informe um domínio válido, como youtube.com.');
      setTimeout(() => setError(null), 3000);
      return false;
    }

    if (blockedSites.some((site) => site.id !== id && site.domain === domain)) {
      setError('SITE_DUPLICADO: Este domínio já está na sua blindagem de foco.');
      setTimeout(() => setError(null), 3000);
      return false;
    }

    try {
      if (supabase && user) {
        const { error } = await supabase
          .from('focus_blocklist')
          .update({ domain })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      const updated = blockedSites.map((site) => (
        site.id === id ? { ...site, domain } : site
      ));
      setBlockedSites(updated);
      localStorage.setItem('redline_focus_blocklist', JSON.stringify(updated));
      return true;
    } catch (err) {
      console.error('Blocklist update error:', err);
      setError('BLOQUEIO_NAO_EDITADO: Não foi possível atualizar o domínio.');
      setTimeout(() => setError(null), 3000);
      return false;
    }
  };

  const removeBlockedSite = async (id: string) => {
    try {
      if (supabase && user) {
        const { error } = await supabase
          .from('focus_blocklist')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      const updated = blockedSites.filter((site) => site.id !== id);
      setBlockedSites(updated);
      localStorage.setItem('redline_focus_blocklist', JSON.stringify(updated));
      return true;
    } catch (err) {
      console.error('Blocklist delete error:', err);
      setError('BLOQUEIO_NAO_REMOVIDO: Não foi possível remover o domínio.');
      setTimeout(() => setError(null), 3000);
      return false;
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
        await supabase.from('focus_reviews').insert([{ rating, session_duration: focusDurationMinutes, user_id: user.id }]);
      }
      setLastSessionRating(rating);
      setShowReview(false);
    } catch (err) {
      console.error('Review error:', err);
    }
  };

  useEffect(() => {
    if (!isActive && mode === 'focus') {
      setTimer(focusDurationMinutes * 60);
    }
  }, [focusDurationMinutes, mode, isActive]);

  useEffect(() => {
    if (isActive && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsActive(false);
      
      // Play Alarm
      const alarm = new Audio('/sounds/alarm.mp3.wav');
      const savedVolume = localStorage.getItem('redline_focus_volume');
      alarm.volume = savedVolume ? Number(savedVolume) : 0.5;
      alarm.play().catch(err => console.error("Erro ao tocar alarme:", err));

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

  // Sync focus state to Supabase so the browser extension can read it
  useEffect(() => {
    if (!supabase || !user) return;
    const isFocusing = isActive && mode === 'focus';
    if (isFocusing && !focusStartedAtRef.current) {
      focusStartedAtRef.current = new Date().toISOString();
    } else if (!isFocusing) {
      focusStartedAtRef.current = null;
    }
    supabase.from('focus_state').upsert(
      {
        user_id: user.id,
        is_active: isFocusing,
        mode,
        started_at: focusStartedAtRef.current,
        duration_minutes: focusDurationMinutes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    ).then(({ error }) => {
      if (error) console.error('[RedLine] focus_state sync:', error.message);
    });
  }, [isActive, mode, user]); // eslint-disable-line react-hooks/exhaustive-deps

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
    blockedSites,
    blocklistLoading,
    user, signOut,
    timer, setTimer,
    focusDurationMinutes,
    updateFocusDuration,
    breakDurationMinutes,
    updateBreakDuration,
    isActive, setIsActive,
    mode, setMode: toggleMode,
    addTask,
    addBlockedSite,
    updateBlockedSite,
    removeBlockedSite,
    toggleComplete,
    deleteTask,
    togglePriority,
    toggleTheOneThing,
    handleReview,
    isToday
  };
}
