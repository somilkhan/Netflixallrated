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
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [statusError, setStatusError] = useState('');

  const loadStatus = useCallback(() => {
    if (!user || user.role !== 'ADMIN') return;
    api.titles.syncStatus().then(setStatus).catch((err: any) => setStatusError(err.message));
  }, [user]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  if (!user) return (
    <div className="p-10 text-center text-ink-dim">Admin access required.</div>
  );
  if (user.role !== 'ADMIN') return (
    <div className="p-10 text-center text-ink-dim">This page is for admins only.</div>
  );

  const syncNow = async () => {
    setSyncing(true);
    setMessage('');
    try {
      const { imported, skipped, errors } = await api.titles.syncTmdb();
      setMessage(`Sync complete — ${imported} imported, ${skipped} already in catalog${errors ? `, ${errors} errors` : ''}.`);
      loadStatus();
    } catch (err: any) {
      setMessage(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto space-y-8">

      {/* Manual sync trigger */}
      <section>
        <h2 className="font-serif text-xl font-semibold mb-1">Sync Catalog</h2>
        <p className="text-ink-dim text-sm mb-4">
          Pull this week's trending titles from TMDB at full HD quality. The daily cron runs this
          automatically — use this button to trigger an immediate sync.
        </p>
        <button
          onClick={syncNow}
          disabled={syncing}
          className="px-5 py-2.5 bg-ink text-void rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
        >
          {syncing ? 'Syncing…' : 'Sync Now'}
        </button>
      </section>

      {/* Daily cron health */}
      <section>
        <h2 className="font-serif text-xl font-semibold mb-1">Auto-Sync Status</h2>
        <p className="text-ink-dim text-sm mb-4">
          A Railway cron service runs <code className="font-mono text-[11px] bg-surface-2 px-1 rounded">syncBatchCron</code> once
          a day (~60 titles/run), keeping the catalog fresh automatically.
        </p>
        {statusError && <p className="text-sm text-red-400">Couldn't load status: {statusError}</p>}
        {status && (
          <div className="rounded-lg border border-line p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${status.cron.healthy ? 'bg-green-500' : 'bg-red-400'}`} />
              <span className="font-semibold">{status.cron.healthy ? 'Healthy' : 'Needs attention'}</span>
            </div>
            {status.cron.secretConfigured && (
              <div className="text-ink-dim">
                CRON_SECRET: <span className="text-ink">configured</span>
              </div>
            )}
            <div className="text-ink-dim">
              Last run:{' '}
              {status.cron.lastRunAt
                ? <span className="text-ink">{new Date(status.cron.lastRunAt).toLocaleString()} — {status.cron.lastRunOk ? 'succeeded' : 'failed'}</span>
                : <span className="text-ink">never</span>}
            </div>
            {status.cron.lastRunDetail && (
              <div className="text-ink-dim">Detail: <span className="text-ink">{status.cron.lastRunDetail}</span></div>
            )}
            {status.cron.lastManualRunAt && (
              <div className="text-ink-dim">
                Last manual sync: <span className="text-ink">{new Date(status.cron.lastManualRunAt).toLocaleString()}</span>
              </div>
            )}
            <div className="text-ink-dim">
              Catalog: <span className="text-ink">{status.dbCount.toLocaleString()}</span> titles
              {status.totalResults > 0 && (
                <> of <span className="text-ink">{status.totalResults.toLocaleString()}</span> on TMDB (page {status.lastCompletedPage}/{status.totalPages})</>
              )}
            </div>
            <button onClick={loadStatus} className="text-white/40 text-xs font-mono hover:text-white/70 transition-colors">
              Refresh
            </button>
          </div>
        )}
      </section>

      {message && <div className="text-sm font-mono text-amber-400">{message}</div>}
    </div>
  );
}
