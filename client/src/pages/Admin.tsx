import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { TmdbSearchResult } from '../types';

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
  const nav = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [statusError, setStatusError] = useState('');

  const loadStatus = useCallback(() => {
    if (!user || user.role !== 'ADMIN') return;
    api.titles.syncStatus().then(setStatus).catch((err: any) => setStatusError(err.message));
  }, [user]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  if (!user) return (
    <div className="p-10 text-center text-ink-dim">
      Admin access required.{' '}
      <button onClick={() => nav('/login')} className="text-maroon-bright">Sign in</button>
    </div>
  );
  if (user.role !== 'ADMIN') return (
    <div className="p-10 text-center text-ink-dim">This page is for admins only.</div>
  );

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setMessage('');
    try {
      const data = await api.titles.tmdbSearch(query.trim());
      setResults(data);
    } catch {
      setMessage('Search failed.');
    } finally {
      setSearching(false);
    }
  };

  const runBackfill = async () => {
    setBackfilling(true);
    setMessage('');
    try {
      const data = await api.titles.backfillImages();
      setMessage(`Backfill done — ${data.updated} updated, ${data.failed} failed out of ${data.total} titles.${data.errors?.length ? ' Errors: ' + data.errors.join('; ') : ''}`);
    } catch (err: any) {
      setMessage(`Backfill failed: ${err.message}`);
    } finally {
      setBackfilling(false);
    }
  };

  const syncTrending = async () => {
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

  const importTitle = async (r: TmdbSearchResult) => {
    setImportingId(r.tmdbId);
    setMessage('');
    try {
      const type = r.mediaType === 'movie' ? 'MOVIE' : 'SERIES';
      await api.titles.importTmdb({ tmdbId: r.tmdbId, mediaType: r.mediaType, type });
      setMessage(`Imported "${r.name}".`);
      setResults(rs => rs.filter(x => x.tmdbId !== r.tmdbId));
    } catch (err: any) {
      setMessage(
        err.message === 'Already imported'
          ? `"${r.name}" is already in the catalog.`
          : `Failed to import "${r.name}".`
      );
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto space-y-8">
      {/* Backfill poster images */}
      <section>
        <h2 className="font-serif text-xl font-semibold mb-1">Backfill Poster Images</h2>
        <p className="text-ink-dim text-sm mb-4">
          Fetch real poster art, backdrops, and trailers from TMDB for every title that's missing them.
          Requires <code className="font-mono text-[11px] bg-surface-2 px-1 rounded">TMDB_API_KEY</code> to be set in Replit Secrets.
        </p>
        <button
          onClick={runBackfill}
          disabled={backfilling}
          className="px-5 py-2.5 bg-maroon-bright text-white rounded-lg font-semibold hover:bg-maroon transition-colors disabled:opacity-50 text-sm"
        >
          {backfilling ? 'Backfilling… (this may take a minute)' : 'Backfill All Missing Images'}
        </button>
      </section>

      {/* Sync trending */}
      <section>
        <h2 className="font-serif text-xl font-semibold mb-1">Sync Trending</h2>
        <p className="text-ink-dim text-sm mb-4">
          Pull this week's top 50 trending titles from TMDB. Already-imported titles are skipped.
        </p>
        <button
          onClick={syncTrending}
          disabled={syncing}
          className="px-5 py-2.5 bg-maroon-bright text-white rounded-lg font-semibold hover:bg-maroon transition-colors disabled:opacity-50 text-sm"
        >
          {syncing ? 'Syncing…' : 'Sync from TMDB'}
        </button>
      </section>

      {/* Daily catalog cron health */}
      <section>
        <h2 className="font-serif text-xl font-semibold mb-1">Daily Catalog Cron</h2>
        <p className="text-ink-dim text-sm mb-4">
          The Vercel cron calls <code className="font-mono text-[11px] bg-surface-2 px-1 rounded">/api/titles/sync-batch</code> once
          a day (~60 movies/run) using <code className="font-mono text-[11px] bg-surface-2 px-1 rounded">CRON_SECRET</code>.
          This checks whether it's actually configured and running.
        </p>
        {statusError && <p className="text-sm text-maroon-bright">Couldn't load status: {statusError}</p>}
        {status && (
          <div className="rounded-lg border border-line p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  status.cron.healthy ? 'bg-green-500' : 'bg-maroon-bright'
                }`}
              />
              <span className="font-semibold">{status.cron.healthy ? 'Healthy' : 'Needs attention'}</span>
            </div>
            <div className="text-ink-dim">
              CRON_SECRET configured: <span className="text-ink">{status.cron.secretConfigured ? 'Yes' : 'No — set it in Vercel env vars'}</span>
            </div>
            <div className="text-ink-dim">
              Last cron run: {status.cron.lastRunAt
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
              Catalog: <span className="text-ink">{status.dbCount.toLocaleString()}</span> titles synced
              {status.totalResults > 0 && <> of <span className="text-ink">{status.totalResults.toLocaleString()}</span> on TMDB (page {status.lastCompletedPage}/{status.totalPages})</>}
            </div>
            <button onClick={loadStatus} className="text-maroon-bright text-xs font-mono hover:underline">Refresh</button>
          </div>
        )}
      </section>

      {/* Search & import */}
      <section>
        <h2 className="font-serif text-xl font-semibold mb-1">Add Title</h2>
        <p className="text-ink-dim text-sm mb-4">
          Search TMDB and import a title — poster, synopsis, genres, runtime and trailer are pulled in automatically.
        </p>

        <form onSubmit={runSearch} className="flex gap-2 mb-6">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search a movie or series..."
            className="flex-1 bg-surface border border-line rounded-lg px-4 py-3 text-sm focus:border-maroon outline-none"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-5 py-3 bg-maroon-bright text-white rounded-lg font-semibold hover:bg-maroon transition-colors disabled:opacity-50"
          >
            {searching ? 'Searching…' : 'Search'}
          </button>
        </form>
      </section>

      {message && <div className="text-sm font-mono text-amber">{message}</div>}

      <div className="space-y-3">
        {results.map(r => (
          <div key={r.tmdbId} className="flex gap-3 bg-surface border border-line rounded-lg p-3 items-center">
            <div
              className="w-12 h-[72px] rounded-md shrink-0 bg-surface-2 border border-line bg-cover bg-center"
              style={r.posterUrl ? { backgroundImage: `url(${r.posterUrl})` } : undefined}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-semibold truncate">{r.name}</div>
              <div className="font-mono text-[10.5px] text-ink-faint">
                {r.year || '—'} · {r.mediaType === 'movie' ? 'Movie' : 'Series'}
              </div>
              <p className="text-ink-dim text-xs mt-1 line-clamp-2">{r.overview}</p>
            </div>
            <button
              onClick={() => importTitle(r)}
              disabled={importingId === r.tmdbId}
              className="shrink-0 px-3 py-2 bg-ink text-void rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {importingId === r.tmdbId ? 'Importing…' : 'Import'}
            </button>
          </div>
        ))}
        {!searching && results.length === 0 && query && (
          <div className="text-ink-faint text-sm font-mono">No results — try a different search.</div>
        )}
      </div>
    </div>
  );
}
