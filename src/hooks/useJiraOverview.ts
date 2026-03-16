import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  status: string;
  statusCategory: string | null;
  priority: string | null;
  projectKey: string | null;
  projectName: string | null;
  dueDate: string | null;
  updated: string;
  created: string;
  url: string;
}

export interface JiraOverview {
  fetchedAt: string;
  connection: {
    mode: 'service-account';
    mappedEmail: string;
    jiraAccountId: string;
  };
  counts: {
    assigned: number;
    sprint: number;
    today: number;
    overdue: number;
  };
  sections: {
    today: JiraIssue[];
    sprint: JiraIssue[];
    overdue: JiraIssue[];
    assigned: JiraIssue[];
  };
}

function extractFunctionErrorMessage(payload: unknown) {
  if (typeof payload === 'string') return payload;
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const candidate = (payload as { message?: unknown }).message;
    if (typeof candidate === 'string') return candidate;
  }
  return 'Falha ao carregar operações do Jira.';
}

export function useJiraOverview() {
  const { user } = useAuth();
  const [data, setData] = useState<JiraOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async (isManualRefresh = false) => {
    if (!supabase) {
      setError('Supabase não configurado. O painel Jira depende das Edge Functions do projeto.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data: response, error: invokeError } = await supabase.functions.invoke<JiraOverview>('jira-dashboard', {
        body: {},
      });

      if (invokeError) throw invokeError;

      setData(response ?? null);
      setError(null);
    } catch (err: unknown) {
      console.error('Erro ao carregar Jira:', err);
      const message = err instanceof Error ? err.message : extractFunctionErrorMessage(err);
      setError(message || 'Falha ao carregar operações do Jira.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [user?.id]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh: () => fetchOverview(true),
  };
}