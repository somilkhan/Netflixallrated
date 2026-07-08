import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { searchAnime } from '../lib/anilist';
import {
  searchAnime as anicrushSearch,
  getEpisodeCount as fetchAnicrushEpCount,
  getEmbedUrl as anicrushEmbed,
} from '../lib/anicrush';
import { SERVERS } from '../components/VideoPlayer';
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

export default function TitleDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [myTier, setMyTier] = useState<Tier | ''>('');
  const [review, setReview] = useState('');
  const [watchlistStatus, setWatchlistStatus] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Player
  const [isPlaying, setIsPlaying] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [serverId, setServerId] = useState('vidsrc');
  const [iframeKey, setIframeKey] = useState(0);
  const videoSectionRef = useRef<HTMLDivElement>(null);

  // GogoAnime (consumet) — alternative anime source
  const [animeProvider, setAnimeProvider] = useState<'anicrush' | 'gogoanime'>('anicrush');
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

  // Season / episode (SERIES only)
  const [seasons, setSeasons] = useState<any[]>([]);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEp, setSelectedEp] = useState(1);
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
    api.titles.get(id).then(setTitle);
    api.titles.ratings(id).then(setRatings);
  }, [id]);

  useEffect(() => {
    if (!title || title.type !== 'SERIES' || !id) return;
    setSeasonsLoading(true);
    api.titles.seasons(id)
      .then(setSeasons).catch(() => setSeasons([]))
      .finally(() => setSeasonsLoading(false));
  }, [title, id]);

  useEffect(() => {
    if (!title || title.type !== 'SERIES' || !id) return;
    setEpsLoading(true);
    setEpisodes([]);
    setSelectedEp(1);
    api.titles.episodes(id, selectedSeason)
      .then(setEpisodes).catch(() => setEpisodes([]))
      .finally(() => setEpsLoading(false));
  }, [selectedSeason, title, id]);

  // FlixHQ auto-resolve — fires when FlixHQ server is selected for movies/TV
  useEffect(() => {
    if (!title || title.type === 'ANIME' || serverId !== 'flixhq') return;
    setFlixhqUrl(null);
    setFlixhqError(null);
    setFlixhqLoading(true);
    api.consumet.moviesAuto(title.name, title.type, selectedSeason, selectedEp)
      .then((data: any) => {
        if (data?.playerUrl) setFlixhqUrl(data.playerUrl);
        else setFlixhqError('No stream found via FlixHQ');
      })
      .catch(() => setFlixhqError('FlixHQ failed to load — try another server'))
      .finally(() => setFlixhqLoading(false));
  }, [serverId, title, selectedSeason, selectedEp]);

  useEffect(() => {
    if (!title || title.type !== 'ANIME') return;
    setAnilistData(null);
    searchAnime(title.name).then((data) => { if (data) setAnilistData(data); });
  }, [title]);

  useEffect(() => {
    if (!title || title.type !== 'ANIME') return;
    setAnicrushMovieId(null);
    setAnicrushEpCount(0);
    setAnimeError(null);
    setAnimeEmbedUrl(null);
    setAnimeLoading(true);

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
        if (err?.name === 'AbortError') return;
        setAnimeError(err.message || 'Not available on Anicrush');
      } finally {
        if (!signal.aborted) setAnimeLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [title]);

  // GogoAnime/Hianime search — runs in background when an anime title loads; resets stale state first
  useEffect(() => {
    if (!title || title.type !== 'ANIME') return;
    // Reset so stale data from a previous title never bleeds through
    setGogoAnimeId(null);
    setGogoEpCount(0);
    setGogoEpisodes([]);
    setGogoEmbedUrl(null);
    setGogoError(null);
    api.consumet.animeSearch(title.name)
      .then((data: any) => {
        const result = data?.results?.[0];
        if (!result) return;
        setGogoAnimeId(result.id);
        api.consumet.animeInfo(result.id)
          .then((info: any) => {
            setGogoEpCount(info.totalEpisodes ?? info.episodes?.length ?? 0);
            setGogoEpisodes(info.episodes ?? []);
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, [title]);

  const getEmbedUrl = useCallback(() => {
    if (!title) return null;
    if (title.type === 'ANIME') {
      return animeProvider === 'gogoanime' ? gogoEmbedUrl : animeEmbedUrl;
    }
    if (!title.tmdbId) return null;
    if (serverId === 'flixhq') return flixhqUrl;
    const server = SERVERS.find(s => s.id === serverId) || SERVERS[0];
    return server.getUrl(title.tmdbId, title.type, selectedSeason, selectedEp);
  }, [title, serverId, selectedSeason, selectedEp, animeEmbedUrl, animeProvider, gogoEmbedUrl, flixhqUrl]);

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
      setTimeout(() => videoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
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
    if (!gogoAnimeId || gogoEpisodes.length === 0) return;
    const gogoEp = gogoEpisodes.find((e: any) => e.number === epNum) ?? gogoEpisodes[epNum - 1];
    if (!gogoEp) { setGogoError('Episode not found in GogoAnime'); return; }

    setGogoEmbedLoading(true);
    setGogoEmbedUrl(null);
    setGogoError(null);
    try {
      const data = await api.consumet.animeStream(gogoEp.id);
      const m3u8 = (data.sources as any[])?.find((s: any) => s.isM3U8) ?? data.sources?.[0];
      if (!m3u8) throw new Error('No stream source found');
      const url = api.consumet.playerUrl(m3u8.url, data.headers?.Referer ?? '');
      setGogoEmbedUrl(url);
      setIsIframeLoading(true);
      setIsPlaying(true);
      setTimeout(() => videoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (err: any) {
      setGogoError(err.message ?? 'GogoAnime stream failed');
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

  if (!title) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060505' }}>
      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: 'rgba(245,240,236,0.4)', animation: 'pulseFade 1.5s ease-in-out infinite' }}>
        Loading…
      </div>
    </div>
  );

  const embedUrl = getEmbedUrl();
  const canPlay = title.type === 'ANIME'
    ? (!!anicrushMovieId && !animeLoading) || !!gogoAnimeId
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
      <div className="hero">
        {title.trailerYoutubeId ? (
          <iframe
            className="hero-trailer"
            src={`https://www.youtube.com/embed/${title.trailerYoutubeId}?autoplay=1&mute=1&loop=1&playlist=${title.trailerYoutubeId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1`}
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
        {title.type === 'ANIME' && canPlay && !(animeProvider === 'gogoanime' ? gogoEmbedLoading : animeEmbedLoading) && (
          <button
            className="play-overlay-btn"
            onClick={() => animeProvider === 'gogoanime' ? openGogoPlayer() : openAnimePlayer()}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <polygon points="8,5 8,19 19,12" />
            </svg>
          </button>
        )}
        {title.type === 'ANIME' && (animeProvider === 'gogoanime' ? gogoEmbedLoading : animeEmbedLoading) && (
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
          {genres.slice(0, 3).map(g => (
            <span key={g} className="dp-pill">{g}</span>
          ))}
        </div>

        {/* Synopsis */}
        {synopsis && <p className="synopsis">{synopsis}</p>}

        {/* CTA Buttons */}
        <div className="detail-actions">
          {canPlay && (
            <button
              className="dp-btn dp-btn-play"
              onClick={() => title.type === 'ANIME'
                ? (animeProvider === 'gogoanime' ? openGogoPlayer() : openAnimePlayer())
                : openPlayer()}
              disabled={animeProvider === 'gogoanime' ? gogoEmbedLoading : animeEmbedLoading}
              style={{ flex: '0 0 auto', minWidth: 110 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="8,5 8,19 19,12" />
              </svg>
              {(animeProvider === 'gogoanime' ? gogoEmbedLoading : animeEmbedLoading) ? 'Loading…' : 'Play'}
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
                  {srv.id === 'flixhq' && flixhqLoading && serverId === 'flixhq'
                    ? <span className="quality-badge">…</span>
                    : <span className="quality-badge">HD</span>}
                </button>
              ))}
            </div>

            {/* FlixHQ error message */}
            {serverId === 'flixhq' && !flixhqLoading && flixhqError && (
              <div className="anime-status error" style={{ marginBottom: 10 }}>{flixhqError}</div>
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
        {title.type === 'ANIME' && !animeLoading && (anicrushMovieId || gogoAnimeId) && (
          <div className="dp-section">
            <div className="dp-section-head">
              <span className="dp-section-title">Watch Episode</span>
              {(animeProvider === 'anicrush' ? anicrushEpCount : gogoEpCount) > 0 && (
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
                  onClick={() => setAnimeProvider('anicrush')}
                >
                  <span className="status-dot" />Anicrush<span className="quality-badge">HD</span>
                </button>
              )}
              {gogoAnimeId && (
                <button
                  className={`provider-tab${animeProvider === 'gogoanime' ? ' active' : ''}`}
                  onClick={() => setAnimeProvider('gogoanime')}
                >
                  <span className="status-dot" />GogoAnime<span className="quality-badge">HD</span>
                </button>
              )}
            </div>

            {/* Episode row */}
            <div className="anime-ep-row">
              <button
                className="ep-nav-btn"
                onClick={() => {
                  const prev = Math.max(1, selectedEp - 1);
                  setSelectedEp(prev);
                  if (animeProvider === 'gogoanime') openGogoPlayer(prev);
                  else animePrev();
                }}
                disabled={selectedEp <= 1}
              >‹</button>
              <span className="ep-label">Ep {selectedEp}</span>
              <button
                className="ep-nav-btn"
                onClick={() => {
                  const epCount = animeProvider === 'anicrush' ? anicrushEpCount : gogoEpCount;
                  if (epCount > 0 && selectedEp >= epCount) return;
                  const next = selectedEp + 1;
                  setSelectedEp(next);
                  if (animeProvider === 'gogoanime') openGogoPlayer(next);
                  else animeNext();
                }}
                disabled={
                  animeProvider === 'anicrush'
                    ? anicrushEpCount > 0 && selectedEp >= anicrushEpCount
                    : gogoEpCount > 0 && selectedEp >= gogoEpCount
                }
              >›</button>
              <button
                className="dp-btn dp-btn-play"
                style={{ flex: '0 0 auto' }}
                onClick={() => animeProvider === 'gogoanime' ? openGogoPlayer() : openAnimePlayer()}
                disabled={animeProvider === 'gogoanime' ? gogoEmbedLoading : animeEmbedLoading}
              >
                {(animeProvider === 'gogoanime' ? gogoEmbedLoading : animeEmbedLoading) ? 'Loading…' : '▶ Watch'}
              </button>
            </div>

            {/* GogoAnime error */}
            {animeProvider === 'gogoanime' && gogoError && (
              <div className="anime-status error" style={{ marginTop: 10 }}>{gogoError}</div>
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
                        ? <img src={ep.stillUrl} alt="" />
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

        {/* ── Where to watch ────────────────────────────────────── */}
        {title.officialWatchLinks?.length > 0 && (
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
