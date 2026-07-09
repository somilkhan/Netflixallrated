import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { searchAnime, getAnimePage, getAnimeGenresAndTags } from '../lib/anilist';
import Card from '../components/Card';
import Section from '../components/Section';
import { GlassCardSkeleton } from '../components/GlassCard';
import { AniListMedia } from '../lib/anilist';

export default function Anime() {
  const nav = useNavigate();
  const [selectedGenre, setSelectedGenre] = useState('');
  const [dbAnime, setDbAnime] = useState<any[]>([]);
  const [dbAnimeLoading, setDbAnimeLoading] = useState(true);
  const [anilistResults, setAnilistResults] = useState<AniListMedia[]>([]);
  const [anilistLoading, setAnilistLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<AniListMedia | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [animeGenres, setAnimeGenres] = useState<string[]>([]);

  // Live genre list from AniList — never hardcoded.
  useEffect(() => {
    getAnimeGenresAndTags().then(({ genres }) => setAnimeGenres(genres)).catch(() => {});
  }, []);

  useEffect(() => {
    setDbAnimeLoading(true);
    api.titles.list({ type: 'ANIME', limit: '50', ...(selectedGenre ? { genre: selectedGenre } : {}) })
      .then(d => setDbAnime(d.titles || []))
      .catch(() => setDbAnime([]))
      .finally(() => setDbAnimeLoading(false));
  }, [selectedGenre]);

  // Trending anime straight from AniList's live feed — genre-filtered when selected.
  useEffect(() => {
    setAnilistLoading(true);
    getAnimePage({ sort: 'TRENDING_DESC', perPage: 15, genre: selectedGenre || undefined })
      .then((media: AniListMedia[]) => {
        const seen = new Set<number>();
        const deduped = media.filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
        setAnilistResults(deduped);
      })
      .finally(() => setAnilistLoading(false));
  }, [selectedGenre]);

  const handleAnilistSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResult(null);
    searchAnime(searchQuery.trim())
      .then(result => { setSearchResult(result); })
      .catch(() => { setSearchResult(null); })
      .finally(() => { setSearchLoading(false); });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-8 pb-6 border-b border-line">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">⚔️</span>
          <h1 className="font-serif text-3xl font-semibold">Anime</h1>
        </div>
        <p className="text-ink-faint text-sm ml-[48px]">From your catalog + live AniList data</p>
      </div>

      {/* AniList search */}
      <div className="px-5 py-5 border-b border-line bg-surface/40">
        <p className="font-mono text-[11px] text-ink-faint uppercase tracking-wider mb-2.5">Search AniList</p>
        <form onSubmit={handleAnilistSearch} className="flex gap-2 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search any anime…"
            className="flex-1 bg-surface border border-line rounded-full px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-maroon transition-colors"
          />
          <button type="submit" className="bg-maroon/80 hover:bg-maroon text-white font-mono text-xs px-4 py-2.5 rounded-full transition-colors">
            Search
          </button>
        </form>
        {searchLoading && <p className="text-ink-faint text-xs font-mono mt-2 animate-pulse">Searching AniList…</p>}
        {searchResult && (
          <div className="mt-3 flex gap-4 p-4 rounded-xl border border-maroon/30 bg-surface max-w-xl">
            {searchResult.coverImage?.extraLarge && (
              <img src={searchResult.coverImage.extraLarge} alt={searchResult.title.romaji}
                loading="lazy"
                className="w-[64px] h-[90px] rounded-lg object-cover border border-line shrink-0"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-serif text-base font-semibold leading-tight">
                {searchResult.title.english || searchResult.title.romaji}
              </p>
              {searchResult.title.english && <p className="text-ink-faint text-[11px] font-mono">{searchResult.title.romaji}</p>}
              <div className="font-mono text-[11px] text-ink-dim flex flex-wrap gap-1.5 items-center mt-1">
                {searchResult.startDate?.year && <span>{searchResult.startDate.year}</span>}
                {searchResult.episodes && <><span>·</span><span>{searchResult.episodes} eps</span></>}
                {searchResult.averageScore && (
                  <><span>·</span>
                  <span className="bg-maroon/20 border border-maroon/50 rounded px-1.5 py-px text-ink">
                    ★ {(searchResult.averageScore / 10).toFixed(1)}
                  </span></>
                )}
              </div>
              {searchResult.genres?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {searchResult.genres.slice(0, 4).map(g => (
                    <span key={g} className="font-mono text-[10px] px-1.5 py-px rounded border border-line text-ink-faint">{g}</span>
                  ))}
                </div>
              )}
              <button
                onClick={() => nav(`/search?q=${encodeURIComponent(searchResult.title.english || searchResult.title.romaji)}&type=ANIME`)}
                className="mt-2 font-mono text-[11px] text-maroon-bright hover:underline"
              >
                Find in catalog →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Genre filter */}
      <div className="px-5 py-4 flex gap-2 overflow-x-auto scrollbar-hide border-b border-line">
        <button
          onClick={() => setSelectedGenre('')}
          className={`shrink-0 font-mono text-xs px-3.5 py-1.5 rounded-full border transition-all ${
            !selectedGenre ? 'bg-ink text-void border-ink' : 'bg-surface border-line text-ink-faint hover:text-ink hover:border-line-bright'
          }`}
        >All</button>
        {animeGenres.map(g => (
          <button key={g} onClick={() => setSelectedGenre(g === selectedGenre ? '' : g)}
            className={`shrink-0 font-mono text-xs px-3.5 py-1.5 rounded-full border transition-all ${
              selectedGenre === g ? 'bg-maroon/20 border-maroon text-ink' : 'bg-surface border-line text-ink-faint hover:text-ink hover:border-line-bright'
            }`}
          >{g}</button>
        ))}
      </div>

      {/* Catalog anime */}
      {dbAnimeLoading ? (
        <div className="px-5 pt-8 flex gap-4 overflow-x-auto scrollbar-hide">
          {Array.from({ length: 6 }).map((_, i) => <GlassCardSkeleton key={i} />)}
        </div>
      ) : dbAnime.length > 0 ? (
        <Section title="In Your Catalog" count={`${dbAnime.length}`} viewAllPath="/search?q=&type=ANIME">
          {dbAnime.map(t => <Card key={t.id} title={t} />)}
        </Section>
      ) : (
        <div className="px-5 pt-8 pb-2">
          <p className="text-ink-faint text-sm">No anime in catalog yet — add them from the search or admin panel.</p>
        </div>
      )}

      {/* Popular from AniList */}
      {!selectedGenre && (
        <div className="px-5 pt-9 pb-2">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="font-serif text-xl font-semibold">Popular on AniList</span>
            <span className="font-mono text-[11px] text-ink-faint">live data</span>
            <div className="h-px bg-line flex-1 mx-4" />
          </div>
          {anilistLoading ? (
            <div className="flex gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <GlassCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2.5 scrollbar-hide">
              {anilistResults.map(anime => (
                <div
                  key={anime.id}
                  className="shrink-0 w-[142px] cursor-pointer group"
                  onClick={() => nav(`/search?q=${encodeURIComponent(anime.title.english || anime.title.romaji)}&type=ANIME`)}
                >
                  <div
                    className="w-[142px] h-[200px] rounded-[11px] border border-line overflow-hidden bg-cover bg-center relative transition-all duration-200 group-hover:border-maroon group-hover:-translate-y-1"
                    style={{
                      backgroundImage: anime.coverImage?.extraLarge
                        ? `linear-gradient(to bottom, transparent, rgba(0,0,0,0.5)), url(${anime.coverImage.extraLarge})`
                        : 'radial-gradient(120% 100% at 30% 0%, #1a1215, #0a0708)',
                    }}
                  >
                    {anime.averageScore && (
                      <div className="absolute top-2 right-2 bg-void/80 rounded px-1.5 py-0.5 font-mono text-[10px] text-maroon-bright">
                        ★ {(anime.averageScore / 10).toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-[13px] font-semibold truncate">
                    {anime.title.english || anime.title.romaji}
                  </div>
                  <div className="font-mono text-[10px] text-ink-faint truncate">
                    {anime.startDate?.year}{anime.episodes ? ` · ${anime.episodes} eps` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Browse suggestions — pulled from the same live trending feed above */}
      {!selectedGenre && dbAnime.length === 0 && anilistResults.length > 0 && (
        <div className="px-5 pt-6 pb-4">
          <p className="font-mono text-[11px] text-ink-faint uppercase tracking-wider mb-3">Browse by name</p>
          <div className="flex flex-wrap gap-2">
            {anilistResults.map(anime => {
              const name = anime.title.english || anime.title.romaji;
              return (
                <button
                  key={anime.id}
                  onClick={() => nav(`/search?q=${encodeURIComponent(name)}&type=ANIME`)}
                  className="font-mono text-xs px-3 py-1.5 rounded-full border border-line text-ink-faint hover:border-maroon hover:text-ink transition-all"
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="h-28" />
    </div>
  );
}
