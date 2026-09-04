import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { post } from '../services/api.js';

const AuthContext = createContext(null);
const readJson = (storage, key) => {
  try { return JSON.parse(storage.getItem(key)) || null; } catch { return null; }
};

const SESSION_KEY = 'rjsAdminSession';

function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const persisted = readJson(localStorage, SESSION_KEY);
    const previousTabSession = readJson(sessionStorage, SESSION_KEY);
    if (!persisted && previousTabSession) localStorage.setItem(SESSION_KEY, JSON.stringify(previousTabSession));
    sessionStorage.removeItem(SESSION_KEY);
    return persisted || previousTabSession;
  });
  const [challenge, setChallengeState] = useState(() => readJson(sessionStorage, 'rjsAdminChallenge'));
  const [setupResult, setSetupResultState] = useState(() => readJson(sessionStorage, 'rjsAdminSetupResult'));
  useEffect(() => {
    const updated = (event) => setSession(event.detail);
    const expired = () => setSession(null);
    const storageChanged = (event) => {
      if (event.key !== SESSION_KEY) return;
      try { setSession(event.newValue ? JSON.parse(event.newValue) : null); }
      catch { setSession(null); }
    };
    window.addEventListener('rjs:session-updated', updated);
    window.addEventListener('rjs:session-expired', expired);
    window.addEventListener('storage', storageChanged);
    return () => { window.removeEventListener('rjs:session-updated', updated); window.removeEventListener('rjs:session-expired', expired); window.removeEventListener('storage', storageChanged); };
  }, []);

  function setChallenge(value) {
    setChallengeState(value);
    value ? sessionStorage.setItem('rjsAdminChallenge', JSON.stringify(value)) : sessionStorage.removeItem('rjsAdminChallenge');
  }
  function setSetupResult(value) {
    setSetupResultState(value);
    value ? sessionStorage.setItem('rjsAdminSetupResult', JSON.stringify(value)) : sessionStorage.removeItem('rjsAdminSetupResult');
  }
  function completeLogin(result) {
    const next = { admin: result.admin, tokens: result.tokens };
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    sessionStorage.removeItem('rjsAdminChallenge');
    sessionStorage.removeItem('rjsAdminSetupResult');
    setSession(next); setChallengeState(null); setSetupResultState(null);
  }
  function clearTransientAuth() { setChallenge(null); setSetupResult(null); }
  function clearSession() { localStorage.removeItem(SESSION_KEY); setSession(null); clearTransientAuth(); }
  function updateAdmin(admin) {
    const next = { ...session, admin };
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setSession(next);
  }
  async function logout() {
    try { if (session?.tokens?.refreshToken) await post('/admin/auth/logout', { refreshToken: session.tokens.refreshToken }); }
    finally { clearSession(); }
  }
  async function logoutAll() { try { await post('/admin/auth/logout-all', {}, session?.tokens?.accessToken); } finally { clearSession(); } }

  const value = useMemo(() => ({ admin: session?.admin || null, session, challenge, setupResult, setChallenge, setSetupResult, completeLogin, updateAdmin, clearTransientAuth, logout, logoutAll }), [session, challenge, setupResult]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const useAuth = () => useContext(AuthContext);
export { AuthProvider, useAuth };
