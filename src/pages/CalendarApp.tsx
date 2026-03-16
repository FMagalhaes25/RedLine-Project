import React from 'react';
import { CalendarView } from '../components/CalendarView';
import { Task } from '../hooks/useAppLogic';
import { motion } from 'motion/react';

interface CalendarAppProps {
  tasks: Task[];
  onAddTask: (e?: React.FormEvent, titleOverride?: string, dateOverride?: Date) => Promise<void>;
  onToggleComplete: (id: string, currentStatus: boolean) => Promise<void>;
}

export function CalendarApp({ tasks, onAddTask, onToggleComplete }: CalendarAppProps) {
  return (
    <motion.main
      key="calendar"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <CalendarView 
        tasks={tasks} 
        onAddTask={onAddTask}
        onToggleComplete={onToggleComplete}
      />
    </motion.main>
  );
}
