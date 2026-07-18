import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

interface SyncStatus {
  dbCount: number;
  lastCompletedPage: number;
  totalPages: number;
  totalResults: number;
  cron: {
    secretConfigured: boolean;
    lastRunAt: string | null;
    lastRunOk: boolean | null;
    lastRunDetail: string | null;
    lastManualRunAt: string | null;
    healthy: boolean;
  };
}

export default function Admin() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [statusError, setStatusError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadStatus = useCallback(() => {
    if (!user || user.role !== 'ADMIN') return;
    setRefreshing(true);
    api.titles.syncStatus()
      .then(setStatus)
      .catch((err: any) => setStatusError(err.message))
      .finally(() => setRefreshing(false));
  }, [user]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  if (!user) return (
    <div className="p-10 text-center text-ink-dim">Admin access required.</div>
  );
  if (user.role !== 'ADMIN') return (
    <div className="p-10 text-center text-ink-dim">This page is for admins only.</div>
  );

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold mb-1">Catalog Sync</h1>
        <p className="text-ink-dim text-sm">
          The Railway cron runs automatically every day, pulling trending titles from TMDB at original HD quality.
          No manual action needed.
        </p>
      </div>

      {statusError && (
        <p className="text-sm text-red-400">Couldn't load status: {statusError}</p>
      )}

      {status ? (
        <div className="rounded-lg border border-line p-5 space-y-3 text-sm">
          {/* Health indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${status.cron.healthy ? 'bg-green-500' : 'bg-red-400'}`} />
              <span className="font-semibold">{status.cron.healthy ? 'Healthy' : 'Needs attention'}</span>
            </div>
            <button
              onClick={loadStatus}
              disabled={refreshing}
              className="text-white/35 text-xs font-mono hover:text-white/60 transition-colors disabled:opacity-40"
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          <div className="h-px bg-white/[0.06]" />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-2 rounded-lg px-4 py-3">
              <div className="text-ink-faint text-[11px] uppercase tracking-wider mb-1">Catalog size</div>
              <div className="text-lg font-semibold tabular-nums">{status.dbCount.toLocaleString()}</div>
              {status.totalResults > 0 && (
                <div className="text-ink-faint text-[11px] mt-0.5">
                  of {status.totalResults.toLocaleString()} on TMDB
                </div>
              )}
            </div>
            <div className="bg-surface-2 rounded-lg px-4 py-3">
              <div className="text-ink-faint text-[11px] uppercase tracking-wider mb-1">Pages synced</div>
              <div className="text-lg font-semibold tabular-nums">
                {status.lastCompletedPage}
                {status.totalPages > 0 && <span className="text-ink-faint text-sm font-normal"> / {status.totalPages}</span>}
              </div>
            </div>
          </div>

          {/* Last run */}
          <div className="space-y-1.5 text-ink-dim">
            <div>
              Last auto-run:{' '}
              {status.cron.lastRunAt
                ? <span className="text-ink">{new Date(status.cron.lastRunAt).toLocaleString()} — {status.cron.lastRunOk ? 'succeeded' : 'failed'}</span>
                : <span className="text-ink">never</span>}
            </div>
            {status.cron.lastRunDetail && (
              <div>Detail: <span className="text-ink">{status.cron.lastRunDetail}</span></div>
            )}
            {status.cron.secretConfigured && (
              <div>CRON_SECRET: <span className="text-ink">configured</span></div>
            )}
          </div>
        </div>
      ) : !statusError ? (
        <div className="text-ink-faint text-sm font-mono">Loading status…</div>
      ) : null}
    </div>
  );
}
