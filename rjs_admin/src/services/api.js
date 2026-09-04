import axios from 'axios';

const SESSION_KEY = 'rjsAdminSession';
const apiClient = axios.create({ baseURL: '/api/v1', headers: { 'Content-Type': 'application/json' }, timeout: 15000 });
const refreshClient = axios.create({ baseURL: '/api/v1', headers: { 'Content-Type': 'application/json' }, timeout: 15000 });
let refreshPromise;
const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; } catch { return null; } };
const normalizeError = (axiosError) => {
  const payload = axiosError.response?.data;
  const error = new Error(payload?.error?.message || (axiosError.code === 'ECONNABORTED' ? 'The server took too long to respond' : 'Unable to complete the request'));
  error.code = payload?.error?.code || axiosError.code;
  error.details = payload?.error?.details;
  error.status = axiosError.response?.status;
  return error;
};
const expireSession = () => { localStorage.removeItem(SESSION_KEY); window.dispatchEvent(new Event('rjs:session-expired')); };

apiClient.interceptors.request.use((config) => {
  const token = readSession()?.tokens?.accessToken;
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data.data,
  async (axiosError) => {
    const original = axiosError.config;
    const isPublicAuth = ['/admin/auth/login', '/admin/auth/mfa/', '/admin/auth/refresh'].some((path) => original?.url?.includes(path));
    const session = readSession();
    if (axiosError.response?.status === 401 && !original?._retry && !isPublicAuth && session?.tokens?.refreshToken) {
      original._retry = true;
      try {
        refreshPromise ||= refreshClient.post('/admin/auth/refresh', { refreshToken: session.tokens.refreshToken })
          .then((response) => response.data.data.tokens)
          .finally(() => { refreshPromise = null; });
        const tokens = await refreshPromise;
        const next = { ...session, tokens };
        localStorage.setItem(SESSION_KEY, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('rjs:session-updated', { detail: next }));
        original.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return apiClient(original);
      } catch (refreshError) {
        expireSession();
        return Promise.reject(normalizeError(refreshError));
      }
    }
    return Promise.reject(normalizeError(axiosError));
  },
);

const authorization = (accessToken) => (
  accessToken
    ? { headers: { Authorization: `Bearer ${accessToken}` } }
    : undefined
);

const get = (path, accessToken) => apiClient.get(path, authorization(accessToken));
const post = (path, body, accessToken) => apiClient.post(path, body, authorization(accessToken));
const put = (path, body, accessToken) => apiClient.put(path, body, authorization(accessToken));
const patch = (path, body, accessToken) => apiClient.patch(path, body, authorization(accessToken));
const remove = (path, accessToken) => apiClient.delete(path, authorization(accessToken));
const upload = (path, formData) => apiClient.post(path, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export { apiClient, get, patch, post, put, remove, upload };
