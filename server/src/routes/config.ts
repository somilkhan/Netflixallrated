import { Router } from 'express';

const router = Router();

/** Strip any path suffix accidentally included in the Supabase project URL. */
function normalizeSupabaseUrl(url: string): string {
  return url
    .replace(/\/(rest|auth|storage|realtime)(\/.*)?$/, '')
    .replace(/\/$/, '');
}

/**
 * GET /api/config
 * Returns public client-safe configuration values.
 * Supabase anon key and URL are designed to be public; Aceternity key is
 * forwarded so the client can initialise those libraries without embedding
 * them in the Vite bundle at build time.
 */
router.get('/', (_req, res) => {
  const rawUrl = process.env.SUPABASE_URL || '';
  res.json({
    supabaseUrl: rawUrl ? normalizeSupabaseUrl(rawUrl) : null,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null,
    aceternityApiKey: process.env.ACETERNITY_API_KEY || null,
  });
});

export default router;
