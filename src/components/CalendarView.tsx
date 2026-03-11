import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameMonth,
  startOfYear,
  endOfYear,
  eachMonthOfInterval
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  is_priority: boolean;
  created_at: string;
}

interface CalendarViewProps {
  tasks: Task[];
}

type Granularity = 'year' | 'month' | 'week' | 'day';

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
  const [granularity, setGranularity] = useState<Granularity>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const next = () => {
    if (granularity === 'year') setCurrentDate(addMonths(currentDate, 12));
    if (granularity === 'month') setCurrentDate(addMonths(currentDate, 1));
    if (granularity === 'week') setCurrentDate(addWeeks(currentDate, 1));
    if (granularity === 'day') setCurrentDate(addDays(currentDate, 1));
  };

  const prev = () => {
    if (granularity === 'year') setCurrentDate(subMonths(currentDate, 12));
    if (granularity === 'month') setCurrentDate(subMonths(currentDate, 1));
    if (granularity === 'week') setCurrentDate(subWeeks(currentDate, 1));
    if (granularity === 'day') setCurrentDate(subDays(currentDate, 1));
  };

  const renderYear = () => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {months.map((month) => {
          const monthTasks = tasks.filter(t => isSameMonth(new Date(t.created_at), month));
          return (
            <div key={month.toString()} className="glass-card p-4 hover:border-cyber-red/40 transition-colors cursor-pointer" onClick={() => { setCurrentDate(month); setGranularity('month'); }}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-cyber-red mb-2">{format(month, 'MMMM')}</h3>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-display font-bold">{monthTasks.length}</span>
                <span className="text-[10px] text-white/40 uppercase">Missions</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonth = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-white/20 uppercase py-2">{d}</div>
        ))}
        {calendarDays.map((day) => {
          const dayTasks = tasks.filter(t => isSameDay(new Date(t.created_at), day));
          const isCurrentMonth = isSameMonth(day, monthStart);
          return (
            <div 
              key={day.toString()} 
              onClick={() => { setCurrentDate(day); setGranularity('day'); }}
              className={cn(
                "aspect-square glass-card p-2 flex flex-col justify-between cursor-pointer transition-all",
                !isCurrentMonth && "opacity-20",
                isSameDay(day, new Date()) && "border-cyber-red bg-cyber-red/5"
              )}
            >
              <span className="text-[10px] font-bold">{format(day, 'd')}</span>
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 flex-wrap">
                  {dayTasks.slice(0, 3).map(t => (
                    <div key={t.id} className={cn("w-1 h-1 rounded-full", t.is_completed ? "bg-white/20" : "bg-cyber-red")} />
                  ))}
                  {dayTasks.length > 3 && <div className="text-[8px] text-cyber-red">+</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeek = () => {
    const startDate = startOfWeek(currentDate);
    const endDate = endOfWeek(currentDate);
    const weekDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="space-y-4">
        {weekDays.map((day) => {
          const dayTasks = tasks.filter(t => isSameDay(new Date(t.created_at), day));
          return (
            <div key={day.toString()} className="glass-card p-4 flex gap-4 items-start">
              <div className="w-16 text-center">
                <div className="text-[10px] font-bold text-white/40 uppercase">{format(day, 'EEE')}</div>
                <div className="text-xl font-display font-bold">{format(day, 'd')}</div>
              </div>
              <div className="flex-1 space-y-2">
                {dayTasks.length === 0 ? (
                  <div className="text-[10px] text-white/10 uppercase italic py-2">No objectives</div>
                ) : (
                  dayTasks.map(t => (
                    <div key={t.id} className="flex items-center gap-2 text-[11px] uppercase tracking-tight">
                      <div className={cn("w-1.5 h-1.5 rounded-full", t.is_completed ? "bg-white/20" : "bg-cyber-red")} />
                      <span className={t.is_completed ? "line-through text-white/30" : "text-white/70"}>{t.title}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDay = () => {
    const dayTasks = tasks.filter(t => isSameDay(new Date(t.created_at), currentDate));
    return (
      <div className="glass-card p-8 space-y-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div>
            <h3 className="text-2xl font-display font-bold">{format(currentDate, 'MMMM d, yyyy')}</h3>
            <p className="text-[10px] text-cyber-red font-bold uppercase tracking-widest">{format(currentDate, 'EEEE')}</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-display font-bold text-cyber-red">{dayTasks.length}</span>
            <p className="text-[10px] text-white/40 uppercase">Total Missions</p>
          </div>
        </div>
        <div className="space-y-4">
          {dayTasks.length === 0 ? (
            <div className="py-12 text-center text-white/10 uppercase italic">Sector Clear. No missions recorded.</div>
          ) : (
            dayTasks.map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", t.is_completed ? "bg-white/20" : "bg-cyber-red shadow-[0_0_8px_rgba(255,45,85,0.5)]")} />
                  <span className={cn("text-sm font-medium uppercase", t.is_completed && "line-through text-white/30")}>{t.title}</span>
                </div>
                <span className="text-[10px] text-white/20 font-mono">{format(new Date(t.created_at), 'HH:mm')}</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <button onClick={prev} className="p-2 glass-card hover:border-cyber-red/50 transition-colors"><ChevronLeft size={20} /></button>
          <h2 className="text-xl font-display font-bold min-w-[200px] text-center uppercase tracking-widest">
            {granularity === 'year' ? format(currentDate, 'yyyy') : format(currentDate, 'MMMM yyyy')}
          </h2>
          <button onClick={next} className="p-2 glass-card hover:border-cyber-red/50 transition-colors"><ChevronRight size={20} /></button>
        </div>

        <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
          {(['year', 'month', 'week', 'day'] as Granularity[]).map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={cn(
                "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                granularity === g ? "bg-cyber-red text-white shadow-lg shadow-cyber-red/20" : "text-white/30 hover:text-white/60"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={granularity + currentDate.toString()}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {granularity === 'year' && renderYear()}
          {granularity === 'month' && renderMonth()}
          {granularity === 'week' && renderWeek()}
          {granularity === 'day' && renderDay()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
