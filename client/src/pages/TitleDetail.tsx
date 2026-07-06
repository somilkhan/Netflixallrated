import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import Meter from '../components/Meter';
import { searchAnime } from '../lib/anilist';
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
  const [showServers, setShowServers] = useState(false);
  const [serverId, setServerId] = useState('vidsrc');
  const [iframeKey, setIframeKey] = useState(0);
  const videoSectionRef = useRef<HTMLDivElement>(null);

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
        const searchRes = await fetch(
          `/api/anicrush/search?keyword=${encodeURIComponent(title.name)}`,
          { signal }
        );
        if (!searchRes.ok) throw new Error(`Search failed (${searchRes.status})`);
        const searchData = await searchRes.json();
        if (signal.aborted) return;

        const movies: any[] = searchData?.result?.movies ?? [];
        if (!movies.length) throw new Error('Not found on Anicrush');

        const movieId: string = movies[0].id;
        setAnicrushMovieId(movieId);

        const epRes = await fetch(
          `/api/anicrush/episodes?movieId=${encodeURIComponent(movieId)}`,
          { signal }
        );
        if (epRes.ok) {
          const epData = await epRes.json();
          if (signal.aborted) return;
          const count: number =
            epData?.result?.totalItems ??
            epData?.result?.items?.length ??
            movies[0].totalEpisodes ??
            0;
          setAnicrushEpCount(count);
        }
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

  const getEmbedUrl = useCallback(() => {
    if (!title) return null;
    if (title.type === 'ANIME') return animeEmbedUrl;
    if (!title.tmdbId) return null;
    const server = SERVERS.find(s => s.id === serverId) || SERVERS[0];
    return server.getUrl(title.tmdbId, title.type, selectedSeason, selectedEp);
  }, [title, serverId, selectedSeason, selectedEp, animeEmbedUrl]);

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
      const res = await fetch(
        `/api/anicrush/embed?movieId=${encodeURIComponent(anicrushMovieId)}&episode=${bounded}`
      );
      if (embedReqRef.current !== reqId) return;
      if (!res.ok) throw new Error(`Episode unavailable (${res.status})`);
      const data = await res.json();
      if (embedReqRef.current !== reqId) return;
      if (!data.embedUrl) throw new Error('No embed URL returned');
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

  const switchServer = (sid: string) => {
    setServerId(sid);
    setIframeKey(k => k + 1);
  };

  const handleClosePlayer = () => {
    setIsPlaying(false);
    setIsIframeLoading(false);
    setShowServers(false);
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
    ? !!anicrushMovieId && !animeLoading
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

      {/* ── Hero / Inline player ──────────────────────────────────── */}
      <div ref={videoSectionRef} className={`hero${isPlaying ? ' playing' : ''}`}>
        {isPlaying ? (
          <>
            {isIframeLoading && (
              <div className="video-loading"><div className="spinner" /></div>
            )}
            <button className="player-close" onClick={handleClosePlayer}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <iframe
              key={`${serverId}-${selectedSeason}-${selectedEp}-${iframeKey}`}
              src={embedUrl || ''}
              allowFullScreen
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              referrerPolicy="no-referrer"
              title={title.name}
              onLoad={() => setIsIframeLoading(false)}
              style={{ opacity: isIframeLoading ? 0 : 1 }}
            />
          </>
        ) : (
          <>
            <div className="hero-bg" style={heroBgStyle} />
            <div className="hero-gradient" />
            <div className="hero-noise" />
            {canPlay && (
              <button
                className="play-overlay-btn"
                onClick={() => title.type === 'ANIME' ? openAnimePlayer() : openPlayer()}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <polygon points="8,5 8,19 19,12" />
                </svg>
              </button>
            )}
          </>
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
              onClick={() => title.type === 'ANIME' ? openAnimePlayer() : openPlayer()}
              disabled={animeEmbedLoading}
              style={{ flex: '0 0 auto', minWidth: 110 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="8,5 8,19 19,12" />
              </svg>
              {animeEmbedLoading ? 'Loading…' : 'Play'}
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

        {/* ── Server accordion (MOVIE / SERIES) ─────────────────── */}
        {title.type !== 'ANIME' && canPlay && (
          <div className="server-wrap">
            <button className="server-toggle" onClick={() => setShowServers(s => !s)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="2" width="20" height="8" rx="2"/>
                <rect x="2" y="14" width="20" height="8" rx="2"/>
              </svg>
              Source:&nbsp;<span className="active-server-name">
                {SERVERS.find(s => s.id === serverId)?.label ?? 'VidSrc'}
              </span>
              <svg
                className={`server-toggle-chevron${showServers ? ' open' : ''}`}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {showServers && (
              <div className="server-options">
                {SERVERS.map(srv => (
                  <button
                    key={srv.id}
                    className={`server-option${serverId === srv.id ? ' active' : ''}`}
                    onClick={() => { switchServer(srv.id); setShowServers(false); }}
                  >
                    {srv.label}
                    {serverId === srv.id && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ANIME: episode controls ────────────────────────────── */}
        {title.type === 'ANIME' && !animeLoading && !animeError && anicrushMovieId && (
          <div className="dp-section">
            <div className="dp-section-head">
              <span className="dp-section-title">Watch Episode</span>
              {anicrushEpCount > 0 && (
                <span className="dp-section-count">{anicrushEpCount} episodes</span>
              )}
            </div>
            <div className="anime-ep-row">
              <button className="ep-nav-btn" onClick={animePrev} disabled={selectedEp <= 1}>‹</button>
              <span className="ep-label">Ep {selectedEp}</span>
              <button className="ep-nav-btn" onClick={animeNext}
                disabled={anicrushEpCount > 0 && selectedEp >= anicrushEpCount}>›</button>
              <button
                className="dp-btn dp-btn-play"
                style={{ flex: '0 0 auto' }}
                onClick={() => openAnimePlayer()}
                disabled={animeEmbedLoading}
              >
                {animeEmbedLoading ? 'Loading…' : '▶ Watch'}
              </button>
            </div>
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
