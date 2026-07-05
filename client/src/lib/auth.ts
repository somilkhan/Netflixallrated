import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User { id: string; email: string; displayName: string; avatarUrl?: string; }
interface AuthCtx { user: User | null; token: string | null; login: (token: string, user: User) => void; logout: () => void; isLoading: boolean; }

const AuthContext = createContext<AuthCtx>({ user: null, token: null, login: () => {}, logout: () => {}, isLoading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t) {
      setToken(t);
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } })
        .then(r => r.ok ? r.json() : null)
        .then(d => d?.user && setUser(d.user))
        .finally(() => setIsLoading(false));
    } else setIsLoading(false);
  }, []);

  const login = (t: string, u: User) => { localStorage.setItem('token', t); setToken(t); setUser(u); };
  const logout = () => { localStorage.removeItem('token'); setToken(null); setUser(null); };

  return <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
