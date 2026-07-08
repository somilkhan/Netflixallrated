/**
 * Cache-aside wrapper for TMDB calls.
 *
 * Flow:
 *   1. Try TMDB live — on success, persist result to KV and return it.
 *   2. If TMDB throws (down, rate-limited, no key), fall back to the last
 *      cached value from KV and return that instead.
 *   3. If neither is available, rethrow the original TMDB error.
 *
 * Cache writes are fire-and-forget so they never slow down the happy path.
 */

import { prisma } from './prisma.js';

const STALE_WARN_MS = 24 * 60 * 60 * 1000; // warn in logs if cache is >24 h old

export async function withTmdbCache<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<{ data: T; fromCache: boolean }> {
  // ── Happy path: fetch live from TMDB ──────────────────────────────────────
  try {
    const data = await fetcher();

    // Write to cache in the background — never block the response
    prisma.kV
      .upsert({
        where: { key },
        create: { key, value: JSON.stringify(data) },
        update: { value: JSON.stringify(data) },
      })
      .catch(err =>
        console.warn(`[tmdb-cache] Failed to persist cache for "${key}":`, err),
      );

    return { data, fromCache: false };
  } catch (liveErr) {
    console.warn(
      `[tmdb-cache] TMDB fetch failed for "${key}", falling back to DB cache:`,
      liveErr,
    );

    // ── Fallback: serve last cached value from KV ────────────────────────────
    let cached: { value: string; updatedAt: Date } | null = null;
    try {
      cached = await prisma.kV.findUnique({ where: { key } });
    } catch (dbErr) {
      console.error(`[tmdb-cache] DB lookup also failed for "${key}":`, dbErr);
    }

    if (!cached) {
      // Nothing in cache either — surface the original TMDB error
      throw liveErr;
    }

    const ageMs = Date.now() - cached.updatedAt.getTime();
    if (ageMs > STALE_WARN_MS) {
      console.warn(
        `[tmdb-cache] Serving stale cache for "${key}" (age: ${Math.round(ageMs / 3_600_000)}h)`,
      );
    }

    return { data: JSON.parse(cached.value) as T, fromCache: true };
  }
}
