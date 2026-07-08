/**
 * Shared telemetry helpers for the TMDB catalog sync job.
 * Used by both the HTTP route (server/src/routes/titles.ts) and the
 * standalone cron script (server/src/scripts/syncBatchCron.ts) so a
 * scheduled run and a manual admin-triggered run record identical shapes.
 */
import { prisma } from './prisma.js';

export type SyncCallerType = 'cron' | 'admin';

/** Strip query strings and anything that looks like a key/token/secret from an error message before it's persisted or shown to admins. */
export function sanitizeErrorDetail(message: string): string {
  return message
    .replace(/([?&])(api_key|key|token|secret|password)=[^&\s"']*/gi, '$1$2=[redacted]')
    .replace(/https?:\/\/\S+/g, (url) => url.split('?')[0]) // drop query strings from any embedded URLs
    .slice(0, 300);
}

/**
 * Record the outcome of a sync run so /sync-status can report health.
 * Cron and admin runs are tracked under separate KV keys so a manual admin
 * sync never overwrites (or fakes) the scheduled job's own health signal.
 */
export async function recordSyncRun(via: SyncCallerType, ok: boolean, detail?: string) {
  const prefix = via === 'cron' ? 'sync:last_cron' : 'sync:last_admin';
  const entries: [string, string][] = [
    [`${prefix}_run_at`, new Date().toISOString()],
    [`${prefix}_run_ok`, String(ok)],
    [`${prefix}_run_detail`, detail ? sanitizeErrorDetail(detail) : ''],
  ];
  await Promise.all(
    entries.map(([key, value]) =>
      prisma.kV.upsert({ where: { key }, create: { key, value }, update: { value } }),
    ),
  ).catch((err) => console.warn('[sync] failed to record run status:', (err as Error).message));
}
