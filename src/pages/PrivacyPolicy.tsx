import React from 'react';
import { motion } from 'motion/react';
import { Shield, ArrowLeft, Lock, Database, EyeOff } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-[#050505] text-white/90 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-cyber-red hover:text-white transition-colors mb-12 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Voltar ao Acesso</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <header className="border-b border-white/10 pb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-cyber-red/10 border border-cyber-red/20 flex items-center justify-center">
                <Shield className="text-cyber-red" size={24} />
              </div>
              <h1 className="text-4xl font-display font-bold tracking-tight">
                Diretrizes de <span className="text-cyber-red text-glow">Privacidade</span>
              </h1>
            </div>
            <p className="text-white/40 font-mono text-xs uppercase tracking-widest">
              Protocolo de Proteção de Dados // Versão 1.0.0
            </p>
          </header>

          <section className="space-y-10">
            <div className="glass-card p-8 border-white/5 bg-white/[0.01] flex gap-6">
              <div className="shrink-0">
                <Database className="text-cyber-red/60" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 uppercase tracking-wide">1. Coleta e Armazenamento</h2>
                <p className="text-sm leading-relaxed text-white/60">
                  O RedLine coleta apenas os dados técnicos necessários para a sincronização das suas missões e sessões de foco. 
                  Isso inclui seu identificador único de usuário e o status em tempo real do timer de foco.
                </p>
              </div>
            </div>

            <div className="glass-card p-8 border-white/5 bg-white/[0.01] flex gap-6">
              <div className="shrink-0">
                <Lock className="text-cyber-red/60" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 uppercase tracking-wide">2. Segurança de Blindagem</h2>
                <p className="text-sm leading-relaxed text-white/60">
                  A lista de sites bloqueados ("Blindagem") é armazenada de forma privada no seu perfil e acessada apenas pela 
                  extensão do navegador para fins de execução técnica local. Nunca monitoramos seu histórico de navegação geral.
                </p>
              </div>
            </div>

            <div className="glass-card p-8 border-white/5 bg-white/[0.01] flex gap-6">
              <div className="shrink-0">
                <EyeOff className="text-cyber-red/60" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 uppercase tracking-wide">3. Zero Compartilhamento</h2>
                <p className="text-sm leading-relaxed text-white/60">
                  Não vendemos, trocamos ou compartilhamos seus dados com agências de publicidade ou terceiros. 
                  O RedLine é uma ferramenta de performance individual, e seus dados servem apenas para alimentar sua própria evolução.
                </p>
              </div>
            </div>
          </section>

          <footer className="pt-12 border-t border-white/10 text-center">
            <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-mono mb-4">
              RedLine // No Log Policy // Operational Security Active
            </p>
            <p className="text-xs text-white/40">
              Ao criar sua credencial, você concorda com este protocolo de proteção.
            </p>
          </footer>
        </motion.div>
      </div>
    </div>
  );
}
