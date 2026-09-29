import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, readSession, writeSession } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);
  useEffect(() => {
    const sync = () => setSession(readSession());
    window.addEventListener('storage', sync);
    window.addEventListener('rjs-auth-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('rjs-auth-changed', sync);
    };
  }, []);

  const value = useMemo(() => ({
    session,
    customer: session?.customer || null,
    signedIn: Boolean(session?.tokens?.accessToken),
    signIn(data) {
      writeSession(data);
      setSession(data);
    },
    async signOut() {
      try { await api('/api/v1/customer/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: session?.tokens?.refreshToken }) }); } catch { /* local logout still succeeds */ }
      writeSession(null);
      sessionStorage.removeItem('rjs_ride_review');
      setSession(null);
    },
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
