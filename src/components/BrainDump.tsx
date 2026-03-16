import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Send, Terminal, History, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function BrainDump() {
  const [content, setContent] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (showHistory && user) fetchHistory();
  }, [showHistory, user]);

  const fetchHistory = async () => {
    if (!supabase || !user) return;
    try {
      const { data, error } = await supabase
        .from('brain_dump')
        .select('*')
        .eq('user_id', user.id)
        .order('captured_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Fetch history error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !supabase || !user) return;

    try {
      const { error } = await supabase
        .from('brain_dump')
        .insert([{ content: content.trim(), user_id: user.id }]);
      
      if (error) throw error;
      setContent('');
      setIsVisible(true);
      if (showHistory) fetchHistory();
      setTimeout(() => setIsVisible(false), 2000);
    } catch (err) {
      console.error('Erro no brain dump:', err);
    }
  };

  return (
    <div className="glass-card p-6 border-cyber-red/20 bg-cyber-red/[0.02]">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={18} className="text-cyber-red" />
        <h2 className="font-display font-semibold text-lg text-white">Escudo de Distração</h2>
        <div className="ml-auto flex items-center gap-1.5 bg-cyber-red/10 px-2 py-0.5 rounded border border-cyber-red/20">
          <div className="w-1 h-1 rounded-full bg-cyber-red animate-pulse"></div>
          <span className="text-[8px] font-mono text-cyber-red uppercase">Gancho_Neural_Ativo</span>
        </div>
      </div>
      
      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-4">
        Descarregue o pensamento. Purifique o foco.
      </p>

      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyber-red/40">
          <Terminal size={14} />
        </div>
        <input 
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Digite a distração aqui..."
          className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-10 pr-12 text-sm text-white focus:border-cyber-red/50 outline-none transition-all font-mono"
        />
        <button 
          type="submit"
          className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 bottom-1.5 sm:bottom-2 px-2 sm:px-3 text-cyber-red hover:bg-cyber-red/10 rounded-lg transition-all"
        >
          <Send size={16} />
        </button>
      </form>

      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-[10px] text-cyber-red font-bold uppercase tracking-tighter text-center"
          >
            Pensamento Arquivado. Retorne ao Fluxo.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 pt-4 border-t border-white/5">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
        >
          <History size={14} />
          {showHistory ? 'Ocultar Arquivo' : 'Ver Arquivo Neural'}
          {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-2">
                {history.length === 0 ? (
                  <p className="text-[10px] italic text-white/10 uppercase py-2">Nenhum registro encontrado.</p>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="p-3 bg-white/[0.02] rounded-lg border border-white/5 flex justify-between items-center group">
                      <span className="text-xs text-white/60 font-mono">{item.content}</span>
                      <span className="text-[8px] text-white/20 font-mono uppercase">
                        {new Date(item.captured_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
