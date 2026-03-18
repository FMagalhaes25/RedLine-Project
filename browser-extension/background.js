'use strict';

importScripts('config.js');

const POLL_ALARM = 'redline-poll-focus';
const POLL_INTERVAL = 0.25; // ~15 seconds
const SUPABASE_URL = globalThis.REDLINE_EXTENSION_CONFIG?.supabaseUrl || '';
const SUPABASE_ANON_KEY = globalThis.REDLINE_EXTENSION_CONFIG?.supabaseAnonKey || '';

// ─── Supabase helpers ────────────────────────────────────────────────────────

async function getCredentials() {
  const stored = await chrome.storage.local.get([
    'supabaseUrl', 'anonKey', 'accessToken', 'refreshToken', 'userId',
  ]);

  return {
    ...stored,
    supabaseUrl: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  };
}

async function refreshAccessToken(supabaseUrl, anonKey, refreshToken) {
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'apikey': anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.access_token) {
      await chrome.storage.local.set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
      });
      return data.access_token;
    }
  } catch { /* network error */ }
  return null;
}

async function fetchFocusState(supabaseUrl, anonKey, accessToken, userId) {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/focus_state?user_id=eq.${encodeURIComponent(userId)}&select=is_active,mode,started_at,duration_minutes`,
      { headers: { 'apikey': anonKey, 'Authorization': `Bearer ${accessToken}` } },
    );
    if (res.status === 401) return null; // token expired, caller should refresh
    if (!res.ok) return undefined;       // other error
    const data = await res.json();
    return data[0] ?? { is_active: false, mode: 'focus' };
  } catch { return undefined; }
}

async function fetchBlockedSites(supabaseUrl, anonKey, accessToken, userId) {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/focus_blocklist?user_id=eq.${encodeURIComponent(userId)}&select=domain&order=created_at.asc`,
      { headers: { 'apikey': anonKey, 'Authorization': `Bearer ${accessToken}` } },
    );
    if (res.status === 401) return null;
    if (!res.ok) return undefined;
    const data = await res.json();
    return (data || []).map((item) => item.domain).filter(Boolean);
  } catch { return undefined; }
}

// ─── Blocking rules ──────────────────────────────────────────────────────────

async function enableBlocklist(blockedSites, startedAt, durationMinutes) {
  const { overrideSites = [] } = await chrome.storage.local.get('overrideSites');
  const sitesToBlock = (blockedSites || []).filter(s => !overrideSites.includes(s));

  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const blockedPageUrl = chrome.runtime.getURL('blocked/blocked.html');

  const addRules = sitesToBlock.map((site, i) => ({
    id: i + 1,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        url: `${blockedPageUrl}?site=${encodeURIComponent(site)}&started=${encodeURIComponent(startedAt || '')}&duration=${durationMinutes || 30}`,
      },
    },
    condition: {
      urlFilter: `||${site}`,
      resourceTypes: ['main_frame'],
    },
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map(r => r.id),
    addRules,
  });
}

async function disableBlocklist() {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  if (existing.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existing.map(r => r.id),
    });
  }
}

// ─── Main sync ───────────────────────────────────────────────────────────────

async function syncFocusState() {
  const creds = await getCredentials();
  if (!creds.supabaseUrl || !creds.anonKey || !creds.accessToken || !creds.userId) {
    return { ok: false, reason: 'missing_credentials' };
  }

  if (!creds.supabaseUrl || !creds.anonKey) {
    return { ok: false, reason: 'config_missing' };
  }

  let { supabaseUrl, anonKey, accessToken, refreshToken, userId } = creds;
  const { blockedSites: cachedBlockedSites = [] } = await chrome.storage.local.get('blockedSites');

  let state = await fetchFocusState(supabaseUrl, anonKey, accessToken, userId);
  let blockedSites = await fetchBlockedSites(supabaseUrl, anonKey, accessToken, userId);

  // 401 → try refreshing the token once
  if ((state === null || blockedSites === null) && refreshToken) {
    const newToken = await refreshAccessToken(supabaseUrl, anonKey, refreshToken);
    if (newToken) {
      accessToken = newToken;
      state = await fetchFocusState(supabaseUrl, anonKey, newToken, userId);
      blockedSites = await fetchBlockedSites(supabaseUrl, anonKey, newToken, userId);
    }
  }

  if (state === null || blockedSites === null) {
    return { ok: false, reason: 'auth_expired' };
  }

  if (!state) {
    return { ok: false, reason: 'network_error' };
  }

  if (!blockedSites) {
    blockedSites = cachedBlockedSites;
  }

  const isNowActive = state.is_active === true && state.mode === 'focus';
  const { isFocusActive: wasActive } = await chrome.storage.local.get('isFocusActive');

  await chrome.storage.local.set({
    blockedSites,
    isFocusActive: isNowActive,
    focusStartedAt: state.started_at || null,
    focusDurationMinutes: state.duration_minutes || 30,
  });

  if (isNowActive && !wasActive) {
    // Focus just started
    await chrome.storage.local.set({ overrideSites: [] }); // clear previous overrides
    await enableBlocklist(blockedSites || [], state.started_at, state.duration_minutes);
    chrome.notifications.create('redline-focus-start', {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'RedLine Focus Guard',
      message: `Modo foco ativado. ${(blockedSites || []).length} site(s) bloqueado(s).`,
    });
  } else if (!isNowActive && wasActive) {
    // Focus just ended
    await disableBlocklist();
    await chrome.storage.local.set({ overrideSites: [] });
    chrome.notifications.create('redline-focus-end', {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'RedLine Focus Guard',
      message: 'Sessão de foco concluída. Sites desbloqueados!',
    });
  } else if (isNowActive) {
    // Already active — refresh rules in case blocklist changed
    await enableBlocklist(blockedSites || [], state.started_at, state.duration_minutes);
  }

  return {
    ok: true,
    reason: 'synced',
    isFocusActive: isNowActive,
    blockedSites,
    userId,
  };
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(POLL_ALARM, { periodInMinutes: POLL_INTERVAL });
  syncFocusState();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(POLL_ALARM, { periodInMinutes: POLL_INTERVAL });
  syncFocusState();
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === POLL_ALARM) syncFocusState();
});

// ─── Message handler (from popup / blocked page) ─────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.type) {

    case 'FORCE_SYNC':
      syncFocusState().then((result) => sendResponse(result));
      return true; // async response

    case 'UPDATE_BLOCKLIST': {
      syncFocusState().then((result) => sendResponse(result));
      return true;
    }

    case 'OVERRIDE_SITE': {
      // Temporarily remove the blocking rule for one site without stopping focus
      const site = msg.site;
      chrome.storage.local.get('overrideSites').then(async ({ overrideSites = [] }) => {
        const updated = [...new Set([...overrideSites, site])];
        await chrome.storage.local.set({ overrideSites: updated });
        // Remove just the matching rule
        const existing = await chrome.declarativeNetRequest.getDynamicRules();
        const ruleToRemove = existing.find(r => r.condition.urlFilter === `||${site}`);
        if (ruleToRemove) {
          await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [ruleToRemove.id],
          });
        }
        sendResponse({ ok: true });
      });
      return true;
    }
  }
});
