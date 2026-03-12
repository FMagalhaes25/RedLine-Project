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
  is_the_one_thing?: boolean;
  category?: string;
  created_at: string;
  scheduled_at?: string;
}

interface CalendarViewProps {
  tasks: Task[];
  onAddTask: (e?: React.FormEvent, title?: string, date?: Date) => Promise<void>;
  onToggleComplete: (id: string, currentStatus: boolean) => Promise<void>;
}

type Granularity = 'year' | 'month' | 'week' | 'day';

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onAddTask, onToggleComplete }) => {
  const [granularity, setGranularity] = useState<Granularity>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [quickTask, setQuickTask] = useState('');

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

  const getTaskDate = (task: Task) => new Date(task.scheduled_at || task.created_at);

  const renderYear = () => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {months.map((month, idx) => {
          const monthTasks = tasks.filter(t => isSameMonth(getTaskDate(t), month));
          return (
            <div key={month.toString()} className="glass-card p-4 hover:border-cyber-red/40 transition-colors cursor-pointer" onClick={() => { setCurrentDate(month); setGranularity('month'); }}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-cyber-red mb-2">{monthNames[idx]}</h3>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-display font-bold">{monthTasks.length}</span>
                <span className="text-[10px] text-white/40 uppercase">Missões</span>
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
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-white/20 uppercase py-2">{d}</div>
        ))}
        {calendarDays.map((day) => {
          const dayTasks = tasks.filter(t => isSameDay(getTaskDate(t), day));
          const isCurrentMonth = isSameMonth(day, monthStart);
          return (
            <div 
              key={day.toString()} 
              onClick={() => { setCurrentDate(day); setGranularity('day'); }}
              className={cn(
                "aspect-square glass-card p-1 sm:p-2 flex flex-col justify-between cursor-pointer transition-all",
                !isCurrentMonth && "opacity-20",
                isSameDay(day, new Date()) && "border-cyber-red bg-cyber-red/5"
              )}
            >
              <span className="text-[8px] sm:text-[10px] font-bold">{format(day, 'd')}</span>
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 flex-wrap overflow-hidden">
                  {dayTasks.slice(0, 2).map(t => (
                    <div key={t.id} className={cn("w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full", t.is_completed ? "bg-white/20" : "bg-cyber-red")} />
                  ))}
                  {dayTasks.length > 2 && <div className="text-[7px] sm:text-[8px] text-cyber-red line-clamp-1">+</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const dayNamesShort = {
    'Sun': 'Dom', 'Mon': 'Seg', 'Tue': 'Ter', 'Wed': 'Qua', 'Thu': 'Qui', 'Fri': 'Sex', 'Sat': 'Sáb'
  };

  const renderWeek = () => {
    const startDate = startOfWeek(currentDate);
    const endDate = endOfWeek(currentDate);
    const weekDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="space-y-4">
        {weekDays.map((day) => {
          const dayTasks = tasks.filter(t => isSameDay(getTaskDate(t), day));
          const dayNameEng = format(day, 'EEE');
          return (
            <div key={day.toString()} className="glass-card p-4 flex gap-4 items-start">
              <div className="w-16 text-center">
                <div className="text-[10px] font-bold text-white/40 uppercase">{(dayNamesShort as any)[dayNameEng]}</div>
                <div className="text-xl font-display font-bold">{format(day, 'd')}</div>
              </div>
              <div className="flex-1 space-y-2">
                {dayTasks.length === 0 ? (
                  <div className="text-[10px] text-white/10 uppercase italic py-2">Sem objetivos</div>
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

  const ptDays = {
    'Sunday': 'Domingo', 'Monday': 'Segunda-feira', 'Tuesday': 'Terça-feira', 
    'Wednesday': 'Quarta-feira', 'Thursday': 'Quinta-feira', 'Friday': 'Sexta-feira', 'Saturday': 'Sábado'
  };
  const ptMonths = {
    'January': 'Janeiro', 'February': 'Fevereiro', 'March': 'Março', 'April': 'Abril', 'May': 'Maio', 'June': 'Junho',
    'July': 'Julho', 'August': 'Agosto', 'September': 'Setembro', 'October': 'Outubro', 'November': 'Novembro', 'December': 'Dezembro'
  };

  const handleAddQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTask.trim()) return;
    await onAddTask(undefined, quickTask, currentDate);
    setQuickTask('');
  };

  const renderDay = () => {
    const dayTasks = tasks.filter(t => isSameDay(getTaskDate(t), currentDate));
    const dayName = format(currentDate, 'EEEE');
    const monthName = format(currentDate, 'MMMM');

    return (
      <div className="glass-card p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-4 gap-4">
          <div>
            <h3 className="text-2xl font-display font-bold text-white">{(ptMonths as any)[monthName]} {format(currentDate, 'd, yyyy')}</h3>
            <p className="text-[10px] text-cyber-red font-bold uppercase tracking-widest">{(ptDays as any)[dayName]}</p>
          </div>
          
          <form onSubmit={handleAddQuickTask} className="w-full md:w-auto flex bg-white/5 rounded-xl overflow-hidden border border-white/10">
            <input 
              type="text"
              value={quickTask}
              onChange={(e) => setQuickTask(e.target.value)}
              placeholder="Nova missão para este dia..."
              className="bg-transparent py-2 px-4 text-xs text-white outline-none w-full md:w-64 placeholder:text-white/20"
            />
            <button type="submit" className="px-4 bg-cyber-red text-white hover:bg-cyber-red/80 transition-colors">
              <List size={14} />
            </button>
          </form>

          <div className="text-right hidden md:block">
            <span className="text-3xl font-display font-bold text-cyber-red">{dayTasks.length}</span>
            <p className="text-[10px] text-white/40 uppercase">Missões Totais</p>
          </div>
        </div>
        <div className="space-y-4">
          {dayTasks.length === 0 ? (
            <div className="py-12 text-center text-white/10 uppercase italic">Setor Limpo. Nenhuma missão registrada.</div>
          ) : (
            dayTasks.map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all group">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onToggleComplete(t.id, t.is_completed)}
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-all",
                      t.is_completed ? "bg-cyber-red border-cyber-red" : "border-white/20 hover:border-cyber-red"
                    )}
                  >
                    {t.is_completed && <List size={10} className="text-white" />}
                  </button>
                  <span className={cn("text-sm font-medium uppercase", t.is_completed && "line-through text-white/30")}>{t.title}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-white/20 font-mono italic">
                    {t.scheduled_at ? 'AGENDADA' : format(new Date(t.created_at), 'HH:mm')}
                  </span>
                </div>
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
          <h2 className="text-xl font-display font-bold min-w-[200px] text-center uppercase tracking-widest text-white">
            {granularity === 'year' ? format(currentDate, 'yyyy') : `${(ptMonths as any)[format(currentDate, 'MMMM')]} ${format(currentDate, 'yyyy')}`}
          </h2>
          <button onClick={next} className="p-2 glass-card hover:border-cyber-red/50 transition-colors"><ChevronRight size={20} /></button>
        </div>

        <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto max-w-full">
          {[
            { id: 'year', label: 'Ano' },
            { id: 'month', label: 'Mês' },
            { id: 'week', label: 'Semana' },
            { id: 'day', label: 'Dia' }
          ].map((g) => (
            <button
              key={g.id}
              onClick={() => setGranularity(g.id as Granularity)}
              className={cn(
                "px-3 sm:px-4 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all whitespace-nowrap",
                granularity === g.id ? "bg-cyber-red text-white shadow-lg shadow-cyber-red/20" : "text-white/30 hover:text-white/60"
              )}
            >
              {g.label}
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
