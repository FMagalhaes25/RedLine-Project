import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type OperatorProfile = {
  username: string | null;
  avatarUrl: string | null;
};

export function useOperatorProfile() {
  const { user } = useAuth();
  const [data, setData] = useState<OperatorProfile>({ username: null, avatarUrl: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setData({ username: null, avatarUrl: null });
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      if (!supabase) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('username, avatar_path, avatar_url')
          .eq('id', user.id)
          .single();

        if (error && (error as any).code !== 'PGRST116') throw error;

        const fallbackUsername = user.user_metadata?.full_name || user.email?.split('@')[0] || null;
        const username = profile?.username ?? fallbackUsername;
        const avatarPath = (profile as any)?.avatar_path as string | null | undefined;
        const fallbackUrl = profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null;

        let avatarUrl: string | null = fallbackUrl;
        if (avatarPath) {
          const { data: signed, error: signError } = await supabase.storage
            .from('avatars')
            .createSignedUrl(avatarPath, 60 * 60 * 24);
          if (signError) throw signError;
          avatarUrl = signed.signedUrl;
        }

        if (!cancelled) {
          setData({ username, avatarUrl });
        }
      } catch (err) {
        console.error('Erro ao carregar operador:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProfile();

    const onProfileUpdated = () => fetchProfile();
    window.addEventListener('profile_updated', onProfileUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener('profile_updated', onProfileUpdated);
    };
  }, [user?.id]);

  return { ...data, loading };
}

