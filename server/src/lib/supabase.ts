import { createClient, SupabaseClient } from '@supabase/supabase-js';

/** Strip any path suffix that was accidentally included in the project URL. */
function normalizeUrl(url: string): string {
  return url
    .replace(/\/(rest|auth|storage|realtime)(\/.*)?$/, '')
    .replace(/\/$/, '');
}

let _client: SupabaseClient | null = null;

/**
 * Returns a Supabase client initialised from environment variables.
 * Used server-side only for token verification (auth.getUser).
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;
  const url = normalizeUrl(process.env.SUPABASE_URL || '');
  const key = process.env.SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}
