// ─────────────────────────────────────────────────────────────────────────────
// security.js — Client-side security utilities for BrightCart
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Password hashing via Web Crypto API (SHA-256 + salt) ──────────────────
const SALT = 'brightcart_secure_salt_v1_2026';

export async function hashPassword(plaintext) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Pre-computed SHA-256 hash of 'Ky2004ei-' + SALT (for initial seed).
export const SUPER_ADMIN_HASH = 'a8f09f09d505f641026da7912329dd4f847bde674134d960b3c884b5690190ae';

// ── 2. Input sanitisation — strip HTML/script tags from any string ────────────
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

// Deep-sanitise an object's string values
export function sanitizeObject(obj) {
  const out = {};
  for (const key of Object.keys(obj)) {
    out[key] = typeof obj[key] === 'string' ? sanitize(obj[key]) : obj[key];
  }
  return out;
}

// ── 3. Brute-force / rate-limit tracker ──────────────────────────────────────
const ATTEMPT_KEY  = 'brightcart_login_attempts';
const LOCKOUT_KEY  = 'brightcart_lockout_until';
const MAX_ATTEMPTS = 5;
const BASE_LOCKOUT = 30_000; // 30 seconds, doubles each lockout

export function getLoginState() {
  try {
    const attempts  = parseInt(sessionStorage.getItem(ATTEMPT_KEY) || '0', 10);
    const lockUntil = parseInt(sessionStorage.getItem(LOCKOUT_KEY) || '0', 10);
    return { attempts, lockUntil };
  } catch {
    return { attempts: 0, lockUntil: 0 };
  }
}

export function recordFailedAttempt() {
  try {
    const { attempts, lockUntil } = getLoginState();
    const newAttempts = attempts + 1;
    sessionStorage.setItem(ATTEMPT_KEY, String(newAttempts));

    if (newAttempts >= MAX_ATTEMPTS) {
      // Exponential backoff: 30s, 60s, 120s …
      const lockouts = Math.floor(newAttempts / MAX_ATTEMPTS);
      const duration = BASE_LOCKOUT * Math.pow(2, lockouts - 1);
      const until    = Date.now() + duration;
      sessionStorage.setItem(LOCKOUT_KEY, String(until));
      return { locked: true, seconds: Math.ceil(duration / 1000) };
    }
    return { locked: false, remaining: MAX_ATTEMPTS - newAttempts };
  } catch {
    return { locked: false, remaining: MAX_ATTEMPTS };
  }
}

export function recordSuccessfulLogin() {
  try {
    sessionStorage.removeItem(ATTEMPT_KEY);
    sessionStorage.removeItem(LOCKOUT_KEY);
  } catch {}
}

export function isLockedOut() {
  try {
    const lockUntil = parseInt(sessionStorage.getItem(LOCKOUT_KEY) || '0', 10);
    if (Date.now() < lockUntil) {
      return { locked: true, secondsLeft: Math.ceil((lockUntil - Date.now()) / 1000) };
    }
    return { locked: false };
  } catch {
    return { locked: false };
  }
}

// ── 4. Session token — persisted to sessionStorage so refresh doesn't log out ──
const TOKEN_KEY      = 'brightcart_session_token';
const SESSION_DATA_KEY = 'brightcart_session_data'; // stores { user, expiresAt } as JSON

export function createSessionToken(user) {
  // Generate a random 32-byte hex token
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  const token = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');

  const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 hours
  const expiresAt = Date.now() + SESSION_TTL;
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    // Persist user + expiry so a page refresh can restore the session
    sessionStorage.setItem(SESSION_DATA_KEY, JSON.stringify({ user, expiresAt, token }));
  } catch {}
  return token;
}

export function resolveSessionToken() {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const raw = sessionStorage.getItem(SESSION_DATA_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    // Validate token matches and hasn't expired
    if (entry.token !== token) return null;
    if (Date.now() > entry.expiresAt) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(SESSION_DATA_KEY);
      return null;
    }
    // Slide the expiry window on activity (re-save with fresh expiry)
    entry.expiresAt = Date.now() + 8 * 60 * 60 * 1000;
    sessionStorage.setItem(SESSION_DATA_KEY, JSON.stringify(entry));
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
  } catch {}
}

// Touch the session on any user activity
export function touchSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_DATA_KEY);
    if (!raw) return;
    const entry = JSON.parse(raw);
    entry.expiresAt = Date.now() + 8 * 60 * 60 * 1000;
    sessionStorage.setItem(SESSION_DATA_KEY, JSON.stringify(entry));
  } catch {}
}

// ── 5. Idle session watchdog ─────────────────────────────────────────────────
let idleTimer = null;
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function startIdleWatchdog(onExpire) {
  stopIdleWatchdog();
  const reset = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      destroySessionToken();
      onExpire();
    }, IDLE_TIMEOUT);
  };
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(ev =>
    window.addEventListener(ev, reset, { passive: true })
  );
  reset(); // start the first timer
}

export function stopIdleWatchdog() {
  clearTimeout(idleTimer);
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(ev =>
    window.removeEventListener(ev, () => {})
  );
}
