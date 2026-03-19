'use strict';

const SUPABASE_URL = self.REDLINE_EXTENSION_CONFIG?.supabaseUrl || '';
const SUPABASE_ANON_KEY = self.REDLINE_EXTENSION_CONFIG?.supabaseAnonKey || '';

// ─── Utilities ────────────────────────────────────────────────────────────────

function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `show ${type}`.trim();
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = ''; }, 2600);
}

// ─── Render helpers ──────────────────────────────────────────────────────────

function renderBlocklist(sites) {
  const container = document.getElementById('blocklist-container');
  document.getElementById('block-count').textContent = sites.length;

  if (sites.length === 0) {
    container.innerHTML = '<div class="empty-list">Nenhum site bloqueado</div>';
    return;
  }

  container.innerHTML = '';
  for (const site of sites) {
    const item = document.createElement('div');
    item.className = 'site-item';

    const dot = document.createElement('div');
    dot.className = 'site-bullet';

    const name = document.createElement('span');
    name.className = 'site-name';
    name.textContent = site;

    item.appendChild(dot);
    item.appendChild(name);
    container.appendChild(item);
  }
}

function updateStatusUI(isFocusActive, siteCount, userId, userEmail) {
  const dot   = document.getElementById('status-dot');
  const title = document.getElementById('status-title');
  const sub   = document.getElementById('status-sub');
  const led   = document.getElementById('focus-led');
  const hdUser = document.getElementById('header-user');

  hdUser.textContent = userEmail || (userId ? `${userId.slice(0, 8)}…` : '');

  if (isFocusActive) {
    dot.className = 'status-dot active';
    led.style.animation = 'pulse 1.5s infinite';
    title.textContent = '● MODO FOCO ATIVO';
    title.style.color = '#FF0033';
    sub.textContent = `${siteCount} site${siteCount !== 1 ? 's' : ''} bloqueado${siteCount !== 1 ? 's' : ''}`;
  } else {
    dot.className = 'status-dot';
    led.style.animation = '';
    title.style.color = '#fff';
    if (userId) {
      title.textContent = 'Foco inativo';
      sub.textContent = 'Aguardando sessão de foco...';
    } else {
      title.textContent = 'Não conectado';
      sub.textContent = 'Faça login nas configurações abaixo';
    }
  }
}

function setActiveView(view) {
  const loginView = document.getElementById('login-view');
  const mainView = document.getElementById('main-view');
  loginView.classList.remove('active');
  mainView.classList.remove('active');
  if (view === 'login') loginView.classList.add('active');
  if (view === 'main') mainView.classList.add('active');
}

async function refreshPopupFromStorage() {
  const stored = await chrome.storage.local.get([
    'blockedSites', 'isFocusActive', 'userId', 'userEmail',
  ]);

  const sites = stored.blockedSites || [];
  renderBlocklist(sites);
  updateStatusUI(stored.isFocusActive || false, sites.length, stored.userId, stored.userEmail);
}

function getSyncErrorMessage(reason) {
  switch (reason) {
    case 'config_missing':
      return 'Extensão não configurada pelo organizador (URL/KEY).';
    case 'missing_credentials':
      return 'Faça login primeiro nas configurações da extensão.';
    case 'auth_expired':
      return 'Sua sessão expirou. Faça login novamente.';
    case 'network_error':
      return 'Falha ao sincronizar com o Supabase.';
    case 'runtime_unavailable':
      return 'Conectado. A sincronização será retomada em instantes.';
    default:
      return 'Não foi possível sincronizar agora.';
  }
}

function requestSync() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'FORCE_SYNC' }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, reason: 'runtime_unavailable' });
        return;
      }
      resolve(response);
    });
  });
}

// ─── Settings / auth ─────────────────────────────────────────────────────────

async function saveAndConnect() {
  const email       = document.getElementById('auth-email').value.trim();
  const password    = document.getElementById('auth-password').value;

  if (!email || !password) {
    showToast('Preencha todos os campos', 'error');
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    showToast('Config da extensão ausente (SUPABASE_URL/ANON_KEY).', 'error');
    return;
  }

  showToast('Conectando...', '');

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(err.error_description || err.msg || 'Falha na autenticação', 'error');
      return;
    }

    const data = await res.json();
    await chrome.storage.local.set({
      supabaseUrl: SUPABASE_URL,
      anonKey: SUPABASE_ANON_KEY,
      accessToken:  data.access_token,
      refreshToken: data.refresh_token,
      userId:       data.user.id,
      userEmail:    data.user.email,
    });

    // Clear password field for security
    document.getElementById('auth-password').value = '';

    setActiveView('main');
    await refreshPopupFromStorage();

    const syncResult = await requestSync();

    if (!syncResult || !syncResult.ok) {
      showToast(getSyncErrorMessage(syncResult?.reason), syncResult?.reason === 'runtime_unavailable' ? '' : 'error');
      await refreshPopupFromStorage();
      return;
    }

    await refreshPopupFromStorage();
    showToast('Conectado e sincronizado!', 'success');
  } catch {
    showToast('Erro de conexão', 'error');
  }
}

async function logout() {
  await chrome.storage.local.remove([
    'accessToken', 'refreshToken', 'userId', 'userEmail', 'isFocusActive', 'blockedSites',
  ]);
  setActiveView('login');
  renderBlocklist([]);
  updateStatusUI(false, 0, null, null);
  showToast('Desconectado', '');
}

// ─── Init ────────────────────────────────────────────────────────────────────

async function init() {
  const stored = await chrome.storage.local.get([
    'supabaseUrl', 'anonKey', 'userId', 'userEmail', 'accessToken',
    'blockedSites', 'isFocusActive',
  ]);

  const isAuthenticated = !!(stored.userId && stored.accessToken);
  setActiveView(isAuthenticated ? 'main' : 'login');

  await refreshPopupFromStorage();

  if (stored.userEmail)   document.getElementById('auth-email').value = stored.userEmail;

  // Sync
  document.getElementById('sync-btn').addEventListener('click', async () => {
    showToast('Sincronizando...', '');
    const syncResult = await requestSync();

    if (!syncResult || !syncResult.ok) {
      await refreshPopupFromStorage();
      showToast(getSyncErrorMessage(syncResult?.reason), 'error');
      return;
    }

    await refreshPopupFromStorage();
    showToast('Sincronizado!', 'success');
  });

  document.getElementById('save-btn').addEventListener('click', saveAndConnect);
  document.getElementById('auth-password').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveAndConnect();
    }
  });
  document.getElementById('logout-btn').addEventListener('click', logout);
}

init();
