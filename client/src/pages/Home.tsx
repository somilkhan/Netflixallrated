import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { getRegionCookie, setRegionCookie, normalizeRegion } from '../lib/regionConfig';
import Ticker from '../components/Ticker';
import Hero from '../components/Hero';
import Tabs from '../components/Tabs';
import Section from '../components/Section';
import Card from '../components/Card';
import TmdbCard from '../components/TmdbCard';
import type { TmdbItem } from '../components/TmdbCard';
import RegionPicker from '../components/RegionPicker';

const GENRE_SECTIONS = [
  { genre: 'Action', label: 'Action & Thrills', emoji: '⚡' },
  { genre: 'Drama', label: 'Drama', emoji: '🎭' },
  { genre: 'Sci-Fi', label: 'Sci-Fi & Future', emoji: '🚀' },
  { genre: 'Comedy', label: 'Comedy', emoji: '😄' },
  { genre: 'Horror', label: 'Horror', emoji: '👻' },
  { genre: 'Romance', label: 'Romance', emoji: '💫' },
  { genre: 'Crime', label: 'Crime & Mystery', emoji: '🔍' },
  { genre: 'Animation', label: 'Animation', emoji: '🎨' },
  { genre: 'Fantasy', label: 'Fantasy & Adventure', emoji: '🗡️' },
  { genre: 'Documentary', label: 'Documentary', emoji: '📽️' },
];

interface GeoRow {
  id: string;
  label: string;
  items: TmdbItem[];
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('All');
  const [top10, setTop10] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [anime, setAnime] = useState<any[]>([]);
  const [genreSections, setGenreSections] = useState<Record<string, any[]>>({});

  // Geo state
  const [region, setRegion] = useState<string>(() => normalizeRegion(getRegionCookie()));
  const [geoRows, setGeoRows] = useState<GeoRow[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);

  // Fetch geo rows whenever region changes
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

  // On mount: resolve region from cookie → detect from IP if missing → fetch content
  useEffect(() => {
    const cookie = getRegionCookie();
    if (cookie) {
      loadGeoContent(cookie);
    } else {
      // Auto-detect from IP
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

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    setRegionCookie(newRegion);
    loadGeoContent(newRegion);
  };

  useEffect(() => {
    // Core sections — .catch(() => {}) prevents unhandled rejection crashes
    api.titles.top10().then(setTop10).catch(() => {});
    api.titles.trending().then(setTrending).catch(() => {});
    api.titles.recent().then(setRecent).catch(() => {});

    // Type sections
    api.titles.list({ type: 'MOVIE', limit: '20' }).then(d => setMovies(d.titles || [])).catch(() => {});
    api.titles.list({ type: 'SERIES', limit: '20' }).then(d => setSeries(d.titles || [])).catch(() => {});
    api.titles.list({ type: 'ANIME', limit: '20' }).then(d => setAnime(d.titles || [])).catch(() => {});

    // Genre sections — fetch all in parallel, keep only non-empty ones
    Promise.all(
      GENRE_SECTIONS.map(({ genre }) =>
        api.titles.list({ genre, limit: '20' })
          .then(d => [genre, d.titles || []] as [string, any[]])
          .catch(() => [genre, []] as [string, any[]])
      )
    ).then(results => {
      setGenreSections(Object.fromEntries(results.filter(([, titles]) => titles.length > 0)));
    }).catch(() => {});
  }, []);

  // Map display tab names → DB enum values
  const TAB_TYPE: Record<string, string> = { Movies: 'MOVIE', Series: 'SERIES', Anime: 'ANIME' };

  // Filter by active tab AND deduplicate by id so React never sees duplicate keys
  const filter = (list: any[]) => {
    const type = TAB_TYPE[activeTab];
    const filtered = type ? list.filter(t => t.type === type) : list;
    const seen = new Set<string>();
    return filtered.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
  };

  const heroTitles = (top10.length ? top10 : trending).slice(0, 10);

  const showGenre = activeTab === 'All';
  const typeSpecificItems = TAB_TYPE[activeTab]
    ? (activeTab === 'Movies' ? movies : activeTab === 'Series' ? series : anime)
    : [];

  return (
    <div>
      <Ticker />
      <Hero titles={heroTitles} />
      <Tabs active={activeTab} onChange={setActiveTab} />

      {/* Top 10 — shown always, filtered by tab */}
      {filter(top10).length > 0 && (
        <Section title="Top 10 Today" count={`${filter(top10).length} titles`} viewAllPath={`/search?q=&type=${TAB_TYPE[activeTab] ?? ''}`}>
          {filter(top10).map((t, i) => <Card key={t.id} title={t} rank={i + 1} />)}
        </Section>
      )}

      {/* Type-specific section when filtered */}
      {activeTab !== 'All' && typeSpecificItems.length > 0 && (
        <Section
          title={activeTab === 'Movies' ? 'All Movies' : activeTab === 'Series' ? 'TV Shows' : 'Anime'}
          count={`${typeSpecificItems.length}`}
          viewAllPath={`/search?q=&type=${TAB_TYPE[activeTab]}`}
        >
          {typeSpecificItems.map(t => <Card key={t.id} title={t} />)}
        </Section>
      )}

      {/* Trending */}
      {filter(trending).length > 0 && (
        <Section title="Trending Now" count={`${filter(trending).length}`} viewAllPath="/search?q=trending">
          {filter(trending).map(t => <Card key={t.id} title={t} />)}
        </Section>
      )}

      {/* Recently Added */}
      {filter(recent).length > 0 && (
        <Section title="Recently Added" count={`${filter(recent).length}`} viewAllPath="/search?q=">
          {filter(recent).map(t => <Card key={t.id} title={t} />)}
        </Section>
      )}

      {/* ── Geo-personalised rows (All tab only) ─────────────────────────── */}
      {showGenre && (
        <>
          <RegionPicker region={region} onChange={handleRegionChange} />
          {geoLoading && geoRows.length === 0 && (
            <div className="px-5 py-6 font-mono text-[11px] text-ink-faint animate-pulse">
              Loading regional content…
            </div>
          )}
          {geoRows.map(row =>
            row.items.length > 0 ? (
              <Section key={row.id} title={row.label} count={`${row.items.length}`}>
                {row.items.map(item => (
                  <TmdbCard key={item.tmdbId} item={item} />
                ))}
              </Section>
            ) : null
          )}
        </>
      )}

      {/* Genre sections — only in "All" tab */}
      {showGenre && GENRE_SECTIONS.map(({ genre, label, emoji }) => {
        const titles = genreSections[genre];
        if (!titles || titles.length === 0) return null;
        return (
          <Section key={genre} title={`${emoji} ${label}`} count={`${titles.length}`} viewAllPath={`/search?q=${genre}&genre=${genre}`}>
            {titles.map(t => <Card key={t.id} title={t} />)}
          </Section>
        );
      })}

      {/* Fallback — empty state */}
      {top10.length === 0 && trending.length === 0 && recent.length === 0 && (
        <div className="px-5 py-20 text-center">
          <p className="text-5xl mb-5">🎬</p>
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
