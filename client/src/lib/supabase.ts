import { createClient, SupabaseClient } from '@supabase/supabase-js';

/** Strip any path suffix that was accidentally included in the project URL. */
function normalizeUrl(url: string): string {
  return url
    .replace(/\/(rest|auth|storage|realtime)(\/.*)?$/, '')
    .replace(/\/$/, '');
}

// Module-level singleton — prevents multiple GoTrueClient instances even
// in React StrictMode (which double-fires effects in development).
let _client: SupabaseClient | null = null;
let _key = '';

/**
 * Create (or return the existing) Supabase client.
 * Call this inside AuthProvider once config is loaded from /api/config.
 */
export function createSupabaseClient(supabaseUrl: string, supabaseAnonKey: string): SupabaseClient {
  const url = normalizeUrl(supabaseUrl);
  const cacheKey = `${url}|${supabaseAnonKey}`;
  if (!_client || _key !== cacheKey) {
    _client = createClient(url, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    _key = cacheKey;
  }
  return _client;
}

/** Return the configured singleton for API calls that need the current session. */
export function getSupabaseClient(): SupabaseClient | null {
  return _client;
}
