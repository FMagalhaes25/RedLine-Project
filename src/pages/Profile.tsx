import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Upload, Image as ImageIcon, Save, ShieldCheck, ShieldAlert, KeyRound, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ProfileData {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  avatar_path?: string | null;
}

function getAvatarUploadErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');

  if (
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('Load failed')
  ) {
    return 'Falha ao enviar imagem. Em Supabase hospedado isso normalmente indica bucket avatars sem policies corretas, bucket inexistente ou bloqueio de origem no Storage.';
  }

  return message || 'Erro ao enviar imagem.';
}

export function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [sendingVerifyEmail, setSendingVerifyEmail] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const emailHandle = user?.email?.split('@')[0] ?? '';

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'password') {
      setStatus('Link de recuperação validado. Defina uma nova senha abaixo para concluir a troca.');
    }
  }, []);

  const fetchProfile = async () => {
    if (!supabase || !user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, bio, avatar_url, avatar_path')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // not found

      if (data) {
        setProfile(data as ProfileData);
        setUsername(data.username || '');
        setBio(data.bio || '');
        setAvatarPath((data as any).avatar_path || null);

        // Bucket privado: usar signed URL quando houver avatar_path
        if ((data as any).avatar_path) {
          const { data: signed, error: signError } = await supabase.storage
            .from('avatars')
            .createSignedUrl((data as any).avatar_path, 60 * 60 * 24); // 24h
          if (signError) throw signError;
          setAvatarUrl(signed.signedUrl);
        } else {
          setAvatarUrl(data.avatar_url || null);
        }
      } else {
        // first time profile
        setProfile({
          id: user.id,
          username: null,
          bio: null,
          avatar_url: null,
          avatar_path: null,
        });
        setUsername('');
        setBio('');
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!supabase || !user) return;
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setStatus(null);

      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${Date.now()}.${fileExt}`;
      // Importante para RLS do Storage: path deve começar com o user.id
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type || undefined,
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      // Bucket privado: gerar URL assinada para exibição
      const { data: signed, error: signError } = await supabase.storage
        .from('avatars')
        .createSignedUrl(filePath, 60 * 60 * 24); // 24h
      if (signError) throw signError;

      const updates = {
        id: user.id,
        avatar_path: filePath,
        avatar_url: null,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'id' });

      if (upsertError) throw upsertError;

      setAvatarPath(filePath);
      setAvatarUrl(signed.signedUrl);
      window.dispatchEvent(new Event('profile_updated'));
      setStatus('Imagem de perfil atualizada com sucesso.');
    } catch (err: any) {
      console.error('Erro ao enviar avatar:', err);
      setStatus(getAvatarUploadErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;

    try {
      setSaving(true);
      setStatus(null);

      const updates = {
        id: user.id,
        username: username || null,
        bio: bio || null,
        avatar_url: profile?.avatar_url || null,
        avatar_path: avatarPath,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;

      window.dispatchEvent(new Event('profile_updated'));
      setStatus('Perfil atualizado.');
    } catch (err: any) {
      console.error('Erro ao salvar perfil:', err);
      setStatus(err.message || 'Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const isEmailVerified = !!((user as any)?.email_confirmed_at || (user as any)?.confirmed_at);

  const handleResendVerification = async () => {
    if (!supabase || !user?.email) return;
    try {
      setSendingVerifyEmail(true);
      setStatus(null);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });
      if (error) throw error;
      setStatus('Email de verificação enviado. Verifique sua caixa de entrada.');
    } catch (err: any) {
      console.error('Erro ao reenviar verificação:', err);
      setStatus(err.message || 'Erro ao reenviar verificação.');
    } finally {
      setSendingVerifyEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    if (!newPassword || newPassword.length < 8) {
      setStatus('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus('As senhas não conferem.');
      return;
    }

    try {
      setChangingPassword(true);
      setStatus(null);

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      setStatus('Senha atualizada com sucesso.');
    } catch (err: any) {
      console.error('Erro ao alterar senha:', err);
      setStatus(err.message || 'Erro ao alterar senha.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSendResetPasswordEmail = async () => {
    if (!supabase || !user?.email) return;
    try {
      setSendingResetEmail(true);
      setStatus(null);
      const redirectTo = `${window.location.origin}?reset=password`;
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo });
      if (error) throw error;
      setStatus('Enviamos um link seguro por email para redefinir sua senha. Ao voltar para o app, finalize a nova senha nesta tela.');
    } catch (err: any) {
      console.error('Erro ao enviar reset:', err);
      setStatus(err.message || 'Erro ao enviar email de redefinição.');
    } finally {
      setSendingResetEmail(false);
    }
  };

  return (
    <motion.main
      key="profile"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10"
    >
      <div className="lg:col-span-5 space-y-6">
        <div className="glass-card p-8 flex flex-col items-center border-cyber-red/30 bg-cyber-red/[0.03] relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyber-red/20 blur-[80px] rounded-full" />
          <div className="flex items-center gap-2 mb-6 relative z-10">
            <User className="text-cyber-red" size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
              Perfil do Operador
            </span>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-2 border-cyber-red/40 p-1.5 relative overflow-hidden bg-black/40">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full rounded-2xl object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-black/60 flex flex-col items-center justify-center text-white/30 text-[10px] gap-2">
                  <ImageIcon size={22} className="text-cyber-red/70" />
                  <span>Sem imagem</span>
                </div>
              )}
              <label className="absolute bottom-1.5 right-1.5 bg-cyber-red text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full cursor-pointer flex items-center gap-1 hover:bg-cyber-red/90 transition-colors">
                <Upload size={12} />
                {uploading ? 'Enviando...' : 'Alterar'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="text-center">
              <p className="text-lg font-display font-bold text-white mb-2">
                {(username || profile?.username || emailHandle || 'Operador').trim()}
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <p className="text-xs text-white/40 uppercase tracking-[0.2em]">
                  {user?.email}
                </p>
                <span className={
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border " +
                  (isEmailVerified ? "text-white/70 border-white/10 bg-white/5" : "text-cyber-red border-cyber-red/30 bg-cyber-red/10")
                }>
                  {isEmailVerified ? <><ShieldCheck size={12} /> verificado</> : <><ShieldAlert size={12} /> não verificado</>}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-6">
        <div className="glass-card p-8 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
            <Mail size={16} className="text-cyber-red" />
            Configurações de Identidade
          </h2>

          {!isEmailVerified && (
            <div className="glass-card p-5 border-cyber-red/30 bg-cyber-red/[0.03]">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-cyber-red">
                    Verificação pendente
                  </p>
                  <p className="text-xs text-white/40">
                    Para reforçar a segurança, confirme o email da conta.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={sendingVerifyEmail}
                  className="px-4 py-2 rounded-xl bg-cyber-red text-white text-[10px] font-bold uppercase tracking-widest hover:bg-cyber-red/90 transition-colors disabled:opacity-60"
                >
                  {sendingVerifyEmail ? 'Enviando...' : 'Verificar conta'}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Email da conta
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full glass-input py-3 px-4 text-sm text-white/40 outline-none cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Nome do operador
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={emailHandle ? `Ex: ${emailHandle}` : 'Ex: Operador_01'}
                className="w-full glass-input py-3 px-4 text-sm text-white placeholder:text-white/20 outline-none"
              />
              <p className="text-[10px] text-white/30 uppercase tracking-widest">
                Esse nome aparece na navbar e no cabeçalho do app.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Briefing Pessoal
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Resumo da missão, foco atual ou qualquer contexto que queira registrar."
                className="w-full glass-input py-3 px-4 text-sm text-white placeholder:text-white/20 outline-none min-h-[120px] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 btn-primary text-xs font-bold uppercase tracking-widest disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar Perfil'}
            </button>
          </form>

          <div className="pt-6 border-t border-white/5 space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <KeyRound size={14} className="text-cyber-red" />
              Segurança
            </h3>

            <div className="glass-card p-5 border-white/5 bg-white/[0.02] space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Troca de senha direta
              </p>
              <p className="text-xs text-white/40">
                Se você já está autenticado, pode atualizar a senha imediatamente abaixo.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Nova senha
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full glass-input py-3 px-4 text-sm text-white placeholder:text-white/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Confirmar senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full glass-input py-3 px-4 text-sm text-white placeholder:text-white/20 outline-none"
                />
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex items-center gap-2 px-6 py-3 btn-primary text-xs font-bold uppercase tracking-widest disabled:opacity-60"
                >
                  <KeyRound size={16} />
                  {changingPassword ? 'Alterando...' : 'Alterar senha'}
                </button>

                <button
                  type="button"
                  onClick={handleSendResetPasswordEmail}
                  disabled={sendingResetEmail}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 text-white/60 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors border border-white/5 disabled:opacity-60"
                >
                  <Send size={16} />
                  {sendingResetEmail ? 'Enviando...' : 'Receber link por email'}
                </button>
              </div>
            </form>

            <p className="text-[10px] text-white/30 uppercase tracking-widest">
              O link por email usa o fluxo nativo do Supabase para recuperação de senha.
            </p>
          </div>

          {status && (
            <p className="mt-3 text-[10px] text-white/40 uppercase tracking-widest">
              {status}
            </p>
          )}

          {!supabase && (
            <p className="mt-3 text-[10px] text-cyber-red uppercase tracking-widest">
              Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para ativar o perfil.
            </p>
          )}
        </div>
      </div>
    </motion.main>
  );
}

