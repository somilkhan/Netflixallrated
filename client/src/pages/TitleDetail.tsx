import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { getAnimeDetail } from '../lib/anilist';
import {
  searchAnime as anicrushSearch,
  getEpisodeCount as fetchAnicrushEpCount,
  getEmbedUrl as anicrushEmbed,
} from '../lib/anicrush';
import { SERVERS } from '../components/VideoPlayer';
import { InlineLoader } from '../components/GlassLoader';
import GlassCard from '../components/GlassCard';
import { navigateToAnime } from '../lib/animeResolve';
import '@/styles/MovieDetailPage.css';
import type { Tier } from '../components/RatingWidget';

const TIERS = [
  { id: 'SKIP',       label: 'Skip',       key: 'skip' },
  { id: 'TIMEPASS',   label: 'Timepass',   key: 'timepass' },
  { id: 'GO_FOR_IT',  label: 'Go for it',  key: 'goforit' },
  { id: 'PERFECTION', label: 'Perfection', key: 'perfection' },
] as const;

const TIER_LABEL: Record<string, string> = {
  SKIP: 'Skip', TIMEPASS: 'Timepass', GO_FOR_IT: 'Go for it', PERFECTION: 'Perfection',
};

/** Similar/Recommended TMDB card — resolves the TMDB item into the local
 * catalog on click and routes to the SAME unified /title/:id detail page. */
function RelatedTmdbCard({ item }: { item: any }) {
  const nav = useNavigate();
  const handleClick = async () => {
    try {
      const { id } = await api.titles.resolveTmdb(item.tmdbId, item.mediaType === 'movie' ? 'movie' : 'tv');
      nav(`/title/${id}`);
    } catch { /* best-effort — stay put on failure */ }
  };
  return (
    <GlassCard
      title={item.name}
      typeLabel={item.mediaType === 'movie' ? 'Movie' : 'Series'}
      year={item.year}
      posterUrl={item.posterUrl}
      onClick={handleClick}
    />
  );
}

/** AniList relation card — resolves the related anime into the local catalog
 * on click and routes to the SAME unified /title/:id detail page. */
function RelatedAnimeCard({ node }: { node: any }) {
  const nav = useNavigate();
  const handleClick = async () => {
    // Relation edges only carry id/title/format/coverImage — fetch the full
    // AniList record first so the created title gets real year/genres/synopsis
    // instead of placeholder defaults.
    try {
      const full = await getAnimeDetail({ id: node.id });
      await navigateToAnime(full ?? { id: node.id, title: node.title, coverImage: node.coverImage }, nav);
    } catch {
      await navigateToAnime({ id: node.id, title: node.title, coverImage: node.coverImage }, nav);
    }
  };
  return (
    <GlassCard
      title={node.title.english || node.title.romaji}
      typeLabel="Anime"
      posterUrl={node.coverImage?.extraLarge || node.coverImage?.large}
      onClick={handleClick}
    />
  );
}

export default function TitleDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const autoPlay = searchParams.get('play') === '1';

  const [title, setTitle] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [myTier, setMyTier] = useState<Tier | ''>('');
  const [review, setReview] = useState('');
  const [titleError, setTitleError] = useState(false);
  const [watchlistStatus, setWatchlistStatus] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Player
  const [isPlaying, setIsPlaying] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [serverId, setServerId] = useState(SERVERS[0].id);
  const [iframeKey, setIframeKey] = useState(0);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const animeVideoRef = useRef<HTMLDivElement>(null);

  // Season / episode — declared early so saveProgress can reference them
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEp, setSelectedEp] = useState(1);

  // ── Watch progress / history tracking ────────────────────────────────────
  // Iframes are cross-origin so we can't read currentTime.  We track wall-clock
  // seconds from the moment play starts and add them to the server-saved offset.
  const progressBaseRef  = useRef(0);   // seconds already saved before this session
  const playStartRef     = useRef<number | null>(null); // Date.now() when play started
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Returns total seconds watched so far (saved base + current session elapsed). */
  const currentPositionSeconds = useCallback(() => {
    const elapsed = playStartRef.current != null
      ? Math.floor((Date.now() - playStartRef.current) / 1000)
      : 0;
    return progressBaseRef.current + elapsed;
  }, []);

  /** Fire-and-forget save — never throws. */
  const saveProgress = useCallback((opts?: { completed?: boolean }) => {
    if (!user || !id || !title) return;
    const pos = currentPositionSeconds();
    api.history.save({
      titleId: id,
      positionSeconds: pos,
      durationSeconds: title.runtimeMinutes ? title.runtimeMinutes * 60 : undefined,
      seasonNumber:  title.type === 'SERIES' ? selectedSeason : undefined,
      episodeNumber: (title.type === 'SERIES' || title.type === 'ANIME') ? selectedEp : undefined,
      completed: opts?.completed,
    }).catch(() => {/* non-fatal */});
  }, [user, id, title, selectedSeason, selectedEp, currentPositionSeconds]);

  // Fetch saved progress when title + user are ready; restore season/ep for series
  useEffect(() => {
    if (!user || !id || !title) return;
    api.history.get(id)
      .then((prog: any) => {
        progressBaseRef.current = prog.positionSeconds ?? 0;
        if (title.type === 'SERIES' && prog.seasonNumber) setSelectedSeason(prog.seasonNumber);
        if ((title.type === 'SERIES' || title.type === 'ANIME') && prog.episodeNumber) setSelectedEp(prog.episodeNumber);
      })
      .catch(() => { progressBaseRef.current = 0; });
  }, [user, id, title]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start / stop the wall-clock timer whenever playback state changes
  useEffect(() => {
    if (isPlaying) {
      playStartRef.current = Date.now();
      // Save immediately on play start, then every 30 s
      saveProgress();
      progressTimerRef.current = setInterval(() => saveProgress(), 30_000);
    } else {
      if (playStartRef.current != null) {
        // Accumulate elapsed into base so next session starts from here
        progressBaseRef.current = currentPositionSeconds();
        playStartRef.current = null;
        saveProgress();
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    }
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save on unmount (covers tab close / navigation away)
  useEffect(() => {
    return () => {
      if (playStartRef.current != null) {
        progressBaseRef.current = currentPositionSeconds();
        playStartRef.current = null;
        saveProgress();
      }
    };
  }, [saveProgress, currentPositionSeconds]);

  // GogoAnime (consumet) — alternative anime source
  // 'anicrush' | 'gogoanime' = async providers; 'filmu' | 'screenscape-embed' = static TMDB-based
  const [animeProvider, setAnimeProvider] = useState<'anicrush' | 'gogoanime' | 'filmu' | 'screenscape-embed'>('anicrush');
  const [gogoAnimeId, setGogoAnimeId] = useState<string | null>(null);
  const [gogoEpCount, setGogoEpCount] = useState(0);
  const [gogoEpisodes, setGogoEpisodes] = useState<any[]>([]);
  const [gogoEmbedUrl, setGogoEmbedUrl] = useState<string | null>(null);
  const [gogoEmbedLoading, setGogoEmbedLoading] = useState(false);
  const [gogoError, setGogoError] = useState<string | null>(null);

  // FlixHQ (consumet) — alternative movie/TV source
  const [flixhqUrl, setFlixhqUrl] = useState<string | null>(null);
  const [flixhqLoading, setFlixhqLoading] = useState(false);
  const [flixhqError, setFlixhqError] = useState<string | null>(null);

  // FebBox (showbox) — alternative movie/TV source
  const [febboxUrl, setFebboxUrl] = useState<string | null>(null);
  const [febboxLoading, setFebboxLoading] = useState(false);
  const [febboxError, setFebboxError] = useState<string | null>(null);

  // 4kHDHub (ScreenScape) — alternative movie/TV source
  const [hubUrl, setHubUrl] = useState<string | null>(null);
  const [hubLoading, setHubLoading] = useState(false);
  const [hubError, setHubError] = useState<string | null>(null);

  // Monotonic request counters — guard against out-of-order async responses
  // when a user rapidly switches season/episode/server while a resolve is in flight.
  const flixhqReqRef = useRef(0);
  const febboxReqRef = useRef(0);
  const hdhubReqRef = useRef(0);
  const hubReqRef = useRef(0);

  // HDHub4u (ScreenScape) — download/watch source
  const [hdhubUrl, setHdhubUrl] = useState<string | null>(null);
  const [hdhubLoading, setHdhubLoading] = useState(false);
  const [hdhubError, setHdhubError] = useState<string | null>(null);

  // AniList metadata (anime only)
  const [anilistData, setAnilistData] = useState<any>(null);

  // Anicrush state (anime only)
  const [anicrushMovieId, setAnicrushMovieId] = useState<string | null>(null);
  const [anicrushEpCount, setAnicrushEpCount] = useState<number>(0);
  const [animeLoading, setAnimeLoading] = useState(false);
  const [animeError, setAnimeError] = useState<string | null>(null);
  const [animeEmbedUrl, setAnimeEmbedUrl] = useState<string | null>(null);
  const [animeEmbedLoading, setAnimeEmbedLoading] = useState(false);
  const embedReqRef = useRef(0);
  const gogoSearchReqRef = useRef(0);

  // TMDB Watch Providers (Netflix, Prime Video, Disney+, etc. — movie/TV only)
  const [watchProviders, setWatchProviders] = useState<{ flatrate: any[]; rent: any[]; buy: any[]; link: string | null } | null>(null);

  // Season / episode (SERIES only)
  const [seasons, setSeasons] = useState<any[]>([]);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [epSearch, setEpSearch] = useState('');
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const [epsLoading, setEpsLoading] = useState(false);

  // Topbar scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setTitle(null);
    setTitleError(false);
    // Fetch title and ratings in parallel (B: parallelize independent requests)
    Promise.all([
      api.titles.get(id),
      api.titles.ratings(id).catch(() => []),
    ]).then(([data, ratingData]) => {
      if (cancelled) return;
      setTitle(data);
      setRatings(ratingData);
    }).catch(() => { if (!cancelled) setTitleError(true); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!title || title.type !== 'SERIES' || !id) return;
    let cancelled = false;
    setSeasonsLoading(true);
    api.titles.seasons(id)
      .then((data) => { if (!cancelled) setSeasons(data); })
      .catch(() => { if (!cancelled) setSeasons([]); })
      .finally(() => { if (!cancelled) setSeasonsLoading(false); });
    return () => { cancelled = true; };
  }, [title, id]);

  useEffect(() => {
    if (!title || title.type !== 'SERIES' || !id) return;
    let cancelled = false;
    setEpsLoading(true);
    setEpisodes([]);
    setSelectedEp(1);
    api.titles.episodes(id, selectedSeason)
      .then((data) => { if (!cancelled) setEpisodes(data); })
      .catch(() => { if (!cancelled) setEpisodes([]); })
      .finally(() => { if (!cancelled) setEpsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedSeason, title, id]);

  // FlixHQ auto-resolve — fires when FlixHQ server is selected for movies/TV
  useEffect(() => {
    if (!title || title.type === 'ANIME' || serverId !== 'flixhq') return;
    const reqId = ++flixhqReqRef.current;
    setFlixhqUrl(null);
    setFlixhqError(null);
    setFlixhqLoading(true);
    api.consumet.moviesAuto(title.name, title.type, selectedSeason, selectedEp)
      .then((data: any) => {
        if (reqId !== flixhqReqRef.current) return;
        if (data?.playerUrl) setFlixhqUrl(data.playerUrl);
        else setFlixhqError('No stream found via FlixHQ');
      })
      .catch((err: any) => {
        if (reqId !== flixhqReqRef.current) return;
        setFlixhqError(err?.message || 'FlixHQ failed to load — try another server');
      })
      .finally(() => {
        if (reqId === flixhqReqRef.current) setFlixhqLoading(false);
      });
  }, [serverId, title, selectedSeason, selectedEp]);

  // FebBox auto-resolve — fires when FebBox server is selected for movies/TV
  useEffect(() => {
    if (!title || title.type === 'ANIME' || serverId !== 'febbox' || !title.tmdbId) return;
    const reqId = ++febboxReqRef.current;
    setFebboxUrl(null);
    setFebboxError(null);
    setFebboxLoading(true);
    api.showbox.link(
      String(title.tmdbId),
      title.type === 'MOVIE' ? 'movie' : 'tv',
      selectedSeason,
      selectedEp,
      title.name,
    )
      .then((data: any) => {
        if (reqId !== febboxReqRef.current) return;
        if (data?.embedUrl) setFebboxUrl(data.embedUrl);
        else setFebboxError('FebBox stream not available for this title');
      })
      .catch((err: any) => {
        if (reqId !== febboxReqRef.current) return;
        setFebboxError(err?.message || 'FebBox lookup failed — try another server');
      })
      .finally(() => {
        if (reqId === febboxReqRef.current) setFebboxLoading(false);
      });
  }, [serverId, title, selectedSeason, selectedEp]);

  // HDHub4u auto-resolve — fires when HDHub4u server is selected for movies/TV
  useEffect(() => {
    if (!title || title.type === 'ANIME' || serverId !== 'hdhub4u') return;
    const reqId = ++hdhubReqRef.current;
    setHdhubUrl(null);
    setHdhubError(null);
    setHdhubLoading(true);
    api.screenscape.hdhub4uResolve(title.name)
      .then((data: any) => {
        if (reqId !== hdhubReqRef.current) return;
        const url = data?.streamUrl ?? data?.embedUrl ?? null;
        if (url) setHdhubUrl(url);
        else setHdhubError('HDHub4u content not available for this title');
      })
      .catch((err: any) => {
        if (reqId !== hdhubReqRef.current) return;
        setHdhubError(err?.message || 'HDHub4u lookup failed — try another server');
      })
      .finally(() => {
        if (reqId === hdhubReqRef.current) setHdhubLoading(false);
      });
  }, [serverId, title]);

  // 4kHDHub auto-resolve — fires when 4kHDHub server is selected for movies/TV
  useEffect(() => {
    if (!title || title.type === 'ANIME' || serverId !== '4khdhub') return;
    const reqId = ++hubReqRef.current;
    setHubUrl(null);
    setHubError(null);
    setHubLoading(true);
    api.screenscape.resolve(
      title.name,
      title.type === 'MOVIE' ? 'movie' : 'tv',
      selectedSeason,
      selectedEp,
    )
      .then((data: any) => {
        if (reqId !== hubReqRef.current) return;
        const url = data?.embedUrl ?? data?.streamUrl ?? null;
        if (url) setHubUrl(url);
        else setHubError('4kHDHub stream not available for this title');
      })
      .catch((err: any) => {
        if (reqId !== hubReqRef.current) return;
        setHubError(err?.message || '4kHDHub lookup failed — try another server');
      })
      .finally(() => {
        if (reqId === hubReqRef.current) setHubLoading(false);
      });
  }, [serverId, title, selectedSeason, selectedEp]);

  // B: Parallelize watch-providers + similar + recommendations + anilist — all independent
  useEffect(() => {
    if (!title || !id) return;
    let cancelled = false;

    // Watch providers (needs tmdbId)
    if (title.tmdbId) {
      api.titles.watchProviders(id)
        .then((data) => { if (!cancelled) setWatchProviders(data); })
        .catch(() => { if (!cancelled) setWatchProviders(null); });
    } else {
      setWatchProviders(null);
    }

    // Similar + recommendations (needs tmdbId) — fired in parallel
    if (title.tmdbId) {
      api.titles.similar(id)
        .then((data) => { if (!cancelled) setSimilarTitles(data); })
        .catch(() => { if (!cancelled) setSimilarTitles([]); });
      api.titles.recommendations(id)
        .then((data) => { if (!cancelled) setRecommendedTitles(data); })
        .catch(() => { if (!cancelled) setRecommendedTitles([]); });
    } else {
      setSimilarTitles([]);
      setRecommendedTitles([]);
    }

    // AniList metadata (anime only) — fired in parallel
    if (title.type === 'ANIME') {
      setAnilistData(null);
      getAnimeDetail(title.anilistId ? { id: title.anilistId } : { name: title.name })
        .then((data) => { if (!cancelled && data) setAnilistData(data); })
        .catch(() => {});
    }

    return () => { cancelled = true; };
  }, [title, id]);

  // Recommendations / Similar titles state (declared here for use below)
  const [similarTitles, setSimilarTitles] = useState<any[]>([]);
  const [recommendedTitles, setRecommendedTitles] = useState<any[]>([]);

  useEffect(() => {
    if (!title || title.type !== 'ANIME') return;
    setAnicrushMovieId(null);
    setAnicrushEpCount(0);
    setAnimeError(null);
    setAnimeEmbedUrl(null);
    setAnimeLoading(true);
    // Default to gogoanime so the auto-switch logic below fires correctly
    // when anicrush is unreachable (Cloudflare CORS block).
    setAnimeProvider('anicrush');

    const controller = new AbortController();
    const { signal } = controller;

    const run = async () => {
      try {
        // Call anicrush directly from the browser — bypasses Cloudflare's
        // datacenter IP block that affects server-side proxy requests (521).
        const movies = await anicrushSearch(title.name);
        if (signal.aborted) return;

        if (!movies.length) throw new Error('Not found on Anicrush');

        const movieId: string = movies[0].id;
        setAnicrushMovieId(movieId);

        const count = await fetchAnicrushEpCount(movieId);
        if (signal.aborted) return;
        setAnicrushEpCount(count || movies[0].totalEpisodes || 0);
        setSelectedEp(1);
      } catch (err: any) {
        if (err?.name === 'AbortError' || signal.aborted) return;
        // E: Don't show anicrush error as a hard failure — GogoAnime runs in
        // parallel and the auto-switch below will flip the provider.
        // Only surface the error if GogoAnime also has nothing.
        setAnimeError(null);
      } finally {
        if (!signal.aborted) setAnimeLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [title]);

  // Auto-switch to GogoAnime once Anicrush resolution finishes without a match.
  // Anicrush is currently unreachable (Cloudflare CORS), so this ensures the
  // user always sees a working provider when GogoAnime has the title.
  useEffect(() => {
    if (!title || title.type !== 'ANIME') return;
    if (!animeLoading && !anicrushMovieId && animeProvider === 'anicrush') {
      if (gogoAnimeId) {
        setAnimeProvider('gogoanime');
      } else if (title.tmdbId) {
        // Both async providers failed — fall back to a static TMDB embed
        setAnimeProvider('filmu');
      }
    }
  }, [title, animeLoading, anicrushMovieId, gogoAnimeId, animeProvider]);

  // GogoAnime/Hianime search — runs in background when an anime title loads; resets stale state first
  useEffect(() => {
    if (!title || title.type !== 'ANIME') return;
    // Reset so stale data from a previous title never bleeds through
    setGogoAnimeId(null);
    setGogoEpCount(0);
    setGogoEpisodes([]);
    setGogoEmbedUrl(null);
    setGogoError(null);
    const reqId = ++gogoSearchReqRef.current;

    // Try multiple name variants: prefer English title from anilist, then romaji, then stored name
    const searchName = title.name;
    api.consumet.animeSearch(searchName)
      .then((data: any) => {
        if (gogoSearchReqRef.current !== reqId) return; // stale — a newer title navigated in
        const results: any[] = data?.results ?? [];
        if (!results.length) {
          setGogoError('Not found on GogoAnime — try another source');
          return;
        }
        // Pick the best match (exact title match first, then first result)
        const exact = results.find((r: any) =>
          r.title?.toLowerCase() === searchName.toLowerCase()
        );
        const result = exact ?? results[0];
        setGogoAnimeId(result.id);
        api.consumet.animeInfo(result.id)
          .then((info: any) => {
            if (gogoSearchReqRef.current !== reqId) return;
            const eps: any[] = info.episodes ?? [];
            setGogoEpCount(info.totalEpisodes ?? eps.length ?? 0);
            // Normalise episode objects: ensure .number field exists
            const normalised = eps.map((e: any, i: number) => ({
              ...e,
              number: e.number ?? e.episode ?? (i + 1),
            }));
            setGogoEpisodes(normalised);
          })
          .catch((err: any) => {
            if (gogoSearchReqRef.current !== reqId) return;
            setGogoError(err?.message || 'Failed to load episode list');
          });
      })
      .catch((err: any) => {
        if (gogoSearchReqRef.current !== reqId) return;
        setGogoError(err?.message || 'GogoAnime search failed');
      });
  }, [title]);

  const getEmbedUrl = useCallback(() => {
    if (!title) return null;
    if (title.type === 'ANIME') {
      if (animeProvider === 'gogoanime') return gogoEmbedUrl;
      if (animeProvider === 'anicrush') return animeEmbedUrl;
      // Static TMDB-based embed providers (Filmu, Screenscape)
      if (title.tmdbId) {
        const server = SERVERS.find(s => s.id === animeProvider);
        if (server) return server.getUrl(title.tmdbId, 'ANIME', 1, selectedEp);
      }
      return animeEmbedUrl; // fallback to anicrush url if no tmdbId
    }
    if (!title.tmdbId) return null;
    if (serverId === 'flixhq') return flixhqUrl;
    if (serverId === 'febbox') return febboxUrl;
    if (serverId === '4khdhub') return hubUrl;
    if (serverId === 'hdhub4u') return hdhubUrl;
    const server = SERVERS.find(s => s.id === serverId) || SERVERS[0];
    return server.getUrl(title.tmdbId, title.type, selectedSeason, selectedEp);
  }, [title, serverId, selectedSeason, selectedEp, animeEmbedUrl, animeProvider, gogoEmbedUrl, flixhqUrl, febboxUrl, hubUrl, hdhubUrl]);

  const openAnimePlayer = useCallback(async (ep?: number) => {
    const epNum = ep ?? selectedEp;
    if (!anicrushMovieId) return;
    const bounded = anicrushEpCount > 0
      ? Math.min(Math.max(1, epNum), anicrushEpCount)
      : Math.max(1, epNum);

    const reqId = ++embedReqRef.current;
    setSelectedEp(bounded);
    setAnimeEmbedUrl(null);
    setAnimeError(null);
    setAnimeEmbedLoading(true);

    try {
      const data = await anicrushEmbed(anicrushMovieId, bounded);
      if (embedReqRef.current !== reqId) return;
      setAnimeEmbedUrl(data.embedUrl);
      setIsIframeLoading(true);
      setIsPlaying(true);
      setTimeout(() => animeVideoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (err: any) {
      if (embedReqRef.current !== reqId) return;
      setAnimeError(err.message || 'Failed to load episode');
    } finally {
      if (embedReqRef.current === reqId) setAnimeEmbedLoading(false);
    }
  }, [anicrushMovieId, anicrushEpCount, selectedEp]);

  const openPlayer = useCallback((ep?: number) => {
    if (ep !== undefined) setSelectedEp(ep);
    setIsIframeLoading(true);
    setIsPlaying(true);
    setTimeout(() => videoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }, []);

  /** Fetch a GogoAnime stream URL from consumet and open the HLS player iframe */
  const openGogoPlayer = useCallback(async (ep?: number) => {
    const epNum = ep ?? selectedEp;
    if (!gogoAnimeId) { setGogoError('GogoAnime not available for this title'); return; }
    // If episodes haven't loaded yet, try animeInfo first
    let episodes = gogoEpisodes;
    if (episodes.length === 0) {
      try {
        const info: any = await api.consumet.animeInfo(gogoAnimeId);
        const eps: any[] = info.episodes ?? [];
        const normalised = eps.map((e: any, i: number) => ({
          ...e,
          number: e.number ?? e.episode ?? (i + 1),
        }));
        setGogoEpisodes(normalised);
        setGogoEpCount(info.totalEpisodes ?? normalised.length);
        episodes = normalised;
      } catch (err: any) {
        setGogoError(err?.message || 'Failed to load episode list');
        return;
      }
    }

    // Find episode by number field (normalised above), fallback to index
    const gogoEp = episodes.find((e: any) => Number(e.number) === epNum)
      ?? episodes[epNum - 1]
      ?? episodes[0];
    if (!gogoEp) { setGogoError(`Episode ${epNum} not found`); return; }

    setGogoEmbedLoading(true);
    setGogoEmbedUrl(null);
    setGogoError(null);
    try {
      const data = await api.consumet.animeStream(gogoEp.id);
      const sources: any[] = data.sources ?? [];
      // Prefer M3U8, then highest quality, then first available
      const m3u8 = sources.find((s: any) => s.isM3U8) ?? sources[0];
      if (!m3u8?.url) throw new Error('No stream source returned by server');
      const url = api.consumet.playerUrl(m3u8.url, data.headers?.Referer ?? '');
      setGogoEmbedUrl(url);
      setIsIframeLoading(true);
      setIsPlaying(true);
      setTimeout(() => animeVideoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (err: any) {
      setGogoError(err.message ?? 'Stream failed — try another source');
    } finally {
      setGogoEmbedLoading(false);
    }
  }, [gogoAnimeId, gogoEpisodes, selectedEp]);

  const switchServer = (sid: string) => {
    setServerId(sid);
    setIframeKey(k => k + 1);
    setIframeError(false);
    setIsIframeLoading(true);
    setIsPlaying(true);
    setTimeout(() => videoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleClosePlayer = () => {
    setIsPlaying(false);
    setIsIframeLoading(false);
    setIframeError(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: title?.name || '', url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  };

  const animePrev = useCallback(() => {
    openAnimePlayer(Math.max(1, selectedEp - 1));
  }, [selectedEp, openAnimePlayer]);

  const animeNext = useCallback(() => {
    if (anicrushEpCount > 0 && selectedEp >= anicrushEpCount) return;
    openAnimePlayer(selectedEp + 1);
  }, [selectedEp, anicrushEpCount, openAnimePlayer]);

  const submitRating = async () => {
    if (!myTier || !id) return;
    setRatingSubmitting(true);
    try {
      await api.titles.rate(id, { tier: myTier, reviewText: review || undefined });
      setRatings(await api.titles.ratings(id));
    } finally { setRatingSubmitting(false); }
  };

  const addToWatchlist = async (status: string) => {
    if (!id) return;
    await api.watchlist.add({ titleId: id, status });
    setWatchlistStatus(status);
  };

  // A: Auto-open player when navigated with ?play=1 (fired once, after title loads)
  const autoPlayFiredRef = useRef(false);
  useEffect(() => {
    if (!title || !autoPlay || autoPlayFiredRef.current) return;
    autoPlayFiredRef.current = true;
    if (title.type !== 'ANIME') {
      // Non-anime: open the video player directly
      setIsIframeLoading(true);
      setIsPlaying(true);
      setTimeout(() => videoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
    // Anime: let the provider-resolve effects run first; user presses Watch in the episode section
  }, [title, autoPlay]);

  if (titleError) return (
    <div style={{ minHeight: '100vh', background: '#090909', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', padding: '0 20px' }}>
        <p style={{ marginBottom: 16 }}>This title couldn't be found or failed to load.</p>
        <button
          onClick={() => navigate('/')}
          className="dp-btn dp-btn-save"
          style={{ padding: '10px 20px', borderRadius: 8 }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );

  if (!title) return (
    <div style={{ minHeight: '100vh', background: '#090909' }}>
      <InlineLoader label="Loading title…" minHeight={window.innerHeight ? window.innerHeight - 80 : 600} />
    </div>
  );

  const embedUrl = getEmbedUrl();
  const isStaticAnimeProvider = animeProvider === 'filmu' || animeProvider === 'screenscape-embed';
  const canPlay = title.type === 'ANIME'
    ? (!!anicrushMovieId && !animeLoading) || !!gogoAnimeId || !!title.tmdbId
    : !!title.tmdbId;

  const posterUrl = title.posterUrl
    || (title.type === 'ANIME' ? (anilistData?.coverImage?.extraLarge || anilistData?.coverImage?.large) : null);
  const backdropUrl = title.backdropUrl
    || (title.type === 'ANIME' ? anilistData?.bannerImage : null);
  const displayName = title.type === 'ANIME' && anilistData
    ? (anilistData.title.english || anilistData.title.romaji)
    : title.name;
  const genres: string[] = title.genres?.length > 0
    ? title.genres
    : (anilistData?.genres || []);
  const synopsis = title.synopsis
    || (title.type === 'ANIME'
      ? anilistData?.description?.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
      : null);
  const typeLabel = title.type === 'ANIME' ? 'Anime'
    : title.type === 'SERIES' ? 'TV Series'
    : 'Movie';

  const topTier = ratings.length > 0
    ? TIERS.reduce((best, t) => {
        const c = ratings.filter(r => r.tier === t.id).length;
        const b = ratings.filter(r => r.tier === best.id).length;
        return c > b ? t : best;
      }, TIERS[0]).label
    : null;

  const filteredEps = episodes.filter(e =>
    !epSearch ||
    String(e.episodeNumber).includes(epSearch) ||
    e.name.toLowerCase().includes(epSearch.toLowerCase())
  );

  const heroBgStyle = backdropUrl
    ? {
        backgroundImage: `radial-gradient(ellipse 120% 90% at 30% 10%, rgba(196,72,90,0.12), transparent 55%), url(${backdropUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 30%',
      }
    : {
        background: `radial-gradient(90% 70% at 30% 0%, ${title.posterColorFrom || '#4a1520'}, ${title.posterColorTo || '#0c0a0a'} 80%)`,
      };

  return (
    <div className="movie-detail-page">

      {/* ── Topbar ───────────────────────────────────────────────── */}
      <header className={`detail-topbar${scrolled ? ' scrolled' : ''}`}>
        <button className="detail-back-btn" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="detail-brand">ALLRATED</span>
        <div style={{ width: 36 }} />
      </header>

      {/* ── Hero — trailer or backdrop ───────────────────────────── */}
      {/* D: trailer is constrained inside .hero (height 40-75vh, overflow:hidden)  */}
      {/*    The iframe uses cover-scaling CSS (.hero-trailer) so it fills the box   */}
      {/*    without overflowing. No giant full-bleed YouTube embed.                 */}
      <div className="hero">
        {title.trailerYoutubeId ? (
          <iframe
            className="hero-trailer"
            src={`https://www.youtube-nocookie.com/embed/${title.trailerYoutubeId}?autoplay=1&mute=1&loop=1&playlist=${title.trailerYoutubeId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1`}
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
            title="Trailer"
          />
        ) : (
          <div className="hero-bg" style={heroBgStyle} />
        )}
        <div className="hero-gradient" />
        <div className="hero-noise" />
        {/* Play button on hero only for ANIME (async embed fetch) */}
        {title.type === 'ANIME' && canPlay && !(animeProvider === 'gogoanime' ? gogoEmbedLoading : (isStaticAnimeProvider ? false : animeEmbedLoading)) && (
          <button
            className="play-overlay-btn"
            onClick={() => {
              if (animeProvider === 'gogoanime') openGogoPlayer();
              else if (isStaticAnimeProvider) {
                setIsIframeLoading(true);
                setIframeError(false);
                setIsPlaying(true);
                setTimeout(() => animeVideoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
              } else openAnimePlayer();
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <polygon points="8,5 8,19 19,12" />
            </svg>
          </button>
        )}
        {title.type === 'ANIME' && !isStaticAnimeProvider && (animeProvider === 'gogoanime' ? gogoEmbedLoading : animeEmbedLoading) && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
            <div style={{ width: 40, height: 40, border: '2px solid rgba(245,240,236,0.12)', borderTopColor: '#C4485A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}
      </div>

      {/* ── Shell ────────────────────────────────────────────────── */}
      <div className="detail-shell">

        {/* Poster row */}
        <div className="poster-row">
          <div
            className="detail-poster"
            style={{
              backgroundImage: posterUrl
                ? `url(${posterUrl})`
                : `radial-gradient(120% 100% at 30% 0%, ${title.posterColorFrom || '#4a1520'}, ${title.posterColorTo || '#0c0a0a'} 70%)`,
            }}
          />
          <div className="title-block">
            <div className="eyebrow">{typeLabel}</div>
          </div>
        </div>

        {/* Title */}
        <h1 className="detail-title">{displayName}</h1>
        {title.type === 'ANIME' && anilistData?.title.romaji && anilistData.title.english && (
          <p className="detail-subtitle">{anilistData.title.romaji}</p>
        )}

        {/* Meta */}
        <div className="detail-meta">
          <span>{title.year || anilistData?.startDate?.year}</span>
          <span className="dot">·</span>
          <span>{typeLabel}</span>
          {title.type === 'ANIME' && anicrushEpCount > 0 && (
            <><span className="dot">·</span><span>{anicrushEpCount} eps</span></>
          )}
          {title.type !== 'ANIME' && title.runtimeMinutes && (
            <><span className="dot">·</span>
            <span>{Math.floor(title.runtimeMinutes / 60)}h {title.runtimeMinutes % 60}m</span></>
          )}
          {title.type === 'ANIME' && anilistData?.averageScore && (
            <><span className="dot">·</span><span>★ {(anilistData.averageScore / 10).toFixed(1)}</span></>
          )}
          {title.type === 'ANIME' && anilistData?.status && (
            <><span className="dot">·</span><span className="capitalize">{anilistData.status.toLowerCase().replace(/_/g, ' ')}</span></>
          )}
          {title.type === 'ANIME' && anilistData?.season && anilistData?.seasonYear && (
            <><span className="dot">·</span><span className="capitalize">{anilistData.season.toLowerCase()} {anilistData.seasonYear}</span></>
          )}
          {genres.slice(0, 3).map(g => (
            <span key={g} className="dp-pill">{g}</span>
          ))}
        </div>

        {/* Anime-only: studios */}
        {title.type === 'ANIME' && anilistData?.studios?.nodes?.length > 0 && (
          <p className="font-mono text-[10px] text-ink-faint uppercase tracking-wider" style={{ marginTop: -4, marginBottom: 10 }}>
            {anilistData.studios.nodes.map((s: any) => s.name).join(' · ')}
          </p>
        )}

        {/* Synopsis */}
        {synopsis && <p className="synopsis">{synopsis}</p>}

        {/* CTA Buttons */}
        <div className="detail-actions">
          {canPlay && (
            <button
              className="dp-btn dp-btn-play"
              onClick={() => {
                if (title.type !== 'ANIME') { openPlayer(); return; }
                if (animeProvider === 'gogoanime') { openGogoPlayer(); return; }
                if (isStaticAnimeProvider) {
                  setIsIframeLoading(true);
                  setIframeError(false);
                  setIsPlaying(true);
                  setTimeout(() => animeVideoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                  return;
                }
                openAnimePlayer();
              }}
              disabled={!isStaticAnimeProvider && (animeProvider === 'gogoanime' ? gogoEmbedLoading : animeEmbedLoading)}
              style={{ flex: '0 0 auto', minWidth: 110 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="8,5 8,19 19,12" />
              </svg>
              {!isStaticAnimeProvider && (animeProvider === 'gogoanime' ? gogoEmbedLoading : animeEmbedLoading) ? 'Loading…' : 'Play'}
            </button>
          )}
          {user && (
            <button
              className={`dp-btn dp-btn-save${watchlistStatus ? ' saved' : ''}`}
              onClick={() => addToWatchlist(watchlistStatus ? '' : 'PLAN_TO_WATCH')}
            >
              {watchlistStatus ? (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Saved</>
              ) : (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Save</>
              )}
            </button>
          )}
          <button className="dp-btn dp-btn-ghost" onClick={handleShare}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Share
          </button>
        </div>

        {/* Anime loading / error state */}
        {title.type === 'ANIME' && animeLoading && (
          <div className="anime-status pulse">Resolving anime source…</div>
        )}
        {title.type === 'ANIME' && animeError && !animeLoading && (
          <div className="anime-status error">{animeError}</div>
        )}

        {/* ── Watch section — Movie / Series ───────────────────── */}
        {title.type !== 'ANIME' && canPlay && (
          <div ref={videoSectionRef} className="watch-section">

            {/* Provider tabs */}
            <div className="provider-tabs">
              {SERVERS.map(srv => (
                <button
                  key={srv.id}
                  className={`provider-tab${isPlaying && serverId === srv.id ? ' active' : ''}`}
                  onClick={() => switchServer(srv.id)}
                >
                  <span className="status-dot" />
                  {srv.label}
                  {(srv.id === 'flixhq' && flixhqLoading && serverId === 'flixhq') ||
                   (srv.id === 'febbox' && febboxLoading && serverId === 'febbox') ||
                   (srv.id === '4khdhub' && hubLoading && serverId === '4khdhub') ||
                   (srv.id === 'hdhub4u' && hdhubLoading && serverId === 'hdhub4u')
                    ? <span className="quality-badge">…</span>
                    : <span className="quality-badge">4K</span>}
                </button>
              ))}
            </div>

            {/* FlixHQ error message */}
            {serverId === 'flixhq' && !flixhqLoading && flixhqError && (
              <div className="anime-status error" style={{ marginBottom: 10 }}>{flixhqError}</div>
            )}

            {/* FebBox error message */}
            {serverId === 'febbox' && !febboxLoading && febboxError && (
              <div className="anime-status error" style={{ marginBottom: 10 }}>{febboxError}</div>
            )}

            {/* 4kHDHub error message */}
            {serverId === '4khdhub' && !hubLoading && hubError && (
              <div className="anime-status error" style={{ marginBottom: 10 }}>{hubError}</div>
            )}

            {/* HDHub4u error message */}
            {serverId === 'hdhub4u' && !hdhubLoading && hdhubError && (
              <div className="anime-status error" style={{ marginBottom: 10 }}>{hdhubError}</div>
            )}

            {/* Video container */}
            <div className="video-wrap">
              {/* Play placeholder — shown before any tab is clicked */}
              {!isPlaying && (
                <button
                  className="video-placeholder"
                  onClick={() => {
                    setIsIframeLoading(true);
                    setIframeError(false);
                    setIsPlaying(true);
                  }}
                >
                  <div className="video-placeholder-ring">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                      <polygon points="8,5 8,19 19,12" />
                    </svg>
                  </div>
                  <span className="video-placeholder-hint">Choose a source above or tap to play</span>
                </button>
              )}

              {/* Loading skeleton */}
              {isPlaying && (
                <div className={`video-skeleton${!isIframeLoading ? ' hidden' : ''}`}>
                  <div className="skeleton-spinner" />
                  <div className="skeleton-text">Loading source…</div>
                </div>
              )}

              {/* Error overlay */}
              {isPlaying && (
                <div className={`video-error${iframeError ? ' show' : ''}`}>
                  <div className="error-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div className="error-title">Source unavailable</div>
                  <div className="error-desc">This provider isn't responding. Try another source from the tabs above.</div>
                  <button className="error-retry" onClick={() => {
                    setIframeError(false);
                    setIsIframeLoading(true);
                    setIframeKey(k => k + 1);
                  }}>Retry</button>
                </div>
              )}

              {/* The actual iframe */}
              {isPlaying && !iframeError && (
                <iframe
                  key={`${serverId}-${selectedSeason}-${selectedEp}-${iframeKey}`}
                  src={embedUrl || ''}
                  allowFullScreen
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  referrerPolicy="no-referrer"
                  title={title.name}
                  onLoad={() => setIsIframeLoading(false)}
                  onError={() => { setIsIframeLoading(false); setIframeError(true); }}
                  style={{ opacity: isIframeLoading ? 0 : 1 }}
                />
              )}
            </div>

            {/* Player footer */}
            {isPlaying && (
              <div className="player-footer">
                <div className="player-meta">
                  <span className="player-meta-label">
                    {title.type === 'SERIES' ? `S${selectedSeason} · E${selectedEp}` : 'Movie'}
                  </span>
                  <div className="player-meta-divider" />
                  <span className="player-source-name">
                    {SERVERS.find(s => s.id === serverId)?.label ?? 'VidSrc'}
                  </span>
                </div>
                <div className="player-actions">
                  <button
                    className="player-action-btn"
                    title="Reload"
                    onClick={() => { setIframeError(false); setIsIframeLoading(true); setIframeKey(k => k + 1); }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polyline points="23 4 23 10 17 10"/>
                      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
                    </svg>
                  </button>
                  <button
                    className="player-action-btn"
                    title="Close player"
                    onClick={handleClosePlayer}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── ANIME: source + episode controls ─────────────────── */}
        {/* E: Show episode section even while anicrush loads if gogoanime or tmdbId is ready */}
        {title.type === 'ANIME' && (anicrushMovieId || gogoAnimeId || title.tmdbId) && (
          <div ref={animeVideoRef} className="dp-section">
            <div className="dp-section-head">
              <span className="dp-section-title">Watch Episode</span>
              {(!isStaticAnimeProvider && (animeProvider === 'anicrush' ? anicrushEpCount : gogoEpCount) > 0) && (
                <span className="dp-section-count">
                  {animeProvider === 'anicrush' ? anicrushEpCount : gogoEpCount} eps
                </span>
              )}
            </div>

            {/* Provider toggle */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {anicrushMovieId && (
                <button
                  className={`provider-tab${animeProvider === 'anicrush' ? ' active' : ''}`}
                  onClick={() => { setAnimeProvider('anicrush'); setIsPlaying(false); setIframeError(false); }}
                >
                  <span className="status-dot" />Anicrush<span className="quality-badge">HD</span>
                </button>
              )}
              {gogoAnimeId && (
                <button
                  className={`provider-tab${animeProvider === 'gogoanime' ? ' active' : ''}`}
                  onClick={() => { setAnimeProvider('gogoanime'); setIsPlaying(false); setIframeError(false); }}
                >
                  <span className="status-dot" />GogoAnime<span className="quality-badge">HD</span>
                </button>
              )}
              {title.tmdbId && (
                <>
                  <button
                    className={`provider-tab${animeProvider === 'filmu' ? ' active' : ''}`}
                    onClick={() => {
                      setAnimeProvider('filmu');
                      setIsIframeLoading(true);
                      setIframeError(false);
                      setIsPlaying(true);
                      setTimeout(() => animeVideoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                    }}
                  >
                    <span className="status-dot" />Filmu<span className="quality-badge">4K</span>
                  </button>
                  <button
                    className={`provider-tab${animeProvider === 'screenscape-embed' ? ' active' : ''}`}
                    onClick={() => {
                      setAnimeProvider('screenscape-embed');
                      setIsIframeLoading(true);
                      setIframeError(false);
                      setIsPlaying(true);
                      setTimeout(() => animeVideoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                    }}
                  >
                    <span className="status-dot" />Screenscape<span className="quality-badge">4K</span>
                  </button>
                </>
              )}
            </div>

            {/* Episode row */}
            <div className="anime-ep-row">
              <button
                className="ep-nav-btn"
                onClick={() => {
                  const prev = Math.max(1, selectedEp - 1);
                  setSelectedEp(prev);
                  if (isStaticAnimeProvider) {
                    setIframeKey(k => k + 1);
                  } else if (animeProvider === 'gogoanime') {
                    openGogoPlayer(prev);
                  } else {
                    animePrev();
                  }
                }}
                disabled={selectedEp <= 1}
              >‹</button>
              <span className="ep-label">Ep {selectedEp}</span>
              <button
                className="ep-nav-btn"
                onClick={() => {
                  const epCount = animeProvider === 'anicrush' ? anicrushEpCount : gogoEpCount;
                  if (!isStaticAnimeProvider && epCount > 0 && selectedEp >= epCount) return;
                  const next = selectedEp + 1;
                  setSelectedEp(next);
                  if (isStaticAnimeProvider) {
                    setIframeKey(k => k + 1);
                  } else if (animeProvider === 'gogoanime') {
                    openGogoPlayer(next);
                  } else {
                    animeNext();
                  }
                }}
                disabled={
                  isStaticAnimeProvider ? false
                  : animeProvider === 'anicrush'
                    ? anicrushEpCount > 0 && selectedEp >= anicrushEpCount
                    : gogoEpCount > 0 && selectedEp >= gogoEpCount
                }
              >›</button>
              {!isStaticAnimeProvider && (
                <button
                  className="dp-btn dp-btn-play"
                  style={{ flex: '0 0 auto' }}
                  onClick={() => {
                    if (animeProvider === 'gogoanime') openGogoPlayer();
                    else openAnimePlayer();
                  }}
                  disabled={animeProvider === 'gogoanime' ? gogoEmbedLoading : animeEmbedLoading}
                >
                  {(animeProvider === 'gogoanime' ? gogoEmbedLoading : animeEmbedLoading) ? 'Loading…' : '▶ Watch'}
                </button>
              )}
            </div>

            {/* GogoAnime error */}
            {animeProvider === 'gogoanime' && gogoError && (
              <div className="anime-status error" style={{ marginTop: 10 }}>{gogoError}</div>
            )}

            {/* ── Inline player for ALL anime providers ─────────── */}
            {isPlaying && embedUrl && (
              <div className="video-wrap" style={{ marginTop: 16 }}>
                {/* Loading skeleton */}
                <div className={`video-skeleton${!isIframeLoading ? ' hidden' : ''}`}>
                  <div className="skeleton-spinner" />
                  <div className="skeleton-text">Loading source…</div>
                </div>

                {/* Error overlay */}
                <div className={`video-error${iframeError ? ' show' : ''}`}>
                  <div className="error-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div className="error-title">Source unavailable</div>
                  <div className="error-desc">This provider isn't responding. Try another source above.</div>
                  <button className="error-retry" onClick={() => {
                    setIframeError(false);
                    setIsIframeLoading(true);
                    setIframeKey(k => k + 1);
                  }}>Retry</button>
                </div>

                {/* The iframe */}
                {!iframeError && (
                  <iframe
                    key={`anime-${animeProvider}-${selectedEp}-${iframeKey}`}
                    src={embedUrl}
                    allowFullScreen
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    referrerPolicy="no-referrer"
                    title={title.name}
                    onLoad={() => setIsIframeLoading(false)}
                    onError={() => { setIsIframeLoading(false); setIframeError(true); }}
                    style={{ opacity: isIframeLoading ? 0 : 1 }}
                  />
                )}
              </div>
            )}

            {/* Player footer when playing */}
            {isPlaying && embedUrl && (
              <div className="player-footer" style={{ marginTop: 8 }}>
                <div className="player-meta">
                  <span className="player-meta-label">Episode {selectedEp}</span>
                  <div className="player-meta-divider" />
                  <span className="player-source-name">
                    {animeProvider === 'anicrush' ? 'Anicrush'
                      : animeProvider === 'gogoanime' ? 'GogoAnime'
                      : animeProvider === 'filmu' ? 'Filmu'
                      : 'Screenscape'}
                  </span>
                </div>
                <div className="player-actions">
                  <button
                    className="player-action-btn"
                    title="Reload"
                    onClick={() => { setIframeError(false); setIsIframeLoading(true); setIframeKey(k => k + 1); }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polyline points="23 4 23 10 17 10"/>
                      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
                    </svg>
                  </button>
                  <button
                    className="player-action-btn"
                    title="Close player"
                    onClick={() => { setIsPlaying(false); setIsIframeLoading(false); setIframeError(false); }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SERIES: seasons + episodes ────────────────────────── */}
        {title.type === 'SERIES' && (
          <div className="dp-section">
            <div className="dp-section-head">
              <span className="dp-section-title">Episodes</span>
            </div>

            {seasonsLoading ? (
              <div className="anime-status pulse">Loading seasons…</div>
            ) : seasons.length > 0 && (
              <div className="season-tabs">
                {seasons.map(s => (
                  <button
                    key={s.seasonNumber}
                    className={`season-tab${selectedSeason === s.seasonNumber ? ' active' : ''}`}
                    onClick={() => setSelectedSeason(s.seasonNumber)}
                  >
                    {s.name || `S${s.seasonNumber}`}
                    <span style={{ marginLeft: 4, opacity: 0.45 }}>({s.episodeCount})</span>
                  </button>
                ))}
              </div>
            )}

            {episodes.length > 5 && (
              <div className="ep-search">
                <svg className="ep-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  className="ep-search-input"
                  type="text"
                  value={epSearch}
                  onChange={e => setEpSearch(e.target.value)}
                  placeholder="Search episodes…"
                />
              </div>
            )}

            {epsLoading ? (
              <div className="anime-status pulse">Loading episodes…</div>
            ) : (
              <div className="ep-list">
                {filteredEps.map(ep => (
                  <div
                    key={ep.episodeNumber}
                    className={`ep-row${selectedEp === ep.episodeNumber ? ' active' : ''}`}
                    onClick={() => { setSelectedEp(ep.episodeNumber); openPlayer(ep.episodeNumber); }}
                  >
                    <div className="ep-thumb">
                      {ep.stillUrl
                        ? <img src={ep.stillUrl} alt="" loading="lazy" />
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 8,19 19,12"/></svg>
                      }
                    </div>
                    <div className="ep-info">
                      <div>
                        <span className="ep-num">{ep.episodeNumber}.</span>
                        <span className="ep-name">{ep.name}</span>
                      </div>
                      {ep.overview && <p className="ep-overview">{ep.overview}</p>}
                    </div>
                  </div>
                ))}
                {filteredEps.length === 0 && !epsLoading && (
                  <div className="empty-note">No episodes found.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Where to watch — live TMDB providers with logos ─────── */}
        {(watchProviders && (watchProviders.flatrate.length || watchProviders.rent.length || watchProviders.buy.length)) ? (
          <div className="dp-section">
            <div className="dp-section-head">
              <span className="dp-section-title">Where to watch</span>
            </div>
            <div className="platform-chips">
              {[...watchProviders.flatrate, ...watchProviders.rent, ...watchProviders.buy]
                .filter((p, i, arr) => arr.findIndex(x => x.providerId === p.providerId) === i)
                .map((p: any) => (
                  <a
                    key={p.providerId}
                    href={watchProviders.link || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="platform-chip"
                    title={p.name}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    {p.logoUrl && (
                      <img
                        src={p.logoUrl}
                        alt={p.name}
                        loading="lazy"
                        style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover' }}
                      />
                    )}
                    {p.name}
                  </a>
                ))}
            </div>
          </div>
        ) : title.officialWatchLinks?.length > 0 && (
          <div className="dp-section">
            <div className="dp-section-head">
              <span className="dp-section-title">Where to watch</span>
            </div>
            <div className="platform-chips">
              {title.officialWatchLinks.map((link: any) => (
                <a key={link.platform} href={link.url} target="_blank" rel="noreferrer"
                  className="platform-chip">
                  {link.platform}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── Anime-only: characters ────────────────────────────── */}
        {title.type === 'ANIME' && anilistData?.characters?.edges?.length > 0 && (
          <div className="dp-section">
            <div className="dp-section-head">
              <span className="dp-section-title">Characters</span>
            </div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
              {anilistData.characters.edges.map((e: any) => (
                <div key={e.node.id} style={{ flex: '0 0 auto', width: 72, textAlign: 'center' }}>
                  <div
                    style={{
                      width: 64, height: 64, borderRadius: '50%', margin: '0 auto 6px',
                      backgroundImage: e.node.image?.large ? `url(${e.node.image.large})` : undefined,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  />
                  <p className="font-mono text-[9px] text-ink-faint" style={{ lineHeight: 1.3 }}>{e.node.name.full}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Anime-only: relations ─────────────────────────────── */}
        {title.type === 'ANIME' && anilistData?.relations?.edges?.length > 0 && (
          <div className="dp-section">
            <div className="dp-section-head">
              <span className="dp-section-title">Related</span>
            </div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
              {anilistData.relations.edges
                .filter((e: any) => e.node.format !== 'MANGA' && e.node.format !== 'NOVEL')
                .slice(0, 10)
                .map((e: any) => (
                  <div key={e.node.id} style={{ flex: '0 0 auto', width: 130 }}>
                    <RelatedAnimeCard node={e.node} />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── Recommendations — TMDB-backed ─────────────────────── */}
        {recommendedTitles.length > 0 && (
          <div className="dp-section">
            <div className="dp-section-head">
              <span className="dp-section-title">Recommendations</span>
            </div>
            {/* C: gap-3 (12px) between cards + padding-x so first/last cards don't clip */}
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, paddingRight: 4 }}>
              {recommendedTitles.slice(0, 12).map((t: any) => (
                <div key={t.tmdbId} style={{ flex: '0 0 auto', width: 130 }}>
                  <RelatedTmdbCard item={t} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Similar titles — TMDB-backed ──────────────────────── */}
        {similarTitles.length > 0 && (
          <div className="dp-section">
            <div className="dp-section-head">
              <span className="dp-section-title">Similar Titles</span>
            </div>
            {/* C: gap-3 (12px) between cards + padding-x so first/last cards don't clip */}
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, paddingRight: 4 }}>
              {similarTitles.slice(0, 12).map((t: any) => (
                <div key={t.tmdbId} style={{ flex: '0 0 auto', width: 130 }}>
                  <RelatedTmdbCard item={t} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Rating card ───────────────────────────────────────── */}
        <div className="dp-section">
          <div className="rating-card">
            <div className="rating-summary">
              <div>
                <div className="rating-summary-label">Community</div>
                <div className="rating-summary-value">{topTier || '—'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="rating-summary-label">Ratings</div>
                <div className="rating-summary-value small">{ratings.length.toLocaleString()}</div>
              </div>
            </div>

            {TIERS.map(t => {
              const count = ratings.filter(r => r.tier === t.id).length;
              const pct = ratings.length > 0 ? Math.round((count / ratings.length) * 100) : 0;
              return (
                <div
                  key={t.id}
                  className={`tier${myTier === t.id ? ' selected' : ''}`}
                  data-tier={t.key}
                  onClick={() => user && setMyTier(t.id as Tier)}
                  style={{ cursor: user ? 'pointer' : 'default' }}
                >
                  <div className="tier-top">
                    <div className="tier-name">
                      <span className="tier-check">
                        <svg viewBox="0 0 10 10" fill="none">
                          <path d="M1 5L4 8L9 2" stroke="#0a0908" strokeWidth="1.5"/>
                        </svg>
                      </span>
                      {t.label}
                    </div>
                    <div className="tier-pct">{pct}%</div>
                  </div>
                  <div className="tier-track">
                    <div className="tier-fill" style={{ width: `${Math.max(pct, 0.5)}%` }} />
                  </div>
                </div>
              );
            })}

            {user && myTier ? (
              <div className="rating-submit-row">
                <textarea
                  className="rating-review-input"
                  placeholder="Add a review (optional)…"
                  value={review}
                  onChange={e => setReview(e.target.value)}
                  rows={3}
                />
                <button
                  className="dp-btn dp-btn-save"
                  style={{ flex: 'none' }}
                  onClick={submitRating}
                  disabled={ratingSubmitting}
                >
                  {ratingSubmitting ? 'Saving…' : 'Submit rating'}
                </button>
              </div>
            ) : (
              <div className="rate-hint">
                {user ? 'Tap a tier to add your rating' : 'Sign in to add your rating'}
              </div>
            )}
          </div>
        </div>

        {/* ── Reviews ───────────────────────────────────────────── */}
        <div className="dp-section">
          <div className="dp-section-head">
            <span className="dp-section-title">
              Reviews
              <span className="dp-section-count">({ratings.length})</span>
            </span>
          </div>

          {ratings.filter(r => r.reviewText).length === 0 ? (
            <div className="empty-note">No reviews yet — be the first!</div>
          ) : (
            ratings.filter(r => r.reviewText).map((r: any) => (
              <div key={r.id} className="review-card">
                <div className="review-head">
                  <div className="review-avatar">
                    {(r.user?.displayName || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="review-user">{r.user?.displayName || 'Anonymous'}</div>
                  </div>
                  <div className="review-badge">{TIER_LABEL[r.tier] || r.tier}</div>
                </div>
                <div className="review-text">{r.reviewText}</div>
              </div>
            ))
          )}

          {/* Reviews without text (just tiers) */}
          {ratings.filter(r => !r.reviewText).length > 0 && (
            <div className="empty-note" style={{ marginTop: 8 }}>
              +{ratings.filter(r => !r.reviewText).length} more ratings without a written review
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
