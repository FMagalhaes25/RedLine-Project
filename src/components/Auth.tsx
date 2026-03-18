import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, Activity, LogIn, UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';


// Local utility replacement if cn is not exported nicely from App.tsx
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cx(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AuthProps {
  onShowPrivacy: () => void;
}

export function Auth({ onShowPrivacy }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const oauthRedirectUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Sistema desabilitado: Supabase não configurado.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Verifique seu email para confirmar o registro.");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || 'Ocorreu um erro durante a autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setError("Sistema desabilitado: Supabase não configurado.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: oauthRedirectUrl,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setError(err.message || 'Ocorreu um erro ao conectar com Google.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Tactical Background Pulse */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[50%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-cyber-red/[0.03] blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[50vw] h-[50vw] rounded-full bg-cyber-red/[0.02] blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 md:p-10 border-cyber-red/20 shadow-[0_0_50px_rgba(255,45,85,0.05)]">
          {/* Logo Area */}
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              className="w-16 h-16 rounded-2xl bg-cyber-red/[0.05] border border-cyber-red/20 flex items-center justify-center mb-6 relative group"
              whileHover={{ scale: 1.05 }}
            >
              <div className="absolute inset-0 bg-cyber-red/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Activity className="text-cyber-red relative z-10" size={32} />
            </motion.div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-white mb-2 text-center">
              RED<span className="text-cyber-red text-glow">LINE</span>
            </h1>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] text-center">
              Acesso Restrito // Identifique-se
            </p>
          </div>

          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, mb: 0 }}
                animate={{ opacity: 1, height: 'auto', mb: 24 }}
                exit={{ opacity: 0, height: 0, mb: 0 }}
                className="p-4 bg-cyber-red/10 border border-cyber-red/30 rounded-xl flex items-center gap-3 text-cyber-red overflow-hidden"
              >
                <AlertCircle size={18} className="shrink-0" />
                <p className="text-xs font-medium leading-relaxed">{error}</p>
              </motion.div>
            )}
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0, mb: 0 }}
                animate={{ opacity: 1, height: 'auto', mb: 24 }}
                exit={{ opacity: 0, height: 0, mb: 0 }}
                className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 text-white/80 overflow-hidden"
              >
                <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <p className="text-xs font-medium leading-relaxed">{message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="text-white/20 group-focus-within:text-cyber-red transition-colors" size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Endereço de E-mail"
                  required
                  className="w-full glass-input py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-cyber-red/50 transition-colors bg-white/[0.02]"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-white/20 group-focus-within:text-cyber-red transition-colors" size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha de Acesso"
                  required
                  className="w-full glass-input py-4 pl-12 pr-12 text-sm text-white placeholder:text-white/20 outline-none focus:border-cyber-red/50 transition-colors bg-white/[0.02]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/20 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="flex items-start gap-3 px-1">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/10 bg-white/5 text-cyber-red focus:ring-cyber-red focus:ring-offset-0"
                />
                <label htmlFor="consent" className="text-[11px] leading-relaxed text-white/40">
                  Eu li e aceito as <button type="button" onClick={onShowPrivacy} className="text-cyber-red hover:text-white transition-colors underline decoration-cyber-red/30">Diretrizes de Privacidade</button> do protocolo RedLine.
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!isLogin && !consentAccepted)}
              className={cx(
                "w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all relative overflow-hidden group flex items-center justify-center gap-2",
                (loading || (!isLogin && !consentAccepted)) ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/5" : "bg-cyber-red hover:bg-cyber-red/90 text-white shadow-[0_0_20px_rgba(255,45,85,0.3)] hover:shadow-[0_0_30px_rgba(255,45,85,0.5)] border border-cyber-red"
              )}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                  <span>{isLogin ? 'INICIAR SESSÃO' : 'CRIAR CREDENCIAL'}</span>
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">OU</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            {/* Google Log In Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all relative overflow-hidden group flex items-center justify-center gap-3 bg-[#ffffff05] hover:bg-[#ffffff0a] text-white border border-white/10"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>CONTINUAR COM GOOGLE</span>
            </button>
          </form>

          {/* Toggle Block */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-white/40">
              {isLogin ? "Servidor não reconhece suas credenciais?" : "Já possui registro no sistema?"}
            </p>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setMessage(null);
              }}
              className="mt-2 text-xs font-bold text-cyber-red hover:text-white uppercase tracking-widest transition-colors"
            >
              {isLogin ? "Solicitar Acesso (Cadastrar)" : "Retornar ao Login"}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-[9px] text-white/20 uppercase tracking-[0.3em] font-mono">
            Redline // Protocolo de Segurança Ativo
          </p>
        </div>
      </motion.div>
    </div>
  );
}
