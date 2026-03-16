import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type JiraIssue = {
  id: string;
  key: string;
  fields: Record<string, unknown>;
};

const jiraBaseUrl = Deno.env.get('JIRA_BASE_URL')?.replace(/\/$/, '');
const jiraApiEmail = Deno.env.get('JIRA_API_EMAIL');
const jiraApiToken = Deno.env.get('JIRA_API_TOKEN');
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });
}

function ensureConfigured() {
  return jiraBaseUrl && jiraApiEmail && jiraApiToken && supabaseUrl && supabaseAnonKey;
}

function authHeader() {
  const encoded = btoa(`${jiraApiEmail}:${jiraApiToken}`);
  return `Basic ${encoded}`;
}

function toText(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function mapIssue(issue: JiraIssue) {
  const fields = issue.fields ?? {};
  const status = fields.status as { name?: string; statusCategory?: { name?: string } } | undefined;
  const priority = fields.priority as { name?: string } | undefined;
  const project = fields.project as { key?: string; name?: string } | undefined;

  return {
    id: issue.id,
    key: issue.key,
    summary: toText(fields.summary) ?? issue.key,
    status: status?.name ?? 'Sem status',
    statusCategory: status?.statusCategory?.name ?? null,
    priority: priority?.name ?? null,
    projectKey: project?.key ?? null,
    projectName: project?.name ?? null,
    dueDate: toText(fields.duedate),
    updated: toText(fields.updated) ?? new Date().toISOString(),
    created: toText(fields.created) ?? new Date().toISOString(),
    url: `${jiraBaseUrl}/browse/${issue.key}`,
  };
}

async function jiraFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${jiraBaseUrl}${path}`, {
    ...init,
    headers: {
      'Authorization': authHeader(),
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Jira respondeu ${response.status}: ${text}`);
  }

  return response.json();
}

async function resolveJiraAccountId(email: string) {
  const payload = await jiraFetch(`/rest/api/3/user/search?query=${encodeURIComponent(email)}`) as Array<Record<string, unknown>>;

  const exact = payload.find((user) => {
    const candidateEmail = toText(user.emailAddress);
    return candidateEmail?.toLowerCase() === email.toLowerCase();
  });

  const first = exact ?? payload[0];
  const accountId = toText(first?.accountId);

  if (!accountId) {
    throw new Error('Não foi possível mapear o usuário autenticado para uma conta Jira. Verifique se o email do RedLine existe no Jira ou forneça um mapeamento explícito.');
  }

  return accountId;
}

async function searchIssues(jql: string, maxResults: number) {
  const payload = await jiraFetch('/rest/api/3/search', {
    method: 'POST',
    body: JSON.stringify({
      jql,
      maxResults,
      fields: ['summary', 'status', 'priority', 'project', 'duedate', 'updated', 'created'],
    }),
  }) as { issues?: JiraIssue[]; total?: number };

  return {
    issues: (payload.issues ?? []).map(mapIssue),
    total: payload.total ?? 0,
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!ensureConfigured()) {
    return json({
      message: 'Função Jira não configurada. Defina JIRA_BASE_URL, JIRA_API_EMAIL e JIRA_API_TOKEN nas secrets da Edge Function.',
    }, { status: 503 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') ?? '',
        },
      },
    });

    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return json({ message: 'Usuário não autenticado para consultar o Jira.' }, { status: 401 });
    }

    const email = userData.user.email;

    if (!email) {
      return json({ message: 'Conta autenticada sem email válido para mapear usuário no Jira.' }, { status: 400 });
    }

    const jiraAccountId = await resolveJiraAccountId(email);
    const assigneeJql = `assignee = "${jiraAccountId}"`;
    const unresolvedClause = 'resolution = Unresolved';

    const [today, sprint, overdue, assigned] = await Promise.all([
      searchIssues(`${assigneeJql} AND ${unresolvedClause} AND (due <= endOfDay() OR updated >= startOfDay()) ORDER BY priority DESC, duedate ASC, updated DESC`, 8),
      searchIssues(`${assigneeJql} AND ${unresolvedClause} AND sprint in openSprints() ORDER BY updated DESC`, 8),
      searchIssues(`${assigneeJql} AND ${unresolvedClause} AND duedate < startOfDay() ORDER BY duedate ASC, priority DESC`, 8),
      searchIssues(`${assigneeJql} AND ${unresolvedClause} ORDER BY priority DESC, updated DESC`, 16),
    ]);

    return json({
      fetchedAt: new Date().toISOString(),
      connection: {
        mode: 'service-account',
        mappedEmail: email,
        jiraAccountId,
      },
      counts: {
        assigned: assigned.total,
        sprint: sprint.total,
        today: today.total,
        overdue: overdue.total,
      },
      sections: {
        today: today.issues,
        sprint: sprint.issues,
        overdue: overdue.issues,
        assigned: assigned.issues,
      },
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao consultar Jira.';
    return json({ message }, { status: 500 });
  }
});