import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { Play as PlayIcon } from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { getAnimeDetail } from '../lib/anilist';
import {
  searchAnime as anicrushSearch,
  getEpisodeCount as fetchAnicrushEpCount,
  getEmbedUrl as anicrushEmbed,
} from '../lib/anicrush';
import { SERVERS } from '../lib/servers';
import { FebBoxPlayer } from '../components/VideoPlayer';
import type { FebboxStream } from '../components/VideoPlayer';
import { navigateToAnime } from '../lib/animeResolve';
import EpisodeBrowser from '../components/title-detail/EpisodeBrowser';
import RelatedRow from '../components/title-detail/RelatedRow';
import TrailerModal from '../components/title-detail/TrailerModal';
import { PageSkeleton, RowSkeleton, CharacterRowSkeleton } from '../components/title-detail/Skeletons';
import '@/styles/MovieDetailPage.css';
import type { Tier } from '../lib/ratings';
import { analytics } from '../lib/analytics';

const TIERS = [
  { id: 'SKIP',       label: 'Skip',       key: 'skip' },
  { id: 'TIMEPASS',   label: 'Timepass',   key: 'timepass' },
  { id: 'GO_FOR_IT',  label: 'Go for it',  key: 'goforit' },
  { id: 'PERFECTION', label: 'Perfection', key: 'perfection' },
] as const;

const TIER_LABEL: Record<string, string> = {
  SKIP: 'Skip', TIMEPASS: 'Timepass', GO_FOR_IT: 'Go for it', PERFECTION: 'Perfection',
};

/** Lightweight poster card for Related rows — ContentCard visual style,
 *  custom async onClick (can't use ContentCard directly because those cards
 *  need async TMDB/AniList resolution before navigating). */
const RelatedPosterCard = memo(function RelatedPosterCard({
  name, posterUrl, typeLabel, year, onClick,
}: {
  name: string;
  posterUrl?: string | null;
  typeLabel?: string;
  year?: number | string | null;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={name}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className="group relative shrink-0 w-[130px] scroll-snap-start cursor-pointer touch-manipulation select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-xl"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <div
        className="relative w-full overflow-hidden rounded-xl bg-[#141414] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:group-hover:scale-[1.05] active:scale-[0.97]"
        style={{ aspectRatio: '2/3', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
      >
        {typeLabel && (
          <span className="absolute top-2 right-2 z-20 text-[9px] font-medium px-[6px] py-[3px] rounded-full border border-white/[0.08] bg-black/60 text-white/50 uppercase tracking-wide leading-none">
            {typeLabel}
          </span>
        )}
        <div className="absolute inset-0 pointer-events-none z-10" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 30%, transparent 60%)' }} />
        {posterUrl && !imgError ? (
          <img
            src={posterUrl} alt={name} loading="lazy" decoding="async"
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-2">
            <span className="text-white/20 text-[9px] text-center leading-tight">{name}</span>
          </div>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-[12px] font-medium text-white leading-tight line-clamp-2">{name}</p>
        {year && <span className="text-[11px] text-[#737373]">{year}</span>}
      </div>
    </div>
  );
});

/** Similar/Recommended TMDB card — resolves the TMDB item into the local
 * catalog on click and routes to the SAME unified /title/:id detail page. */
const RelatedTmdbCard = memo(function RelatedTmdbCard({ item }: { item: any }) {
  const nav = useNavigate();
  const handleClick = async () => {
    try {
      const { id } = await api.titles.resolveTmdb(item.tmdbId, item.mediaType === 'movie' ? 'movie' : 'tv');
      nav(`/title/${id}`);
    } catch { /* best-effort — stay put on failure */ }
  };
  return (
    <RelatedPosterCard
      name={item.name}
      typeLabel={item.mediaType === 'movie' ? 'Film' : 'TV'}
      year={item.year}
      posterUrl={item.posterUrl}
      onClick={handleClick}
    />
  );
});

/** AniList relation card — resolves the related anime into the local catalog
 * on click and routes to the SAME unified /title/:id detail page. */
const RelatedAnimeCard = memo(function RelatedAnimeCard({ node }: { node: any }) {
  const nav = useNavigate();
  const handleClick = async () => {
    try {
      const full = await getAnimeDetail({ id: node.id });
      await navigateToAnime(full ?? { id: node.id, title: node.title, coverImage: node.coverImage }, nav);
    } catch {
      await navigateToAnime({ id: node.id, title: node.title, coverImage: node.coverImage }, nav);
    }
  };
  return (
    <RelatedPosterCard
      name={node.title.english || node.title.romaji}
      typeLabel="Anime"
      posterUrl={node.coverImage?.extraLarge || node.coverImage?.large}
      onClick={handleClick}
    />
  );
});

/** Memoized character avatar — the AniList characters row can have 20+ entries. */
const CharacterAvatar = memo(function CharacterAvatar({ name, imageUrl }: { name: string; imageUrl?: string }) {
  return (
    <div className="character-avatar-wrap">
      <div className="character-avatar">
        {imageUrl && <img src={imageUrl} alt="" loading="lazy" decoding="async" />}
      </div>
      <p className="character-name">{name}</p>
    </div>
  );
});

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

  // Trailer — always a user-initiated modal, never an autoplaying hero embed.
  const [trailerAvailable, setTrailerAvailable] = useState<boolean | null>(null);
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);

  // "Continue watching" indicator surfaced in the episode browser.
  const [watchProgress, setWatchProgress] = useState<{ seasonNumber: number | null; episodeNumber: number | null; positionSeconds: number; durationSeconds: number | null } | null>(null);

  // Synopsis expand/collapse
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);

  // Loading flags for sections that populate after the initial title fetch,
  // so their skeletons can match the final layout instead of popping in empty.
  const [similarLoading, setSimilarLoading] = useState(true);
  const [recommendedLoading, setRecommendedLoading] = useState(true);
  const [anilistLoading, setAnilistLoading] = useState(false);

  // ── Watch progress / history tracking ────────────────────────────────────
  // Iframes are cross-origin so we can't read currentTime.  We track wall-clock
  // seconds from the moment play starts and add them to the server-saved offset.
  const progressBaseRef  = useRef(0);   // seconds already saved before this session
  const playStartRef     = useRef<number | null>(null); // Date.now() when play started
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Mirror of the episodes state in a ref so saveProgress can read it without
  // needing episodes in its dep array (which would cause unnecessary re-creation).
  const episodesRef = useRef<any[]>([]);

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
    // Resolve the episode title from the current episodes list
    const isSeries = title.type === 'SERIES';
    const isAnimeType = title.type === 'ANIME';
    const epTitle = (isSeries || isAnimeType)
      ? (episodesRef.current.find((e: any) => e.episodeNumber === selectedEp)?.name ?? null)
      : null;
    api.history.save({
      titleId: id,
      positionSeconds: pos,
      durationSeconds: title.runtimeMinutes ? title.runtimeMinutes * 60 : undefined,
      seasonNumber:    isSeries ? selectedSeason : null,
      episodeNumber:   (isSeries || isAnimeType) ? selectedEp : null,
      episodeTitle:    epTitle,
      completed: opts?.completed,
    }).catch(() => {/* non-fatal */});
  }, [user, id, title, selectedSeason, selectedEp, currentPositionSeconds]);

  // Fetch saved progress when title + user are ready; restore season/ep for series.
  // Backend now returns null (not 404) when no record exists — handle both safely.
  useEffect(() => {
    if (!user || !id || !title) return;
    api.history.get(id)
      .then((prog: any) => {
        if (!prog) return; // no history yet for this title
        progressBaseRef.current = prog.positionSeconds ?? 0;
        if (title.type === 'SERIES' && prog.seasonNumber) setSelectedSeason(prog.seasonNumber);
        if ((title.type === 'SERIES' || title.type === 'ANIME') && prog.episodeNumber) setSelectedEp(prog.episodeNumber);
        setWatchProgress({
          seasonNumber: prog.seasonNumber ?? null,
          episodeNumber: prog.episodeNumber ?? null,
          positionSeconds: prog.positionSeconds ?? 0,
          durationSeconds: prog.durationSeconds ?? null,
        });
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
  const [febboxStreams, setFebboxStreams] = useState<FebboxStream[]>([]);
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

  // Cast / credits (movies + series)
  const [credits, setCredits] = useState<any[]>([]);

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
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const [epsLoading, setEpsLoading] = useState(false);

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

  // Keep episodesRef in sync so saveProgress can read the current episode name
  // without episodes appearing in saveProgress's dependency array.
  useEffect(() => { episodesRef.current = episodes; }, [episodes]);

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
    setFebboxStreams([]);
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
        const streams: FebboxStream[] = data?.streams ?? [];
        if (streams.length > 0) {
          // Prefer native HLS playback — no FebBox login required
          setFebboxStreams(streams);
          setFebboxUrl('__native__'); // sentinel so embedUrl is truthy
        } else if (data?.embedUrl) {
          setFebboxUrl(data.embedUrl);
        } else {
          setFebboxError('FebBox stream not available for this title');
        }
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

  // Fetch cast/credits for movies and series
  useEffect(() => {
    if (!title || !id || title.type === 'ANIME') return;
    let cancelled = false;
    api.titles.credits(id)
      .then((data: any) => {
        if (!cancelled) setCredits(data?.cast ?? []);
      })
      .catch(() => { if (!cancelled) setCredits([]); });
    return () => { cancelled = true; };
  }, [title, id]);

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
      setSimilarLoading(true);
      setRecommendedLoading(true);
      api.titles.similar(id)
        .then((data) => { if (!cancelled) setSimilarTitles(data); })
        .catch(() => { if (!cancelled) setSimilarTitles([]); })
        .finally(() => { if (!cancelled) setSimilarLoading(false); });
      api.titles.recommendations(id)
        .then((data) => { if (!cancelled) setRecommendedTitles(data); })
        .catch(() => { if (!cancelled) setRecommendedTitles([]); })
        .finally(() => { if (!cancelled) setRecommendedLoading(false); });
    } else {
      setSimilarTitles([]);
      setRecommendedTitles([]);
      setSimilarLoading(false);
      setRecommendedLoading(false);
    }

    // AniList metadata (anime only) — fired in parallel
    if (title.type === 'ANIME') {
      setAnilistData(null);
      setAnilistLoading(true);
      getAnimeDetail(title.anilistId ? { id: title.anilistId } : { name: title.name })
        .then((data) => { if (!cancelled && data) setAnilistData(data); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setAnilistLoading(false); });
    }

    // Trailer availability — a quick, CORS-friendly oEmbed probe. If the video
    // has been removed/made private, this fails fast and we hide the CTA
    // instead of showing a "Watch Trailer" button that leads to a broken player.
    if (title.trailerYoutubeId) {
      setTrailerAvailable(null);
      fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${title.trailerYoutubeId}`)}&format=json`)
        .then((res) => { if (!cancelled) setTrailerAvailable(res.ok); })
        .catch(() => { if (!cancelled) setTrailerAvailable(false); });
    } else {
      setTrailerAvailable(false);
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
    analytics.play(id);
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
    analytics.pause(id);
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

  /** Jump straight to a given episode number, routed through whichever
   *  provider is currently active — used by the episode browser list. */
  const selectAnimeEpisode = useCallback((epNum: number) => {
    if (animeProvider === 'filmu' || animeProvider === 'screenscape-embed') {
      setSelectedEp(epNum);
      setIframeKey(k => k + 1);
    } else if (animeProvider === 'gogoanime') {
      openGogoPlayer(epNum);
    } else {
      openAnimePlayer(epNum);
    }
  }, [animeProvider, openGogoPlayer, openAnimePlayer]);

  // Normalised episode list for the anime episode browser — prefers real
  // per-episode metadata from GogoAnime when available, otherwise falls back
  // to a plain numbered list (Anicrush/Filmu/Screenscape only expose a count).
  const animeEpisodeList = useMemo(() => {
    if (animeProvider === 'gogoanime' && gogoEpisodes.length > 0) {
      return gogoEpisodes.map((e: any) => ({
        episodeNumber: Number(e.number),
        name: e.title || `Episode ${e.number}`,
        stillUrl: e.image || null,
      }));
    }
    const count = anicrushEpCount || gogoEpCount || 0;
    return Array.from({ length: count }, (_, i) => ({
      episodeNumber: i + 1,
      name: `Episode ${i + 1}`,
    }));
  }, [animeProvider, gogoEpisodes, anicrushEpCount, gogoEpCount]);

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
    analytics.addToList(id);
  };

  // A: Auto-open player when navigated with ?play=1 (fired once, after title loads)
  const autoPlayFiredRef = useRef(false);
  useEffect(() => {
    if (!title || !autoPlay || autoPlayFiredRef.current) return;
    autoPlayFiredRef.current = true;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    if (title.type !== 'ANIME') {
      // Non-anime: open the video player directly
      setIsIframeLoading(true);
      setIsPlaying(true);
      timerId = setTimeout(() => videoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
    // Anime: let the provider-resolve effects run first; user presses Watch in the episode section
    return () => clearTimeout(timerId);
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

  if (!title) return <PageSkeleton />;

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

  const heroBgStyle = backdropUrl
    ? {
        backgroundImage: `url(${backdropUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 25%',
      }
    : {
        background: `radial-gradient(90% 70% at 30% 0%, ${title.posterColorFrom || '#1a1a2e'}, ${title.posterColorTo || '#0c0a0a'} 80%)`,
      };

  return (
    <div className="movie-detail-page">

      {/* ── Hero — backdrop + title/meta/CTAs overlaid at the bottom ─── */}
      <div className="hero">
        <div className="hero-bg" style={heroBgStyle} />
        <div className="hero-gradient" />
        <div className="hero-noise" />

        {/* Back button */}
        <button
          className="hero-back-btn"
          aria-label="Go back"
          onClick={() => navigate(-1)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Anime async-loading spinner (centered, subtle) */}
        {title.type === 'ANIME' && !isStaticAnimeProvider && (animeProvider === 'gogoanime' ? gogoEmbedLoading : animeEmbedLoading) && (
          <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)' }}>
            <div style={{ width: 40, height: 40, border: '2px solid rgba(245,240,236,0.12)', borderTopColor: 'rgba(245,240,236,0.7)', borderRadius: '50%', animation: 'dpSpin 0.8s linear infinite' }} />
          </div>
        )}

        {/* Content overlay — poster thumbnail + title + meta + CTAs */}
        <div className="hero-content">
          <div className="hero-content-inner">
            <div className="hero-poster-title">
              {/* Poster thumbnail */}
              <div
                className="hero-poster"
                style={{
                  backgroundImage: posterUrl
                    ? `url(${posterUrl})`
                    : `radial-gradient(120% 100% at 30% 0%, ${title.posterColorFrom || '#4a1520'}, ${title.posterColorTo || '#0c0a0a'} 70%)`,
                }}
              />

              {/* Title + meta block */}
              <div className="hero-title-block">
                <div className="eyebrow">{typeLabel}</div>
                <h1 className="hero-title">{displayName}</h1>
                {title.type === 'ANIME' && anilistData?.title.romaji && anilistData.title.english && (
                  <p className="detail-subtitle">{anilistData.title.romaji}</p>
                )}
                <div className="hero-meta">
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
                  {genres.slice(0, 3).map(g => (
                    <span key={g} className="dp-pill">{g}</span>
                  ))}
                </div>

                {/* CTA buttons */}
                <div className="hero-cta">
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
                        <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> My List</>
                      )}
                    </button>
                  )}
                  {trailerAvailable && (
                    <button className="dp-btn dp-btn-ghost" onClick={() => setTrailerModalOpen(true)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 8,19 19,12" /></svg>
                      Trailer
                    </button>
                  )}
                  <button className="dp-btn dp-btn-icon" onClick={handleShare} aria-label="Share">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Shell ────────────────────────────────────────────────── */}
      <div className="detail-shell">

        {/* Synopsis — expandable, 3 lines default */}
        {synopsis && (
          <div className="synopsis-wrap">
            <p className={`synopsis${synopsisExpanded ? '' : ' collapsed'}`}>{synopsis}</p>
            {synopsis.length > 180 && (
              <button className="synopsis-toggle" onClick={() => setSynopsisExpanded(v => !v)}>
                {synopsisExpanded ? (
                  <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg> Less</>
                ) : (
                  <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg> More</>
                )}
              </button>
            )}
          </div>
        )}

        {/* ── Cast section — movies + series ────────────────────── */}
        {title.type !== 'ANIME' && credits.length > 0 && (
          <div className="dp-section">
            <div className="dp-section-head">
              <span className="dp-section-title">Cast</span>
            </div>
            <div className="cast-row">
              {credits.slice(0, 20).map((member: any) => (
                <div key={member.id ?? member.name} className="cast-member">
                  <div className="cast-photo">
                    {member.profileUrl ? (
                      <img src={member.profileUrl} alt={member.name} loading="lazy" decoding="async" />
                    ) : (
                      <div className="cast-photo-placeholder">
                        {(member.name || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="cast-name" title={member.name}>{member.name}</div>
                  {member.character && (
                    <div className="cast-character" title={member.character}>{member.character}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anime-only: studios */}
        {title.type === 'ANIME' && anilistData?.studios?.nodes?.length > 0 && (
          <p className="font-mono text-[10px] text-ink-faint uppercase tracking-wider" style={{ marginTop: 8 }}>
            {anilistData.studios.nodes.map((s: any) => s.name).join(' · ')}
          </p>
        )}

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

            {/* Provider cards — glass style */}
            <div className="provider-cards">
              {SERVERS.map(srv => {
                const isLoading =
                  (srv.id === 'flixhq' && flixhqLoading && serverId === 'flixhq') ||
                  (srv.id === 'febbox' && febboxLoading && serverId === 'febbox') ||
                  (srv.id === '4khdhub' && hubLoading && serverId === '4khdhub') ||
                  (srv.id === 'hdhub4u' && hdhubLoading && serverId === 'hdhub4u');
                const isActive = isPlaying && serverId === srv.id;
                return (
                  <button
                    key={srv.id}
                    className={`provider-card${isActive ? ' active' : ''}`}
                    onClick={() => switchServer(srv.id)}
                  >
                    <div className="provider-card-name">
                      <span className="status-dot" />
                      {srv.label}
                    </div>
                    <span className="provider-card-badge">{isLoading ? '…' : '4K'}</span>
                    <div className="provider-card-play">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="8,5 8,19 19,12" />
                      </svg>
                      {isActive ? 'Playing' : 'Play'}
                    </div>
                  </button>
                );
              })}
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

              {/* FebBox: native HLS player — no login required */}
              {isPlaying && serverId === 'febbox' && febboxStreams.length > 0 && (
                <FebBoxPlayer
                  key={`febbox-native-${selectedSeason}-${selectedEp}-${iframeKey}`}
                  streams={febboxStreams}
                  iframeKey={iframeKey}
                />
              )}

              {/* The actual iframe — all servers except FebBox native */}
              {isPlaying && !iframeError && !(serverId === 'febbox' && febboxStreams.length > 0) && (
                <iframe
                  key={`${serverId}-${selectedSeason}-${selectedEp}-${iframeKey}`}
                  src={embedUrl || ''}
                  allowFullScreen
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
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

            {/* Episode browser — search, scrollable/virtualized list, thumbnails,
                metadata, and a "continue watching" indicator */}
            <EpisodeBrowser
              episodes={animeEpisodeList}
              selectedEp={selectedEp}
              onSelectEpisode={selectAnimeEpisode}
              continueEpisode={watchProgress?.episodeNumber ?? null}
              continuePct={
                watchProgress?.durationSeconds
                  ? Math.min(100, Math.round((watchProgress.positionSeconds / watchProgress.durationSeconds) * 100))
                  : 0
              }
              emptyLabel="Episode list unavailable for this source."
            />
            {!isStaticAnimeProvider && (
              <button
                className="dp-btn dp-btn-play"
                style={{ marginTop: 12, width: '100%' }}
                onClick={() => {
                  if (animeProvider === 'gogoanime') openGogoPlayer();
                  else openAnimePlayer();
                }}
                disabled={animeProvider === 'gogoanime' ? gogoEmbedLoading : animeEmbedLoading}
              >
                {(animeProvider === 'gogoanime' ? gogoEmbedLoading : animeEmbedLoading)
                  ? 'Loading…'
                  : <><PlayIcon size={13} className="fill-current shrink-0" /> Watch Episode {selectedEp}</>
                }
              </button>
            )}

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
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
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

            <EpisodeBrowser
              episodes={episodes}
              loading={epsLoading}
              selectedEp={selectedEp}
              onSelectEpisode={(ep) => { setSelectedEp(ep); openPlayer(ep); }}
              seasons={seasons}
              selectedSeason={selectedSeason}
              onSelectSeason={setSelectedSeason}
              seasonsLoading={seasonsLoading}
              continueEpisode={watchProgress?.seasonNumber === selectedSeason ? watchProgress?.episodeNumber ?? null : null}
              continuePct={
                watchProgress?.durationSeconds
                  ? Math.min(100, Math.round((watchProgress.positionSeconds / watchProgress.durationSeconds) * 100))
                  : 0
              }
            />
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
        {title.type === 'ANIME' && anilistLoading && (
          <RelatedRow title="Characters"><CharacterRowSkeleton /></RelatedRow>
        )}
        {title.type === 'ANIME' && !anilistLoading && anilistData?.characters?.edges?.length > 0 && (
          <RelatedRow title="Characters">
            {anilistData.characters.edges.map((e: any) => (
              <div key={e.node.id} style={{ flex: '0 0 auto', width: 72 }}>
                <CharacterAvatar name={e.node.name.full} imageUrl={e.node.image?.large} />
              </div>
            ))}
          </RelatedRow>
        )}

        {/* ── Anime-only: relations ─────────────────────────────── */}
        {title.type === 'ANIME' && !anilistLoading && anilistData?.relations?.edges?.length > 0 && (
          <RelatedRow title="Related">
            {anilistData.relations.edges
              .filter((e: any) => e.node.format !== 'MANGA' && e.node.format !== 'NOVEL')
              .slice(0, 10)
              .map((e: any) => (
                <div key={e.node.id} style={{ flex: '0 0 auto', width: 130 }}>
                  <RelatedAnimeCard node={e.node} />
                </div>
              ))}
          </RelatedRow>
        )}

        {/* ── Recommendations — TMDB-backed ─────────────────────── */}
        {recommendedLoading && title.tmdbId && (
          <RelatedRow title="Recommendations"><RowSkeleton /></RelatedRow>
        )}
        {!recommendedLoading && recommendedTitles.length > 0 && (
          <RelatedRow title="Recommendations">
            {recommendedTitles.slice(0, 12).map((t: any) => (
              <div key={t.tmdbId} style={{ flex: '0 0 auto', width: 130 }}>
                <RelatedTmdbCard item={t} />
              </div>
            ))}
          </RelatedRow>
        )}

        {/* ── Similar titles — TMDB-backed ──────────────────────── */}
        {similarLoading && title.tmdbId && (
          <RelatedRow title="Similar Titles"><RowSkeleton /></RelatedRow>
        )}
        {!similarLoading && similarTitles.length > 0 && (
          <RelatedRow title="Similar Titles">
            {similarTitles.slice(0, 12).map((t: any) => (
              <div key={t.tmdbId} style={{ flex: '0 0 auto', width: 130 }}>
                <RelatedTmdbCard item={t} />
              </div>
            ))}
          </RelatedRow>
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
                  role={user ? 'button' : undefined}
                  tabIndex={user ? 0 : undefined}
                  aria-pressed={user ? myTier === t.id : undefined}
                  aria-label={user ? `Rate as ${t.label}` : undefined}
                  onClick={() => user && setMyTier(t.id as Tier)}
                  onKeyDown={user ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMyTier(t.id as Tier); } } : undefined}
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

      {trailerModalOpen && title.trailerYoutubeId && (
        <TrailerModal
          youtubeId={title.trailerYoutubeId}
          title={displayName}
          onClose={() => setTrailerModalOpen(false)}
        />
      )}
    </div>
  );
}
