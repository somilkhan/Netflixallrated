import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Film, Tv, Sword, X } from 'lucide-react';
import { api } from '../lib/api';
import Card from '../components/Card';
import { searchAnime } from '../lib/anilist';

const GENRES = ['Action', 'Drama', 'Comedy', 'Sci-Fi', 'Thriller', 'Horror', 'Romance',
  'Animation', 'Crime', 'Mystery', 'Fantasy', 'Adventure', 'Documentary', 'Family'];

function TmdbCard({ item, onImported }: { item: any; onImported?: () => void }) {
  const [status, setStatus] = useState<'idle' | 'importing' | 'done' | 'exists'>('idle');
  const nav = useNavigate();

  const handleImport = async () => {
    setStatus('importing');
    try {
      const result = await api.titles.importTmdb({
        tmdbId: item.tmdbId,
        mediaType: item.mediaType,
        type: item.mediaType === 'movie' ? 'MOVIE' : 'SERIES',
      });
      setStatus('done');
      onImported?.();
      nav(`/title/${result.id}`);
    } catch (e: any) {
      if (e.message?.includes('Already imported')) setStatus('exists');
      else setStatus('idle');
    }
  };

  return (
    <div className="shrink-0 w-[142px] md:w-[172px] group cursor-pointer" onClick={status === 'idle' ? handleImport : undefined}>
      <div
        className="relative w-[142px] md:w-[172px] h-[200px] md:h-[246px] rounded-[11px] border border-line overflow-hidden flex flex-col justify-end p-2 bg-cover bg-center transition-all duration-200 group-hover:border-maroon group-hover:-translate-y-1"
        style={{
          backgroundImage: item.posterUrl
            ? `linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.72)), url(${item.posterUrl})`
            : 'radial-gradient(120% 100% at 30% 0%, #1a1215, #0a0708 70%)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />
        <div className="relative z-10">
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-line/60 bg-surface/60 text-ink-faint uppercase tracking-wide">
            {item.mediaType === 'movie' ? 'Movie' : 'Series'} · TMDB
          </span>
        </div>
        {status === 'importing' && (
          <div className="absolute inset-0 bg-void/70 flex items-center justify-center">
            <span className="text-[11px] font-mono text-ink-dim animate-pulse">Adding…</span>
          </div>
        )}
        {status === 'done' && (
          <div className="absolute inset-0 bg-void/70 flex items-center justify-center">
            <span className="text-[11px] font-mono text-maroon-bright">Added ✓</span>
          </div>
        )}
      </div>
      <div className="mt-2.5 text-[13.5px] font-semibold truncate">{item.name}</div>
      <div className="font-mono text-[10.5px] text-ink-faint">{item.year ?? '—'} · {item.mediaType === 'movie' ? 'Movie' : 'Series'}</div>
    </div>
  );
}

export default function SearchResults() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const q = params.get('q') || '';
  const [query, setQuery] = useState(q);
  const [filters, setFilters] = useState({ type: params.get('type') || '', genre: '' });
  const [localResults, setLocalResults] = useState<any[]>([]);
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [anilistResult, setAnilistResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tmdbKey, setTmdbKey] = useState(0); // force-refresh after import
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setQuery(q); }, [q]);

  useEffect(() => {
    if (!q) { setLocalResults([]); setTmdbResults([]); setLoading(false); return; }
    setLoading(true);
    const qs: Record<string, string> = { search: q, limit: '50' };
    if (filters.type) qs.type = filters.type;
    if (filters.genre) qs.genre = filters.genre;

    Promise.all([
      api.titles.liveSearch(q).catch(() => ({ local: [], tmdb: [] })),
    ]).then(([live]) => {
      let local = live.local || [];
      if (filters.type) local = local.filter((t: any) => t.type === filters.type);
      if (filters.genre) local = local.filter((t: any) => t.genres?.includes(filters.genre));
      setLocalResults(local);
      setTmdbResults(live.tmdb || []);
      setLoading(false);
    });
  }, [q, filters, tmdbKey]);

  // AniList when anime filter active
  useEffect(() => {
    if (!q || filters.type !== 'ANIME') { setAnilistResult(null); return; }
    searchAnime(q).then((data) => { setAnilistResult(data); });
  }, [q, filters.type]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) nav(`/search?q=${encodeURIComponent(query.trim())}&type=${filters.type}`);
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length > 1) {
      debounceRef.current = setTimeout(() => {
        nav(`/search?q=${encodeURIComponent(val.trim())}&type=${filters.type}`, { replace: true });
      }, 400);
    }
  };

  const total = localResults.length + tmdbResults.length;

  return (
    <div className="px-5 py-7 max-w-[1200px] mx-auto">
      {/* Search bar on page */}
      <form onSubmit={handleSearch} className="relative mb-7 max-w-xl">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
          placeholder="Search movies, shows, anime…"
          className="w-full bg-surface border border-line rounded-full pl-10 pr-10 py-3 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-maroon focus:shadow-[0_0_0_3px_rgba(122,37,48,0.15)] transition-all"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); nav('/search'); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition-colors">
            <X size={15} />
          </button>
        )}
      </form>

      {/* Filters */}
      <div className="flex gap-2.5 mb-7 flex-wrap">
        {[
          { label: 'All', icon: null, value: '' },
          { label: 'Movies', icon: Film, value: 'MOVIE' },
          { label: 'TV Shows', icon: Tv, value: 'SERIES' },
          { label: 'Anime', icon: Sword, value: 'ANIME' },
        ].map(({ label, icon: Icon, value }) => (
          <button
            key={value}
            onClick={() => setFilters(f => ({ ...f, type: value }))}
            className={`flex items-center gap-1.5 text-xs font-mono px-3.5 py-2 rounded-full border transition-all ${
              filters.type === value
                ? 'bg-maroon/20 border-maroon text-ink'
                : 'bg-surface border-line text-ink-faint hover:text-ink hover:border-line-bright'
            }`}
          >
            {Icon && <Icon size={11} />} {label}
          </button>
        ))}
        <select
          value={filters.genre}
          onChange={e => setFilters(f => ({ ...f, genre: e.target.value }))}
          className="bg-surface border border-line rounded-full px-3.5 py-2 text-xs font-mono text-ink-faint focus:border-maroon focus:text-ink outline-none transition-all cursor-pointer"
        >
          <option value="">All Genres</option>
          {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* AniList best match */}
      {filters.type === 'ANIME' && q && anilistResult && (
        <div className="mb-8">
          <p className="font-mono text-[11px] text-ink-faint uppercase tracking-wider mb-3">Best match · AniList</p>
          <div className="flex gap-4 p-4 rounded-xl border border-line bg-surface max-w-xl">
            {(anilistResult.coverImage?.large || anilistResult.coverImage?.extraLarge) && (
              <img
                src={anilistResult.coverImage.extraLarge || anilistResult.coverImage.large}
                alt={anilistResult.title.romaji}
                className="w-[72px] h-[102px] rounded-lg object-cover border border-line shrink-0"
              />
            )}
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="font-serif text-base font-semibold leading-tight">
                {anilistResult.title.english || anilistResult.title.romaji}
              </p>
              {anilistResult.title.english && anilistResult.title.romaji && (
                <p className="font-mono text-[11px] text-ink-faint">{anilistResult.title.romaji}</p>
              )}
              <div className="font-mono text-[11px] text-ink-dim flex flex-wrap gap-1.5 items-center">
                {anilistResult.startDate?.year && <span>{anilistResult.startDate.year}</span>}
                {anilistResult.episodes && <><span>·</span><span>{anilistResult.episodes} eps</span></>}
                {anilistResult.averageScore && (
                  <><span>·</span>
                  <span className="bg-maroon/20 border border-maroon/50 text-ink rounded px-1.5 py-px">
                    ★ {(anilistResult.averageScore / 10).toFixed(1)}
                  </span></>
                )}
                {anilistResult.status && <><span>·</span><span className="capitalize">{anilistResult.status.toLowerCase().replace('_', ' ')}</span></>}
              </div>
              {anilistResult.genres?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {anilistResult.genres.slice(0, 4).map((g: string) => (
                    <span key={g} className="font-mono text-[10px] px-1.5 py-px rounded border border-line text-ink-faint">{g}</span>
                  ))}
                </div>
              )}
              {anilistResult.description && (
                <p className="text-ink-dim text-[12px] leading-relaxed line-clamp-2">
                  {anilistResult.description.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[142px] md:w-[172px]">
              <div className="w-[142px] md:w-[172px] h-[200px] md:h-[246px] rounded-[11px] border border-line bg-surface animate-pulse" />
              <div className="mt-2.5 h-3.5 bg-surface rounded w-4/5 animate-pulse" />
              <div className="mt-1 h-2.5 bg-surface rounded w-1/2 animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && q && (
        <>
          {localResults.length > 0 && (
            <div className="mb-10">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-serif text-xl font-semibold">Results</span>
                <span className="font-mono text-[11px] text-ink-faint">{localResults.length} titles</span>
              </div>
              <div className="flex flex-wrap gap-4">
                {localResults.map((t, i) => <Card key={t.id} title={t} index={i} />)}
              </div>
            </div>
          )}

          {tmdbResults.length > 0 && (
            <div className="mb-10">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-serif text-xl font-semibold">From TMDB</span>
                <span className="font-mono text-[11px] text-ink-faint">{tmdbResults.length} more</span>
              </div>
              <p className="text-ink-faint text-[11px] font-mono mb-4">Tap any card to add it to the catalog instantly</p>
              <div className="flex flex-wrap gap-4">
                {tmdbResults.map((t) => (
                  <TmdbCard key={t.tmdbId} item={t} onImported={() => setTmdbKey(k => k + 1)} />
                ))}
              </div>
            </div>
          )}

          {total === 0 && !loading && (
            <div className="py-20 text-center">
              <p className="text-5xl mb-5">🔍</p>
              <p className="font-serif text-xl font-semibold mb-2">No results for "{q}"</p>
              <p className="text-ink-faint text-sm">Try different keywords or adjust your filters</p>
            </div>
          )}
        </>
      )}

      {/* Empty state — no query */}
      {!q && !loading && (
        <div className="py-16 text-center">
          <p className="text-5xl mb-5">🎬</p>
          <p className="font-serif text-xl font-semibold mb-2">Search the catalog</p>
          <p className="text-ink-faint text-sm mb-8">Movies, TV shows, anime — all in one place</p>
          <div className="flex flex-wrap gap-2 justify-center max-w-sm mx-auto">
            {['Action', 'Drama', 'Sci-Fi', 'Anime', 'Comedy', 'Thriller', 'Horror', 'Romance'].map(g => (
              <button
                key={g}
                onClick={() => nav(`/search?q=${g}`)}
                className="font-mono text-xs px-3 py-1.5 rounded-full border border-line text-ink-faint hover:border-maroon hover:text-ink transition-all"
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
