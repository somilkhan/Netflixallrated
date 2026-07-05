import { createClient, SupabaseClient } from '@supabase/supabase-js';

let instance: SupabaseClient | null = null;
let initPromise: Promise<SupabaseClient | null> | null = null;

/**
 * Returns a Supabase client initialised with server-provided config.
 * Returns null if SUPABASE_URL / SUPABASE_ANON_KEY are not set on the server.
 * Safe to call multiple times — the client is a singleton.
 */
export async function getSupabase(): Promise<SupabaseClient | null> {
  if (instance) return instance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) return null;
      const { supabaseUrl, supabaseAnonKey } = await res.json();
      if (supabaseUrl && supabaseAnonKey) {
        instance = createClient(supabaseUrl, supabaseAnonKey);
        return instance;
      }
    } catch {
      // Supabase not configured — app works without it
    }
    return null;
  })();

  return initPromise;
}
