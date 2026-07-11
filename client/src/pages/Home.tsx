import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Film } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { getRegionCookie, setRegionCookie, normalizeRegion } from '../lib/regionConfig';
import Ticker from '../components/Ticker';
import Hero from '../components/Hero';
import Tabs from '../components/Tabs';
import Section from '../components/Section';
import Card from '../components/Card';
import TmdbCard from '../components/TmdbCard';
import type { TmdbItem } from '../components/TmdbCard';
import RegionPicker from '../components/RegionPicker';
import { GlassCardSkeleton } from '../components/GlassCard';
import ContinueWatchingCard from '../components/ContinueWatchingCard';

interface GeoRow {
  id: string;
  label: string;
  items: TmdbItem[];
}

// B: Module-level cache — survives React unmount/remount during navigation.
// Populated on first load; on back-navigation the cache is hot and we skip
// re-fetching, restoring both data and scroll position immediately.
interface HomeCache {
  top10: any[];
  trending: any[];
  recent: any[];
  movies: any[];
  series: any[];
  anime: any[];
  genreList: string[];
  genreSections: Record<string, any[]>;
  geoRows: GeoRow[];
  region: string;
  scrollY: number;
}
let _cache: HomeCache | null = null;

export default function Home() {
  const location = useLocation();
  const { user } = useAuth();
  // On back-navigation the browser may push a popstate; detect via location.key
  const isRestoring = useRef(false);

  const [activeTab, setActiveTab] = useState('All');
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [top10, setTop10] = useState<any[]>(_cache?.top10 ?? []);
  const [trending, setTrending] = useState<any[]>(_cache?.trending ?? []);
  const [recent, setRecent] = useState<any[]>(_cache?.recent ?? []);
  const [movies, setMovies] = useState<any[]>(_cache?.movies ?? []);
  const [series, setSeries] = useState<any[]>(_cache?.series ?? []);
  const [anime, setAnime] = useState<any[]>(_cache?.anime ?? []);
  const [genreSections, setGenreSections] = useState<Record<string, any[]>>(_cache?.genreSections ?? {});
  const [genreList, setGenreList] = useState<string[]>(_cache?.genreList ?? []);
  const [initialLoading, setInitialLoading] = useState(!_cache);

  const [region, setRegion] = useState<string>(() => _cache?.region ?? normalizeRegion(getRegionCookie()));
  const [geoRows, setGeoRows] = useState<GeoRow[]>(_cache?.geoRows ?? []);
  const [geoLoading, setGeoLoading] = useState(false);

  const loadGeoContent = useCallback(async (r: string) => {
    setGeoLoading(true);
    try {
      const data = await api.geo.content(r);
      setGeoRows(data.rows || []);
    } catch {
      setGeoRows([]);
    } finally {
      setGeoLoading(false);
    }
  }, []);

  // B: Restore scroll position after state is populated from cache
  useEffect(() => {
    if (_cache && _cache.scrollY > 0) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: _cache!.scrollY, behavior: 'instant' as ScrollBehavior });
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // B: Save scroll position when navigating away
  useEffect(() => {
    const onScroll = () => {
      if (_cache) _cache.scrollY = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (_cache) {
      // Already cached — restore region's geo content without re-fetching everything
      if (!_cache.geoRows.length) {
        loadGeoContent(_cache.region);
      }
      isRestoring.current = true;
      return;
    }

    const cookie = getRegionCookie();
    if (cookie) {
      loadGeoContent(cookie);
    } else {
      api.geo.detect()
        .then((data: { region: string }) => {
          const detected = data.region || 'IN';
          setRegion(detected);
          setRegionCookie(detected);
          return loadGeoContent(detected);
        })
        .catch(() => loadGeoContent('IN'));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRegionChange = useCallback((newRegion: string) => {
    setRegion(newRegion);
    setRegionCookie(newRegion);
    loadGeoContent(newRegion);
  }, [loadGeoContent]);

  useEffect(() => {
    // Skip initial fetch when restoring from cache
    if (isRestoring.current) return;
    if (_cache) return;

    const core = Promise.all([
      api.titles.top10().then(setTop10).catch(() => {}),
      api.titles.trending().then(setTrending).catch(() => {}),
      api.titles.recent().then(setRecent).catch(() => {}),
    ]);

    api.titles.list({ type: 'MOVIE', limit: '20' }).then(d => setMovies(d.titles || [])).catch(() => {});
    api.titles.list({ type: 'SERIES', limit: '20' }).then(d => setSeries(d.titles || [])).catch(() => {});
    api.titles.list({ type: 'ANIME', limit: '20' }).then(d => setAnime(d.titles || [])).catch(() => {});

    api.titles.genres().then(({ genres }: { genres: { genre: string; count: number }[] }) => {
      const top = genres.slice(0, 10).map(g => g.genre);
      setGenreList(top);
      Promise.all(
        top.map(genre =>
          api.titles.list({ genre, limit: '20' })
            .then((d: any) => [genre, d.titles || []] as [string, any[]])
            .catch(() => [genre, []] as [string, any[]])
        )
      ).then(results => {
        setGenreSections(Object.fromEntries(results.filter(([, titles]) => titles.length > 0)));
      }).catch(() => {});
    }).catch(() => {});

    core.finally(() => setInitialLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // B: Populate cache whenever data changes so back-navigation is instant
  useEffect(() => {
    if (top10.length || trending.length || recent.length) {
      _cache = {
        top10, trending, recent, movies, series, anime,
        genreList, genreSections, geoRows, region,
        scrollY: _cache?.scrollY ?? 0,
      };
    }
  }, [top10, trending, recent, movies, series, anime, genreList, genreSections, geoRows, region]);

  const TAB_TYPE: Record<string, string> = useMemo(() => (
    { Movies: 'MOVIE', Series: 'SERIES', Anime: 'ANIME' }
  ), []);

  // Memoize filtered lists to avoid re-computing on every render
  const filteredTop10 = useMemo(() => {
    const type = TAB_TYPE[activeTab];
    const filtered = type ? top10.filter(t => t.type === type) : top10;
    const seen = new Set<string>();
    return filtered.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
  }, [top10, activeTab, TAB_TYPE]);

  const filteredTrending = useMemo(() => {
    const type = TAB_TYPE[activeTab];
    const filtered = type ? trending.filter(t => t.type === type) : trending;
    const seen = new Set<string>();
    return filtered.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
  }, [trending, activeTab, TAB_TYPE]);

  const filteredRecent = useMemo(() => {
    const type = TAB_TYPE[activeTab];
    const filtered = type ? recent.filter(t => t.type === type) : recent;
    const seen = new Set<string>();
    return filtered.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
  }, [recent, activeTab, TAB_TYPE]);

  const heroTitles = useMemo(() => (top10.length ? top10 : trending).slice(0, 10), [top10, trending]);
  const showGenre = activeTab === 'All';
  const typeSpecificItems = useMemo(() => {
    if (!TAB_TYPE[activeTab]) return [];
    return activeTab === 'Movies' ? movies : activeTab === 'Series' ? series : anime;
  }, [TAB_TYPE, activeTab, movies, series, anime]);

  // Fetch Continue Watching for logged-in users (re-runs when user changes)
  useEffect(() => {
    if (!user) { setContinueWatching([]); return; }
    api.history.mine()
      .then((items: any[]) => {
        // Only show incomplete items with meaningful progress (>10 s)
        setContinueWatching(items.filter(i => !i.completed && i.positionSeconds > 10));
      })
      .catch(() => setContinueWatching([]));
  }, [user]);

  const handleRemoveContinueWatching = useCallback((titleId: string) => {
    setContinueWatching(prev => prev.filter(i => i.titleId !== titleId));
    api.history.remove(titleId).catch(() => {});
  }, []);

  // Suppress unused-variable warning from location (used to detect navigation)
  void location;

  return (
    <div>
      <Ticker />
      <Hero titles={heroTitles} />
      <Tabs active={activeTab} onChange={setActiveTab} />

      {initialLoading && (
        <div className="px-5 py-6 flex gap-3.5 overflow-x-auto scrollbar-hide">
          {Array.from({ length: 8 }).map((_, i) => <GlassCardSkeleton key={i} />)}
        </div>
      )}

      {continueWatching.length > 0 && (
        <Section title="Continue Watching" count={`${continueWatching.length}`}>
          {continueWatching.map(item => (
            <ContinueWatchingCard
              key={item.titleId}
              item={item}
              onRemove={handleRemoveContinueWatching}
            />
          ))}
        </Section>
      )}

      {filteredTop10.length > 0 && (
        <Section title="Top 10 Today" count={`${filteredTop10.length}`} viewAllPath={`/search?q=&type=${TAB_TYPE[activeTab] ?? ''}`}>
          {filteredTop10.map((t, i) => <Card key={t.id} title={t} rank={i + 1} />)}
        </Section>
      )}

      {activeTab !== 'All' && typeSpecificItems.length > 0 && (
        <Section
          title={activeTab === 'Movies' ? 'All Movies' : activeTab === 'Series' ? 'TV Shows' : 'Anime'}
          count={`${typeSpecificItems.length}`}
          viewAllPath={`/search?q=&type=${TAB_TYPE[activeTab]}`}
        >
          {typeSpecificItems.map(t => <Card key={t.id} title={t} />)}
        </Section>
      )}

      {filteredTrending.length > 0 && (
        <Section title="Trending Now" count={`${filteredTrending.length}`} viewAllPath="/search?q=trending">
          {filteredTrending.map(t => <Card key={t.id} title={t} />)}
        </Section>
      )}

      {filteredRecent.length > 0 && (
        <Section title="Recently Added" count={`${filteredRecent.length}`} viewAllPath="/search?q=">
          {filteredRecent.map(t => <Card key={t.id} title={t} />)}
        </Section>
      )}

      {showGenre && (
        <>
          <RegionPicker region={region} onChange={handleRegionChange} />
          {geoLoading && geoRows.length === 0 && (
            <div className="px-5 py-6 flex gap-3.5 overflow-x-auto scrollbar-hide">
              {Array.from({ length: 6 }).map((_, i) => <GlassCardSkeleton key={i} />)}
            </div>
          )}
          {geoRows.map(row =>
            row.items.length > 0 ? (
              <Section key={row.id} title={row.label} count={`${row.items.length}`}>
                {row.items.map(item => <TmdbCard key={item.tmdbId} item={item} />)}
              </Section>
            ) : null
          )}
        </>
      )}

      {/* Genre sections — plain genre names, no emoji */}
      {showGenre && genreList.map(genre => {
        const titles = genreSections[genre];
        if (!titles || titles.length === 0) return null;
        return (
          <Section key={genre} title={genre} count={`${titles.length}`} viewAllPath={`/search?q=${genre}&genre=${genre}`}>
            {titles.map(t => <Card key={t.id} title={t} />)}
          </Section>
        );
      })}

      {top10.length === 0 && trending.length === 0 && recent.length === 0 && !initialLoading && (
        <div className="px-5 py-20 text-center">
          <Film size={40} className="mx-auto text-ink-faint/30 mb-5" />
          <p className="font-serif text-2xl font-semibold mb-2">Building your catalog…</p>
          <p className="text-ink-faint text-sm max-w-sm mx-auto">
            The catalog is being populated from TMDB. It'll be ready shortly — check back in a moment.
          </p>
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}
