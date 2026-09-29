const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const STORAGE_KEY = 'rjs_customer_session';

function readSession() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
  catch { return null; }
}

function writeSession(session) {
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEY);
}

async function parseResponse(response) {
  const type = response.headers.get('content-type') || '';
  const body = type.includes('application/json') ? await response.json() : null;
  if (!response.ok || body?.success === false) {
    const error = new Error(body?.error?.message || body?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.code = body?.error?.code;
    throw error;
  }
  return body?.data ?? body;
}

async function refreshSession() {
  const current = readSession();
  if (!current?.tokens?.refreshToken) return null;
  const response = await fetch(`${API_BASE}/api/v1/customer/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: current.tokens.refreshToken }),
  });
  const data = await parseResponse(response);
  const next = { customer: data.customer || current.customer, tokens: data.tokens };
  writeSession(next);
  return next;
}

export async function api(path, options = {}, retry = true) {
  const session = readSession();
  const headers = { ...options.headers };
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (session?.tokens?.accessToken) headers.Authorization = `Bearer ${session.tokens.accessToken}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 401 && retry && session?.tokens?.refreshToken && path !== '/api/v1/customer/auth/refresh') {
    try {
      await refreshSession();
      return api(path, options, false);
    } catch {
      writeSession(null);
      window.dispatchEvent(new Event('rjs-auth-changed'));
    }
  }
  return parseResponse(response);
}

export function apiAssetUrl(path) {
  if (!path || /^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export { readSession, writeSession };
