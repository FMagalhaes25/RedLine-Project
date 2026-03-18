import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Modals } from './components/Modals';
import { Dashboard } from './pages/Dashboard';
import { Focus } from './pages/Focus';
import { CalendarApp } from './pages/CalendarApp';
import { JiraOps } from './pages/JiraOps';
import { Profile } from './pages/Profile';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { useAppLogic, AppView } from './hooks/useAppLogic';
import { useAuth } from './contexts/AuthContext';
import { useOperatorProfile } from './hooks/useOperatorProfile';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const logic = useAppLogic();
  const operator = useOperatorProfile();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-12 h-12 border-2 border-white/10 border-t-cyber-red rounded-full animate-spin" />
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold tracking-tight text-white">
              RED<span className="text-cyber-red text-glow">LINE</span>
            </h1>
            <p className="mt-1 text-[10px] text-white/30 uppercase tracking-[0.25em]">
              Sincronizando credenciais seguras...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    if (logic.view === 'privacy') {
      return <PrivacyPolicy onBack={() => logic.setView('dashboard')} />;
    }
    return <Auth onShowPrivacy={() => logic.setView('privacy')} />;
  }

  return (
    <>
      <Layout 
        view={logic.view} 
        setView={logic.setView}
        signOut={logic.signOut}
        level={logic.level}
        xp={logic.xp}
        isActive={logic.isActive}
        mode={logic.mode}
        operatorName={operator.username}
        operatorAvatarUrl={operator.avatarUrl}
        operatorEmail={user?.email ?? null}
      >
        {logic.error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 glass-card border-cyber-red/50 bg-cyber-red/10 text-cyber-red flex items-center gap-3 relative z-10"
          >
            <AlertCircle size={18} />
            <p className="text-sm font-medium">{logic.error}</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {logic.view === 'dashboard' && (
            <Dashboard 
              tasks={logic.tasks}
              newTask={logic.newTask}
              setNewTask={logic.setNewTask}
              newCategory={logic.newCategory}
              setNewCategory={logic.setNewCategory}
              addTask={logic.addTask}
              showOnlyPriority={logic.showOnlyPriority}
              setShowOnlyPriority={logic.setShowOnlyPriority}
              loading={logic.loading}
              xp={logic.xp}
              level={logic.level}
              toggleComplete={logic.toggleComplete}
              togglePriority={logic.togglePriority}
              toggleTheOneThing={logic.toggleTheOneThing}
              confirmDelete={logic.confirmDelete}
              isToday={logic.isToday}
              isActive={logic.isActive}
              mode={logic.mode}
            />
          )}

          {logic.view === 'focus' && (
            <Focus 
              timer={logic.timer}
              setTimer={logic.setTimer}
              focusDurationMinutes={logic.focusDurationMinutes}
              updateFocusDuration={logic.updateFocusDuration}
              breakDurationMinutes={logic.breakDurationMinutes}
              updateBreakDuration={logic.updateBreakDuration}
              isActive={logic.isActive}
              setIsActive={logic.setIsActive}
              mode={logic.mode}
              setMode={logic.setMode}
              blockedSites={logic.blockedSites}
              blocklistLoading={logic.blocklistLoading}
              addBlockedSite={logic.addBlockedSite}
              updateBlockedSite={logic.updateBlockedSite}
              removeBlockedSite={logic.removeBlockedSite}
            />
          )}

          {logic.view === 'calendar' && (
            <CalendarApp 
              tasks={logic.tasks}
              onAddTask={logic.addTask}
              onToggleComplete={logic.toggleComplete}
            />
          )}

          {logic.view === 'jira' && (
            <JiraOps />
          )}

          {logic.view === 'profile' && (
            <Profile />
          )}
        </AnimatePresence>
      </Layout>

      <Modals 
        showReview={logic.showReview}
        handleReview={logic.handleReview}
        setShowReview={logic.setShowReview}
        taskToDelete={logic.taskToDelete}
        setTaskToDelete={logic.setTaskToDelete}
        deleteTask={logic.deleteTask}
      />
    </>
  );
}
