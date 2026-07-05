import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient } from './supabase';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role?: string;
}

interface AuthCtx {
  user: User | null;
  token: string | null;
  supabase: SupabaseClient | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthCtx>({
  user: null, token: null, supabase: null,
  signIn: async () => {}, signUp: async () => {}, signOut: async () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    fetch('/api/config')
      .then(r => r.json())
      .then(({ supabaseUrl, supabaseAnonKey }) => {
        if (!supabaseUrl || !supabaseAnonKey) { setIsLoading(false); return; }

        const sb = createSupabaseClient(supabaseUrl, supabaseAnonKey);
        setSupabase(sb);

        // onAuthStateChange fires immediately with INITIAL_SESSION (or SIGNED_OUT),
        // so this single listener handles both startup hydration and subsequent changes.
        const { data: { subscription } } = sb.auth.onAuthStateChange(
          async (_event, session) => {
            if (session) {
              localStorage.setItem('token', session.access_token);
              setToken(session.access_token);

              // Fetch the Neon user (includes role and displayName)
              try {
                const res = await fetch('/api/auth/me', {
                  headers: { Authorization: `Bearer ${session.access_token}` },
                });
                if (res.ok) {
                  const { user: neonUser } = await res.json();
                  setUser(neonUser);
                } else {
                  setUser({
                    id: session.user.id,
                    email: session.user.email!,
                    displayName:
                      (session.user.user_metadata?.display_name as string | undefined) ||
                      session.user.email!.split('@')[0],
                  });
                }
              } catch {
                setUser({
                  id: session.user.id,
                  email: session.user.email!,
                  displayName: session.user.email!.split('@')[0],
                });
              }
            } else {
              localStorage.removeItem('token');
              setToken(null);
              setUser(null);
            }
            setIsLoading(false);
          }
        );

        unsubscribe = () => subscription.unsubscribe();
      })
      .catch(() => setIsLoading(false));

    return () => unsubscribe?.();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Auth not initialized');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    if (!supabase) throw new Error('Auth not initialized');
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: displayName || email.split('@')[0] } },
    });
    if (error) throw new Error(error.message);
  };

  const signOut = async () => { await supabase?.auth.signOut(); };

  return (
    <AuthContext.Provider value={{ user, token, supabase, signIn, signUp, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
