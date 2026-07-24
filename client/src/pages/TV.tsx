/**
 * TV Shows — rebuilt to use live TMDB API data directly.
 * No backend calls for content — all rows come from TMDB.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tv, Inbox } from 'lucide-react';
import {
  getTrending,
  getPopularTVShows,
  getTopRatedTVShows,
  getTVByGenre,
  getTVVideos,
  type TmdbNormalized,
  type RegionParams,
} from '../services/tmdb';
import { detectRegion, getCachedRegion, DEFAULT_REGION, type RegionInfo } from '../lib/geo';
import { api } from '../lib/api';
import HeroSection from '../components/sections/HeroSection';
import ContentRow from '../components/sections/ContentRow';
import TmdbContentCard from '../components/TmdbContentCard';
import { SkeletonRow } from '../components/ui/SkeletonCard';

// Static TMDB TV genre list (these rarely change)
const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' },
  { id: 16,    name: 'Animation' },
  { id: 35,    name: 'Comedy' },
  { id: 80,    name: 'Crime' },
  { id: 99,    name: 'Documentary' },
  { id: 18,    name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 10762, name: 'Kids' },
  { id: 9648,  name: 'Mystery' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10768, name: 'War & Politics' },
  { id: 37,    name: 'Western' },
];

// ── Infinite-scroll hook for genre-filtered results ────────────────────────
function useGenreScroll(genreId: number | null) {
  const [items,   setItems]   = useState<TmdbNormalized[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const pageRef   = useRef(1);
  const inFlight  = useRef(false);
  const versionRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset + first page whenever genre changes
  useEffect(() => {
    versionRef.current += 1;
    inFlight.current = false;
    pageRef.current = 1;
    setItems([]);
    setHasMore(false);
    if (genreId === null) return;

    const v = versionRef.current;
    setLoading(true);
    getTVByGenre(genreId, 1).then(results => {
      if (v !== versionRef.current) return;
      setItems(results);
      setHasMore(results.length >= 18);
      setLoading(false);
      inFlight.current = false;
    }).catch(() => {
      if (v !== versionRef.current) return;
      setLoading(false);
      inFlight.current = false;
    });
  }, [genreId]);

  const loadNext = useCallback(() => {
    if (inFlight.current || !hasMore || genreId === null) return;
    inFlight.current = true;
    const next = pageRef.current + 1;
    const v = versionRef.current;
    setLoading(true);
    getTVByGenre(genreId, next).then(results => {
      if (v !== versionRef.current) return;
      pageRef.current = next;
      setItems(prev => {
        const seen = new Set(prev.map(i => i.id));
        return [...prev, ...results.filter(i => !seen.has(i.id))];
      });
      setHasMore(results.length >= 18);
      setLoading(false);
      inFlight.current = false;
    }).catch(() => {
      if (v !== versionRef.current) return;
      setLoading(false);
      inFlight.current = false;
    });
  }, [hasMore, genreId]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadNext(); },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadNext]);

  return { items, loading, sentinelRef };
}

// ── Skeleton row ───────────────────────────────────────────────────────────
function SectionSkeleton() {
  return (
    <div className="py-5">
      <div className="px-4 md:px-6 mb-3 h-6 w-40 rounded-full bg-[#1A1A1A] animate-pulse" />
      <SkeletonRow count={8} />
    </div>
  );
}

// ── Card grid for genre view ───────────────────────────────────────────────
function CardGrid({ items }: { items: TmdbNormalized[] }) {
  return (
    <div className="flex flex-wrap gap-3.5">
      {items.map(item => (
        <TmdbContentCard key={item.id} item={item} />
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function TVShows() {
  const navigate = useNavigate();

  const [selectedGenre, setSelectedGenre] = useState<{ id: number; name: string } | null>(null);

  // ── Region detection (same pattern as Home.tsx) ──────────────────────────
  const [region, setRegion] = useState<RegionInfo>(() => getCachedRegion() ?? DEFAULT_REGION);

  useEffect(() => {
    detectRegion()
      .then(detected => setRegion(detected))
      .catch(() => {});
  }, []);

  // Row data
  const [trending,  setTrending]  = useState<TmdbNormalized[]>([]);
  const [popular,   setPopular]   = useState<TmdbNormalized[]>([]);
  const [topRated,  setTopRated]  = useState<TmdbNormalized[]>([]);
  const [heroItems, setHeroItems] = useState<TmdbNormalized[]>([]);
  const [loading,   setLoading]   = useState(true);

  // Genre scroll (only active when genre selected)
  const { items: genreItems, loading: genreLoading, sentinelRef } =
    useGenreScroll(selectedGenre?.id ?? null);

  // Fetch all rows — re-run when region changes
  useEffect(() => {
    setLoading(true);
    const rp: RegionParams = { region: region.countryCode, language: region.language };
    Promise.allSettled([
      getTrending('tv', 'day', 1, rp),
      getPopularTVShows(1, rp),
      getTopRatedTVShows(1, rp),
    ]).then(([trendRes, popRes, topRes]) => {
      const trend = trendRes.status === 'fulfilled' ? trendRes.value : [];
      const pop   = popRes.status   === 'fulfilled' ? popRes.value   : [];
      const top   = topRes.status   === 'fulfilled' ? topRes.value   : [];
      setTrending(trend);
      setPopular(pop);
      setTopRated(top);
      setHeroItems(trend.slice(0, 6));
      setLoading(false);
    });
  }, [region]);

  // Fetch trailers for hero items in background
  useEffect(() => {
    if (!heroItems.length) return;
    Promise.all(
      heroItems.slice(0, 5).map(item => getTVVideos(item.tmdbId).catch(() => null)),
    ).then(keys => {
      setHeroItems(prev =>
        prev.map((item, i) =>
          i < keys.length && keys[i] ? { ...item, trailerYoutubeId: keys[i]! } : item,
        ),
      );
    });
  }, [trending]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hero action — resolve TMDB → backend ID, then navigate
  const heroAction = useCallback(async (item: TmdbNormalized, play: boolean) => {
    try {
      const { id } = await api.titles.resolveTmdb(item.tmdbId, item.mediaType);
      navigate(`/title/${id}${play ? '?play=1' : ''}`);
    } catch {
      navigate(`/search?q=${encodeURIComponent(item.name)}&type=SERIES`);
    }
  }, [navigate]);

  return (
    <div className="min-h-screen pb-28 md:pb-0">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      {heroItems.length > 0 ? (
        <HeroSection
          titles={heroItems}
          onAction={heroAction}
          regionLabel={`Popular TV in ${region.countryName}`}
        />
      ) : loading ? (
        <div className="w-full bg-[#0f0f0f] animate-pulse"
          style={{ height: 'clamp(320px, 55svh, 640px)' }} />
      ) : null}

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="px-5 pt-8 pb-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3 mb-1">
          <Tv size={20} className="text-white shrink-0" strokeWidth={1.8} />
          <h1 className="text-[28px] font-bold tracking-tight text-white leading-none">TV Shows</h1>
        </div>
        <p className="text-[13.5px] text-[#666] ml-[31px]">
          Series, dramas, documentaries &amp; more — live from TMDB
        </p>
      </div>

      {/* ── Genre filter pills ────────────────────────────────────────── */}
      <div className="px-5 py-3 flex gap-2 overflow-x-auto scrollbar-hide border-b border-[#1a1a1a]">
        <button
          onClick={() => setSelectedGenre(null)}
          className={`shrink-0 text-[12px] px-4 py-1.5 rounded-full border transition-colors duration-200 ${
            !selectedGenre
              ? 'bg-white text-black border-white'
              : 'bg-transparent border-[#333] text-[#888] hover:text-white hover:border-[#555]'
          }`}
        >
          All
        </button>
        {TV_GENRES.map(g => (
          <button
            key={g.id}
            onClick={() => setSelectedGenre(s => s?.id === g.id ? null : g)}
            className={`shrink-0 text-[12px] px-4 py-1.5 rounded-full border transition-colors duration-200 ${
              selectedGenre?.id === g.id
                ? 'bg-white text-black border-white'
                : 'bg-transparent border-[#333] text-[#888] hover:text-white hover:border-[#555]'
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* ── Genre-filtered view ───────────────────────────────────────── */}
      {selectedGenre ? (
        <div className="px-5 pt-8">
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-[22px] font-semibold text-white">{selectedGenre.name}</span>
          </div>

          {genreLoading && genreItems.length === 0 ? (
            <SkeletonRow count={8} />
          ) : genreItems.length > 0 ? (
            <>
              <CardGrid items={genreItems} />
              {genreLoading && (
                <div className="flex flex-wrap gap-3.5 mt-3.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-[120px] sm:w-[140px] md:w-[180px] aspect-[2/3] bg-[#1A1A1A] rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              )}
              <div ref={sentinelRef} className="h-8" />
            </>
          ) : !genreLoading ? (
            <div className="py-20 text-center">
              <Inbox size={36} className="mx-auto text-white/20 mb-4" />
              <p className="text-lg font-semibold text-white">No results</p>
            </div>
          ) : null}
        </div>

      ) : (
        /* ── Default rows view ─────────────────────────────────────── */
        <>
          {loading ? (
            <>
              <SectionSkeleton />
              <SectionSkeleton />
              <SectionSkeleton />
            </>
          ) : (
            <>
              {trending.length > 0 && (
                <ContentRow title={`Trending TV in ${region.countryName}`}>
                  {trending.slice(0, 20).map(item => (
                    <TmdbContentCard key={item.id} item={item} />
                  ))}
                </ContentRow>
              )}
              {popular.length > 0 && (
                <ContentRow title={`Popular TV Shows in ${region.countryName}`}>
                  {popular.slice(0, 20).map(item => (
                    <TmdbContentCard key={item.id} item={item} />
                  ))}
                </ContentRow>
              )}
              {topRated.length > 0 && (
                <ContentRow title={`Top Rated TV in ${region.countryName}`}>
                  {topRated.slice(0, 20).map(item => (
                    <TmdbContentCard key={item.id} item={item} />
                  ))}
                </ContentRow>
              )}
            </>
          )}
        </>
      )}

      <div className="h-16" />
    </div>
  );
}
