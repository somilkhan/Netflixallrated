/**
 * Standalone entry point for Railway's scheduled-service cron.
 *
 * Railway runs this as a one-off process on a schedule (set via the
 * service's "Cron Schedule" setting, e.g. "0 2 * * *") — no HTTP call or
 * CRON_SECRET involved, since Railway invokes the container directly.
 *
 * Processes one batch (~3 pages / 60 titles) per run, same as the old
 * POST /api/titles/sync-batch route, and records the outcome under the
 * same 'cron' telemetry key so the Admin "Daily Catalog Cron" panel works
 * unchanged.
 */
import { syncTmdbCatalog } from '../lib/sync.js';
import { recordSyncRun } from '../lib/syncStatus.js';
import { prisma } from '../lib/prisma.js';

async function main() {
  if (!process.env.TMDB_API_KEY) {
    console.error('[sync-cron] TMDB_API_KEY is not set — cannot run.');
    await recordSyncRun('cron', false, 'TMDB_API_KEY not configured');
    process.exitCode = 1;
    return;
  }

  try {
    const result = await syncTmdbCatalog({ maxPages: 3 });
    await recordSyncRun('cron', true);
    console.log(
      `[sync-cron] Done — inserted: ${result.totalInserted}, updated: ${result.totalSkipped}, failed: ${result.totalFailed}.`,
    );
  } catch (err) {
    const message = (err as Error).message;
    console.error('[sync-cron] Failed:', message);
    await recordSyncRun('cron', false, message);
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error('[sync-cron] Unhandled error:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
