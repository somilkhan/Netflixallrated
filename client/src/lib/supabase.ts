import { createClient, SupabaseClient } from '@supabase/supabase-js';

/** Strip any path suffix that was accidentally included in the project URL. */
function normalizeUrl(url: string): string {
  return url
    .replace(/\/(rest|auth|storage|realtime)(\/.*)?$/, '')
    .replace(/\/$/, '');
}

/**
 * Create a Supabase client from config values fetched from /api/config.
 * Call this once at app startup inside AuthProvider.
 */
export function createSupabaseClient(supabaseUrl: string, supabaseAnonKey: string): SupabaseClient {
  return createClient(normalizeUrl(supabaseUrl), supabaseAnonKey);
}
