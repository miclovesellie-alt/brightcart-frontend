const TOKEN_KEY = 'brightcart_session_token';
const SESSION_DATA_KEY = 'brightcart_session_data';
const ATTEMPT_KEY = 'brightcart_login_attempts';
const LOCKOUT_KEY = 'brightcart_lockout_until';

export function saveSession(token, user, expiresAt) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(SESSION_DATA_KEY, JSON.stringify({ token, user, expiresAt }));
  } catch {
    // Private browsing or storage policy may disable sessionStorage.
  }
}

export function getSessionToken() {
  try { return sessionStorage.getItem(TOKEN_KEY); }
  catch { return null; }
}

export function resolveSessionToken() {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const raw = sessionStorage.getItem(SESSION_DATA_KEY);
    if (!token || !raw) return null;
    const entry = JSON.parse(raw);
    if (entry.token !== token || !entry.user || Date.now() >= Number(entry.expiresAt)) {
      destroySessionToken();
      return null;
    }
    return entry.user;
  } catch {
    return null;
  }
}

export function destroySessionToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SESSION_DATA_KEY);
    sessionStorage.removeItem(ATTEMPT_KEY);
    sessionStorage.removeItem(LOCKOUT_KEY);
  } catch {
    // Storage may be unavailable.
  }
}

export function sanitize(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

export function sanitizeObject(obj) {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, sanitize(value)]));
}

let idleTimer = null;
let idleResetHandler = null;
const IDLE_TIMEOUT = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

export function startIdleWatchdog(onExpire) {
  stopIdleWatchdog();
  idleResetHandler = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      destroySessionToken();
      onExpire();
    }, IDLE_TIMEOUT);
  };
  ACTIVITY_EVENTS.forEach(eventName => window.addEventListener(eventName, idleResetHandler, { passive: true }));
  idleResetHandler();
}

export function stopIdleWatchdog() {
  clearTimeout(idleTimer);
  if (idleResetHandler) {
    ACTIVITY_EVENTS.forEach(eventName => window.removeEventListener(eventName, idleResetHandler));
  }
  idleResetHandler = null;
}
