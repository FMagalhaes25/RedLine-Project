'use strict';

// Read query params (values are URL-encoded by the background service worker)
const params        = new URLSearchParams(location.search);
const rawSite       = params.get('site') || '';
const startedAt     = params.get('started') || '';
const durationMins  = parseInt(params.get('duration') || '30', 10);

// ─── Render blocked site name ────────────────────────────────────────────────
// Use textContent to avoid any XSS risk from the query param
document.getElementById('blocked-site').textContent = rawSite || 'site desconhecido';

// ─── Countdown timer ────────────────────────────────────────────────────────
const timerEl = document.getElementById('timer-display');
let intervalId = null;

function updateCountdown() {
  if (!startedAt) {
    timerEl.textContent = '--:--';
    return;
  }

  const endTime   = new Date(startedAt).getTime() + durationMins * 60 * 1000;
  const remaining = Math.max(0, endTime - Date.now());

  if (remaining === 0) {
    timerEl.textContent = '00:00';
    timerEl.classList.add('expired');
    clearInterval(intervalId);
    return;
  }

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

updateCountdown();
intervalId = setInterval(updateCountdown, 1000);

// ─── Override flow ───────────────────────────────────────────────────────────
document.getElementById('override-btn').addEventListener('click', () => {
  document.getElementById('override-btn').style.display = 'none';
  document.getElementById('confirm-panel').style.display = 'block';
});

document.getElementById('confirm-no').addEventListener('click', () => {
  document.getElementById('confirm-panel').style.display = 'none';
  document.getElementById('override-btn').style.display = '';
});

document.getElementById('confirm-yes').addEventListener('click', async () => {
  clearInterval(intervalId);

  try {
    await chrome.runtime.sendMessage({ type: 'OVERRIDE_SITE', site: rawSite });
  } catch { /* service worker may be inactive; proceed anyway */ }

  // Navigate to the site that was blocked
  // rawSite is a plain domain (e.g. "youtube.com") — safe to use as hostname
  location.href = `https://${rawSite}`;
});
