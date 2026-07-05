import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { TmdbSearchResult } from '../types';

export default function Admin() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

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

  const syncTrending = async () => {
    setSyncing(true);
    setMessage('');
    try {
      const { imported, skipped, errors } = await api.titles.syncTmdb();
      setMessage(`Sync complete — ${imported} imported, ${skipped} already in catalog${errors ? `, ${errors} errors` : ''}.`);
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
