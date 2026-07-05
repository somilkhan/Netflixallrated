import { Router } from 'express';

const router = Router();

/**
 * GET /api/config
 * Returns public client-safe configuration values.
 * Supabase anon key and URL are designed to be public; Aceternity key is
 * passed through so the client can initialise those libraries without
 * embedding secrets in the Vite bundle.
 */
router.get('/', (_req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || null,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null,
    aceternityApiKey: process.env.ACETERNITY_API_KEY || null,
  });
});

export default router;
