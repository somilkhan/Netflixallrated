/**
 * TMDb → DB catalog sync engine.
 *
 * Design goals:
 * - Paginated: loops through /discover/movie until total_pages is reached
 * - Rate-limit safe: 250 ms delay between page requests (TMDb allows ~40 req/10s)
 * - Resumable: stores last completed page in the KV table so a crashed/timed-out
 *   run picks up where it left off
 * - Vercel-friendly: accepts maxPages so callers can bound each invocation to fit
 *   within Vercel's 30–60 s function timeout (process ~3 pages / call)
 * - Idempotent: uses upsert(tmdbId) so re-running never creates duplicates and
 *   silently-dropped rows are a thing of the past
 * - Observable: logs inserted/skipped/failed counts after every page
 */

import { prisma } from './prisma.js';
import { discoverMoviesPage, getMovieGenreMap } from './tmdb.js';

const KV_LAST_PAGE = 'sync:last_completed_page';
const KV_TOTAL_PAGES = 'sync:total_pages';

const POSTER_PALETTE = [
  { from: '#1a1510', to: '#0a0908' },
  { from: '#1c1410', to: '#0a0807' },
  { from: '#1a1018', to: '#0a0708' },
  { from: '#101018', to: '#07070a' },
  { from: '#181020', to: '#0a080c' },
  { from: '#101820', to: '#080a0c' },
  { from: '#201008', to: '#0c0604' },
];
const randomPalette = () => POSTER_PALETTE[Math.floor(Math.random() * POSTER_PALETTE.length)];

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── KV helpers ──────────────────────────────────────────────────────────────

async function kvGet(key: string): Promise<string | null> {
  try {
    const row = await prisma.kV.findUnique({ where: { key } });
    return row?.value ?? null;
  } catch {
    return null; // table may not exist yet on fresh DB before migration
  }
}

async function kvSet(key: string, value: string): Promise<void> {
  try {
    await prisma.kV.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  } catch (err) {
    console.warn('[sync] KV write failed (non-fatal):', (err as Error).message);
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface SyncOptions {
  /**
   * First page number to fetch (1-based, inclusive).
   * When omitted the engine resumes from the KV-stored last completed page + 1.
   */
  startPage?: number;
  /**
   * Maximum pages to process in this invocation.
   * For Vercel (60 s timeout): keep ≤ 3.
   * For long-running local runs: set to Infinity or omit to run to completion.
   */
  maxPages?: number;
  /**
   * Hard ceiling on total pages fetched across all runs.
   * TMDb caps discover results at 500 pages (10 000 movies).
   * Default: 500.
   */
  pageCeiling?: number;
  /** Extra /discover/movie params forwarded to TMDb (e.g. with_original_language). */
  discoverParams?: Record<string, string>;
}

export interface SyncResult {
  pagesProcessed: number;
  totalInserted: number;
  totalSkipped: number;
  totalFailed: number;
  /** Last successfully completed page number. */
  lastPage: number;
  /** TMDb-reported total pages (capped at pageCeiling). */
  totalPages: number;
  /** TMDb-reported total result count for the query. */
  totalResults: number;
  /** True when lastPage === totalPages — sync is fully complete. */
  done: boolean;
}

/**
 * Sync one or more pages of TMDb discover/movie into the local DB.
 *
 * Safe to call repeatedly; each call resumes from the stored last page unless
 * `startPage` overrides it. Call with `maxPages: Infinity` for a full local
 * run, or `maxPages: 3` per Vercel invocation.
 */
export async function syncTmdbCatalog(opts: SyncOptions = {}): Promise<SyncResult> {
  const {
    startPage,
    maxPages = Infinity,
    pageCeiling = 500,
    discoverParams = {},
  } = opts;

  // Resolve starting page.
  // startPage is the first page TO FETCH (1-based).
  // When not provided, resume from KV: stored value is last completed page, so add 1.
  let currentPage: number;
  if (startPage !== undefined) {
    currentPage = Math.max(1, startPage);
  } else {
    const lastCompleted = parseInt((await kvGet(KV_LAST_PAGE)) ?? '0', 10);
    currentPage = lastCompleted + 1;
  }

  // Fetch genre map once (cached in module memory after first call)
  const genreMap = await getMovieGenreMap();

  let totalPages = parseInt((await kvGet(KV_TOTAL_PAGES)) ?? '0', 10) || 0;
  let totalResults = 0;
  let pagesProcessed = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  console.log(`[sync] Starting from page ${currentPage} (maxPages=${maxPages === Infinity ? '∞' : maxPages}, ceiling=${pageCeiling})`);

  while (pagesProcessed < maxPages) {
    // Rate-limit guard: wait before each request (except the very first)
    if (pagesProcessed > 0) await sleep(250);

    let pageData: Awaited<ReturnType<typeof discoverMoviesPage>>;
    try {
      pageData = await discoverMoviesPage(currentPage, discoverParams);
    } catch (err) {
      console.error(`[sync] Page ${currentPage} fetch failed — aborting batch:`, (err as Error).message);
      break;
    }

    totalResults = pageData.totalResults;
    totalPages = Math.min(pageData.totalPages, pageCeiling);

    if (pageData.results.length === 0) {
      console.log(`[sync] Page ${currentPage} returned 0 results — stopping.`);
      break;
    }

    // Process every item on this page
    let pageInserted = 0, pageSkipped = 0, pageFailed = 0;

    for (const item of pageData.results) {
      if (!item.id || !item.poster_path) { pageFailed++; continue; }

      const genres = (item.genre_ids || [])
        .map((id: number) => genreMap.get(id))
        .filter(Boolean) as string[];

      const year = item.release_date
        ? Number(item.release_date.slice(0, 4))
        : new Date().getFullYear();

      const palette = randomPalette();

      try {
        // Check existence first so we can count inserts vs updates accurately.
        // Sequential per-item: safe because sync runs serially (no concurrency).
        const existing = await prisma.title.findUnique({
          where: { tmdbId: item.id },
          select: { id: true },
        });

        const catalogData = {
          name: item.title || item.name || 'Unknown',
          year,
          genres,
          synopsis: item.overview || '',
          posterUrl: item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : undefined,
          backdropUrl: item.backdrop_path
            ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
            : undefined,
        };

        await prisma.title.upsert({
          where: { tmdbId: item.id },
          create: {
            ...catalogData,
            type: 'MOVIE',
            posterColorFrom: palette.from,
            posterColorTo: palette.to,
            tmdbId: item.id,
            officialWatchLinks: [],
          },
          update: catalogData, // ratings/watchlist unaffected
        });

        if (existing) {
          pageSkipped++; // updated existing row
        } else {
          pageInserted++; // net-new insert
        }
      } catch (err) {
        pageFailed++;
        console.error(
          `[sync] Upsert failed for tmdbId=${item.id} "${item.title}":`,
          (err as Error).message,
        );
      }
    }

    totalInserted += pageInserted;
    totalSkipped += pageSkipped;
    totalFailed += pageFailed;
    pagesProcessed++;

    console.log(
      `[sync] Page ${currentPage}/${totalPages} — inserted: ${pageInserted}, updated: ${pageSkipped}, failed: ${pageFailed} | running totals: ${totalInserted}/${totalSkipped}/${totalFailed}`,
    );

    // Persist progress so a future run resumes here
    await kvSet(KV_LAST_PAGE, String(currentPage));
    await kvSet(KV_TOTAL_PAGES, String(totalPages));
    await kvSet('sync:total_results', String(totalResults));

    if (currentPage >= totalPages) {
      console.log('[sync] Reached last page — catalog sync complete.');
      break;
    }

    currentPage++;
  }

  const done = currentPage >= totalPages && totalPages > 0;
  if (done) {
    // Reset stored page so the next trigger starts fresh (re-sync / refresh)
    await kvSet(KV_LAST_PAGE, '0');
  }

  return {
    pagesProcessed,
    totalInserted,
    totalSkipped,
    totalFailed,
    lastPage: currentPage - (pagesProcessed > 0 ? 0 : 1),
    totalPages,
    totalResults,
    done,
  };
}

/** Reset stored sync progress so the next run starts from page 1. */
export async function resetSyncProgress(): Promise<void> {
  await kvSet(KV_LAST_PAGE, '0');
  console.log('[sync] Progress reset — next run will start from page 1.');
}
