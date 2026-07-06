import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import Card from '../components/Card';
import { searchAnime } from '../lib/anilist';

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
  const [filters, setFilters] = useState({ type: '', genre: '', platform: '' });
  const [anilistResult, setAnilistResult] = useState<any>(null);
  const [anilistLoading, setAnilistLoading] = useState(false);

  useEffect(() => {
    api.titles.list({ search: q, type: filters.type, genre: filters.genre, platform: filters.platform, limit: '50' }).then(d => setResults(d.titles));
  }, [q, filters]);

  // Fetch AniList best match when searching with Anime filter (or always if query looks anime-ish)
  useEffect(() => {
    if (!q || filters.type !== 'ANIME') { setAnilistResult(null); return; }
    setAnilistLoading(true);
    setAnilistResult(null);
    searchAnime(q).then((data) => { setAnilistResult(data); setAnilistLoading(false); });
  }, [q, filters.type]);

  return (
    <div className="px-5 py-8">
      <h1 className="font-serif text-2xl font-semibold mb-6">Search: {q}</h1>
      <div className="flex gap-4 mb-6 flex-wrap">
        <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} className="bg-surface border border-line rounded-lg px-3 py-2 text-sm focus:border-maroon outline-none">
          <option value="">All Types</option><option value="MOVIE">Movies</option><option value="SERIES">Series</option><option value="ANIME">Anime</option>
        </select>
        <select value={filters.genre} onChange={e => setFilters(f => ({ ...f, genre: e.target.value }))} className="bg-surface border border-line rounded-lg px-3 py-2 text-sm focus:border-maroon outline-none">
          <option value="">All Genres</option><option value="Drama">Drama</option><option value="Action">Action</option><option value="Animation">Animation</option><option value="Comedy">Comedy</option><option value="Sci-Fi">Sci-Fi</option>
        </select>
      </div>

      {/* AniList best match — shown only when Anime filter is active */}
      {filters.type === 'ANIME' && q && (
        <div className="mb-8">
          <p className="font-mono text-[11px] text-ink-faint uppercase tracking-wider mb-3">Best match · AniList</p>
          {anilistLoading && (
            <div className="h-32 flex items-center text-ink-dim font-mono text-xs animate-pulse">Searching AniList…</div>
          )}
          {!anilistLoading && anilistResult && (
            <div className="flex gap-4 p-4 rounded-xl border border-line bg-surface max-w-xl">
              {(anilistResult.coverImage?.large || anilistResult.coverImage?.extraLarge) && (
                <img
                  src={anilistResult.coverImage.extraLarge || anilistResult.coverImage.large}
                  alt={anilistResult.title.romaji}
                  className="w-[80px] h-[112px] rounded-lg object-cover border border-line shrink-0"
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
                {anilistResult.studios?.nodes?.[0]?.name && (
                  <p className="font-mono text-[10px] text-ink-faint">
                    Studio: {anilistResult.studios.nodes[0].name}
                  </p>
                )}
              </div>
            </div>
          )}
          {!anilistLoading && !anilistResult && (
            <p className="text-ink-faint text-xs font-mono">No AniList match found.</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4">{results.map((t, i) => <Card key={t.id} title={t} index={i} />)}</div>
    </div>
  );
}
