import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Search, X, RefreshCw, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import Meter from '../components/Meter';

// ── Embed providers ────────────────────────────────────────────────────────────
// These are iframe-embeddable streaming sources — they return a clean player,
// not a full website.

interface Server {
  id: string;
  label: string;
  getUrl: (tmdbId: number, type: string, season: number, ep: number) => string;
}

// Movie / TV servers (TMDB-ID based)
const SERVERS: Server[] = [
  {
    id: 'vidzen',
    label: 'VidZen',
    getUrl: (id, type, s, e) =>
      type === 'MOVIE'
        ? `https://vidzen.fun/movie/${id}`
        : `https://vidzen.fun/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidcore',
    label: 'VidCore',
    getUrl: (id, type, s, e) =>
      type === 'MOVIE'
        ? `https://vidcore.net/movie/${id}`
        : `https://vidcore.net/tv/${id}/${s}/${e}`,
  },
  {
    id: 'filmu',
    label: 'FilmU',
    getUrl: (id, type, s, e) =>
      type === 'MOVIE'
        ? `https://embed.filmu.in/movie/${id}`
        : `https://embed.filmu.in/tv/${id}/${s}/${e}`,
  },
];

const MYAPI_BASE = 'https://myapi-psi-wheat.vercel.app';

// ── Tier config ────────────────────────────────────────────────────────────────
const tiers = ['SKIP', 'TIMEPASS', 'GOFORIT', 'PERFECTION'] as const;
type Tier = typeof tiers[number];
const tierLabels: Record<Tier, string> = {
  SKIP: 'Skip', TIMEPASS: 'Timepass', GOFORIT: 'Go for it', PERFECTION: 'Perfection',
};
const tierColors: Record<Tier, string> = {
  SKIP: 'border-red-800 bg-red-900/20 text-red-400',
  TIMEPASS: 'border-yellow-700 bg-yellow-900/20 text-yellow-400',
  GOFORIT: 'border-green-700 bg-green-900/20 text-green-400',
  PERFECTION: 'border-maroon-bright bg-maroon/20 text-ink',
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function TitleDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [title, setTitle] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [myTier, setMyTier] = useState<Tier | ''>('');
  const [review, setReview] = useState('');
  const [watchlistStatus, setWatchlistStatus] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // Player
  const [playerOpen, setPlayerOpen] = useState(false);
  const [serverId, setServerId] = useState('vidzen');
  const [iframeKey, setIframeKey] = useState(0); // force reload on server switch

  // Anime session state (MyAPI / AnimePahe)
  const [animeSession, setAnimeSession] = useState<string | null>(null);
  const [animeEpisodeSessions, setAnimeEpisodeSessions] = useState<Record<number, string>>({});
  const [animeSessionLoading, setAnimeSessionLoading] = useState(false);
  const [animeSessionError, setAnimeSessionError] = useState<string | null>(null);

  // Season / episode (SERIES only)
  const [seasons, setSeasons] = useState<any[]>([]);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEp, setSelectedEp] = useState(1);
  const [epSearch, setEpSearch] = useState('');
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const [epsLoading, setEpsLoading] = useState(false);

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

  // Fetch AnimePahe session + episode sessions for ANIME titles
  useEffect(() => {
    if (!title || title.type !== 'ANIME') return;
    setAnimeSession(null);
    setAnimeEpisodeSessions({});
    setAnimeSessionError(null);
    setAnimeSessionLoading(true);

    const controller = new AbortController();
    const { signal } = controller;

    const run = async () => {
      try {
        const searchRes = await fetch(
          `${MYAPI_BASE}/search?q=${encodeURIComponent(title.name)}`,
          { signal }
        );
        if (!searchRes.ok) throw new Error(`Search failed: ${searchRes.status}`);
        const results = await searchRes.json();
        if (signal.aborted) return;
        if (!Array.isArray(results) || results.length === 0) {
          setAnimeSessionError('Not found on AnimePahe');
          return;
        }
        const session: string = results[0].session;
        setAnimeSession(session);

        const epsRes = await fetch(`${MYAPI_BASE}/episodes?session=${session}`, { signal });
        if (!epsRes.ok) throw new Error(`Episodes failed: ${epsRes.status}`);
        const epsData = await epsRes.json();
        if (signal.aborted) return;
        if (Array.isArray(epsData)) {
          const map: Record<number, string> = {};
          epsData.forEach((ep: any) => {
            if (ep.number != null && ep.session) map[Number(ep.number)] = ep.session;
          });
          setAnimeEpisodeSessions(map);
          // Reset selected episode to first available episode in this anime
          const firstEp = Math.min(...epsData.map((ep: any) => Number(ep.number)).filter(n => !isNaN(n)));
          if (isFinite(firstEp)) setSelectedEp(firstEp);
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setAnimeSessionError('Failed to reach AnimePahe API');
      } finally {
        if (!signal.aborted) setAnimeSessionLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [title]);

  const getEmbedUrl = useCallback(() => {
    if (!title) return null;
    if (title.type === 'ANIME') {
      const epSession = animeEpisodeSessions[selectedEp];
      if (!animeSession || !epSession) return null;
      return `${MYAPI_BASE}/embed?anime_session=${animeSession}&episode_session=${epSession}&title=${encodeURIComponent(title.name)}`;
    }
    if (!title.tmdbId) return null;
    const server = SERVERS.find(s => s.id === serverId) || SERVERS[0];
    return server.getUrl(title.tmdbId, title.type, selectedSeason, selectedEp);
  }, [title, serverId, selectedSeason, selectedEp, animeSession, animeEpisodeSessions]);

  const openPlayer = useCallback((ep?: number) => {
    if (ep !== undefined) setSelectedEp(ep);
    setPlayerOpen(true);
  }, []);

  const switchServer = (id: string) => {
    setServerId(id);
    setIframeKey(k => k + 1);
  };

  const submitRating = async () => {
    if (!myTier || !id) return;
    setRatingSubmitting(true);
    try {
      await api.titles.rate(id, { tier: myTier, reviewText: review || undefined });
      setRatings(await api.titles.ratings(id));
    } finally { setRatingSubmitting(false); }
  };

  const addToWatchlist = async (status: string) => {
    if (!id || !status) return;
    await api.watchlist.add({ titleId: id, status });
    setWatchlistStatus(status);
  };

  if (!title) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-ink-dim font-mono text-sm animate-pulse">Loading…</div>
    </div>
  );

  const embedUrl = getEmbedUrl();
  // For anime, playability depends on session resolution; for others, on tmdbId
  const canPlay = title.type === 'ANIME'
    ? !!animeSession && !!animeEpisodeSessions[selectedEp]
    : !!title.tmdbId;

  const filteredEps = episodes.filter(e =>
    !epSearch ||
    String(e.episodeNumber).includes(epSearch) ||
    e.name.toLowerCase().includes(epSearch.toLowerCase())
  );

  return (
    <div className="pb-20">
      {/* Backdrop */}
      <div className="relative w-full h-[52vw] max-h-[480px] min-h-[260px] overflow-hidden">
        {title.backdropUrl
          ? <img src={title.backdropUrl} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ background: `radial-gradient(90% 70% at 30% 0%, ${title.posterColorFrom}, ${title.posterColorTo} 70%)` }} />
        }
        <div className="absolute inset-0 bg-gradient-to-b from-void/10 via-void/50 to-void" />
        <div className="absolute inset-0 bg-gradient-to-r from-void/60 to-transparent" />
      </div>

      {/* Main */}
      <div className="px-5 -mt-28 relative z-10 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">

          {/* Poster */}
          <div
            className="w-[130px] md:w-[160px] h-[190px] md:h-[234px] rounded-xl border border-line shrink-0 bg-cover bg-center shadow-2xl"
            style={{
              backgroundImage: title.posterUrl
                ? `url(${title.posterUrl})`
                : `radial-gradient(120% 100% at 30% 0%, ${title.posterColorFrom}, ${title.posterColorTo} 70%)`,
            }}
          />

          {/* Meta */}
          <div className="flex-1 space-y-3 pt-2 md:pt-16">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold leading-tight">{title.name}</h1>
            <div className="font-mono text-xs text-ink-dim flex flex-wrap gap-2 items-center">
              <span>{title.year}</span>·
              <span className="uppercase">{title.type}</span>
              {title.runtimeMinutes && <><span>·</span><span>{Math.floor(title.runtimeMinutes / 60)}h {title.runtimeMinutes % 60}m</span></>}
              {title.genres?.length > 0 && <><span>·</span><span>{title.genres.slice(0, 3).join(', ')}</span></>}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {title.type === 'ANIME' ? (
                animeSessionLoading ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-line text-ink-dim text-xs font-mono animate-pulse">
                    Resolving anime source…
                  </div>
                ) : animeSessionError ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-line text-ink-dim text-xs font-mono">
                    {animeSessionError}
                  </div>
                ) : canPlay ? (
                  <button
                    onClick={() => openPlayer()}
                    className="flex items-center gap-2 bg-ink text-void font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-ink/90 active:scale-[0.97] transition-all shadow-lg"
                  >
                    <Play size={13} fill="currentColor" /> Play
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-line text-ink-dim text-xs font-mono">
                    Select an episode to watch
                  </div>
                )
              ) : canPlay ? (
                <button
                  onClick={() => openPlayer()}
                  className="flex items-center gap-2 bg-ink text-void font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-ink/90 active:scale-[0.97] transition-all shadow-lg"
                >
                  <Play size={13} fill="currentColor" /> Play
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-line text-ink-dim text-xs font-mono">
                  No TMDB ID — sync from Admin to enable streaming
                </div>
              )}
              {user && (
                <select
                  value={watchlistStatus}
                  onChange={e => addToWatchlist(e.target.value)}
                  className="bg-surface border border-line text-ink text-sm px-3 py-2.5 rounded-lg focus:border-maroon outline-none cursor-pointer"
                >
                  <option value="">+ Watchlist</option>
                  <option value="PLAN_TO_WATCH">Plan to Watch</option>
                  <option value="WATCHING">Watching</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DROPPED">Dropped</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Synopsis */}
        <p className="text-ink-dim leading-relaxed mt-6 text-[15px] max-w-2xl">{title.synopsis}</p>

        {/* SERIES: Season + Episode list */}
        {title.type === 'SERIES' && (
          <div className="mt-8 space-y-4">
            <h2 className="font-serif text-xl font-semibold">Episodes</h2>

            {seasonsLoading
              ? <p className="text-ink-dim text-sm font-mono animate-pulse">Loading seasons…</p>
              : seasons.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {seasons.map(s => (
                    <button
                      key={s.seasonNumber}
                      onClick={() => setSelectedSeason(s.seasonNumber)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                        selectedSeason === s.seasonNumber
                          ? 'border-maroon-bright bg-maroon/20 text-ink'
                          : 'border-line text-ink-dim hover:text-ink hover:border-line-bright'
                      }`}
                    >
                      {s.name || `Season ${s.seasonNumber}`}
                      <span className="ml-1 text-ink-faint">({s.episodeCount})</span>
                    </button>
                  ))}
                </div>
              )
            }

            {episodes.length > 5 && (
              <div className="relative max-w-xs">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  type="text"
                  value={epSearch}
                  onChange={e => setEpSearch(e.target.value)}
                  placeholder="Search episodes…"
                  className="w-full bg-surface border border-line rounded-lg pl-8 pr-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-maroon outline-none"
                />
                {epSearch && (
                  <button onClick={() => setEpSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            {epsLoading
              ? <p className="text-ink-dim text-sm font-mono animate-pulse">Loading episodes…</p>
              : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-none">
                  {filteredEps.map(ep => {
                    const isActive = selectedEp === ep.episodeNumber;
                    return (
                      <div
                        key={ep.episodeNumber}
                        onClick={() => { setSelectedEp(ep.episodeNumber); openPlayer(ep.episodeNumber); }}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all group ${
                          isActive ? 'border-maroon-bright bg-maroon/10' : 'border-line hover:border-line-bright hover:bg-surface'
                        }`}
                      >
                        {ep.stillUrl
                          ? <img src={ep.stillUrl} alt="" className="w-20 h-12 rounded-lg object-cover shrink-0 border border-line" />
                          : <div className="w-20 h-12 rounded-lg bg-surface border border-line shrink-0 flex items-center justify-center text-ink-faint">
                              <Play size={14} />
                            </div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">
                            <span className="text-ink-dim mr-2 font-mono text-xs">{ep.episodeNumber}.</span>
                            {ep.name}
                          </p>
                          {ep.airDate && <p className="text-xs text-ink-faint font-mono mt-0.5">{ep.airDate}</p>}
                          {ep.overview && <p className="text-xs text-ink-dim mt-1 line-clamp-1">{ep.overview}</p>}
                        </div>
                        <Play size={14} className="text-ink-faint group-hover:text-ink shrink-0 transition-colors" />
                      </div>
                    );
                  })}
                  {filteredEps.length === 0 && !epsLoading && (
                    <p className="text-ink-faint text-sm font-mono py-4">No episodes found.</p>
                  )}
                </div>
              )
            }
          </div>
        )}

        {/* ANIME: Episode picker — shown whenever session is resolved, regardless of canPlay */}
        {title.type === 'ANIME' && !animeSessionLoading && !animeSessionError && animeSession && (
          <div className="mt-8 space-y-4">
            <h2 className="font-serif text-xl font-semibold">Watch Episode</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-sm text-ink-dim font-mono">Episode</label>
              <input
                type="number"
                min={1}
                value={selectedEp}
                onChange={e => setSelectedEp(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink focus:border-maroon outline-none"
              />
              <button
                onClick={() => openPlayer()}
                disabled={!animeEpisodeSessions[selectedEp]}
                className="flex items-center gap-2 bg-ink text-void text-sm font-semibold px-4 py-2 rounded-lg hover:bg-ink/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play size={12} fill="currentColor" /> Watch
              </button>
              {!animeEpisodeSessions[selectedEp] && (
                <span className="text-xs text-ink-faint font-mono">
                  Episode {selectedEp} not available
                </span>
              )}
            </div>
          </div>
        )}

        {/* Where to watch */}
        {title.officialWatchLinks?.length > 0 && (
          <div className="mt-8 space-y-3">
            <h2 className="font-serif text-xl font-semibold">Where to watch</h2>
            <div className="flex gap-2 flex-wrap">
              {title.officialWatchLinks.map((link: any) => (
                <a key={link.platform} href={link.url} target="_blank" rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-mono hover:border-maroon-bright transition-colors"
                >
                  {link.platform}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Your Rating */}
        {user && (
          <div className="mt-8 space-y-4 pt-6 border-t border-line">
            <h2 className="font-serif text-xl font-semibold">Your Rating</h2>
            <div className="flex flex-wrap gap-2">
              {tiers.map(t => (
                <button key={t} onClick={() => setMyTier(t)}
                  className={`px-4 py-2 rounded-lg border text-xs font-mono transition-colors ${
                    myTier === t ? tierColors[t] : 'border-line text-ink-dim hover:text-ink hover:border-line-bright'
                  }`}
                >
                  {tierLabels[t]}
                </button>
              ))}
            </div>
            <textarea
              value={review}
              onChange={e => setReview(e.target.value)}
              placeholder="Write a review (optional)…"
              className="w-full bg-surface border border-line rounded-xl p-3 text-sm text-ink placeholder:text-ink-faint focus:border-maroon outline-none resize-none"
              rows={3}
            />
            <button
              onClick={submitRating}
              disabled={!myTier || ratingSubmitting}
              className="px-5 py-2.5 bg-maroon-bright text-white rounded-lg text-sm font-semibold hover:bg-maroon transition-colors disabled:opacity-40"
            >
              {ratingSubmitting ? 'Submitting…' : 'Submit Rating'}
            </button>
          </div>
        )}

        {/* Community Reviews */}
        <div className="mt-8 space-y-3 pt-6 border-t border-line">
          <h2 className="font-serif text-xl font-semibold">
            Reviews <span className="text-ink-dim font-sans text-base font-normal">({ratings.length})</span>
          </h2>
          {ratings.length === 0
            ? <p className="text-ink-faint text-sm font-mono">No reviews yet. Be the first!</p>
            : ratings.map((r: any) => (
              <div key={r.id} className="bg-surface border border-line rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-ink-dim">{r.user?.displayName || 'Anonymous'}</span>
                  <Meter tier={r.tier} mini />
                </div>
                {r.reviewText && <p className="text-sm text-ink-dim leading-relaxed">{r.reviewText}</p>}
              </div>
            ))
          }
        </div>
      </div>

      {/* ── Fullscreen Player Overlay ── */}
      {playerOpen && embedUrl && (
        <div className="fixed inset-0 z-50 bg-void flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-line shrink-0 bg-surface/80 backdrop-blur-sm gap-3">
            <div className="shrink-0">
              <p className="font-serif text-sm font-semibold leading-tight">{title.name}</p>
              <p className="text-[10px] text-ink-dim font-mono">
                {title.type === 'SERIES' ? `S${selectedSeason} · E${selectedEp}` : title.year}
              </p>
            </div>

            {/* Server selector — only for Movie / Series */}
            {title.type !== 'ANIME' && (
              <div className="flex gap-1.5 flex-wrap">
                {SERVERS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => switchServer(s.id)}
                    className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-colors ${
                      serverId === s.id
                        ? 'border-maroon-bright bg-maroon/20 text-ink'
                        : 'border-line text-ink-dim hover:text-ink hover:border-line-bright'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
            {title.type === 'ANIME' && (
              <span className="text-[10px] font-mono text-ink-dim border border-line rounded-full px-2.5 py-1">
                AnimePahe
              </span>
            )}

            {/* Controls */}
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setIframeKey(k => k + 1)}
                title="Reload player"
                className="text-xs text-ink-dim border border-line rounded-lg px-2.5 py-1.5 hover:text-ink transition-colors"
              >
                <RefreshCw size={12} />
              </button>
              {title.type === 'SERIES' && (
                <>
                  <button
                    onClick={() => { const p = Math.max(1, selectedEp - 1); setSelectedEp(p); setIframeKey(k => k + 1); }}
                    className="text-xs text-ink-dim border border-line rounded-lg px-3 py-1.5 hover:text-ink transition-colors"
                  >← Prev</button>
                  <button
                    onClick={() => { const n = selectedEp + 1; setSelectedEp(n); setIframeKey(k => k + 1); }}
                    className="text-xs text-ink-dim border border-line rounded-lg px-3 py-1.5 hover:text-ink transition-colors"
                  >Next →</button>
                </>
              )}
              <a
                href={embedUrl}
                target="_blank"
                rel="noreferrer"
                title="Open in new tab"
                className="text-xs text-ink-dim border border-line rounded-lg px-2.5 py-1.5 hover:text-ink transition-colors inline-flex items-center"
              >
                <ExternalLink size={12} />
              </a>
              <button
                onClick={() => setPlayerOpen(false)}
                className="text-xs text-ink-dim border border-line rounded-lg px-3 py-1.5 hover:text-ink transition-colors"
              >✕</button>
            </div>
          </div>

          <iframe
            key={`${serverId}-${selectedSeason}-${selectedEp}-${iframeKey}`}
            src={embedUrl}
            className="flex-1 w-full border-0 bg-black"
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            referrerPolicy="no-referrer"
            title={title.name}
          />
        </div>
      )}
    </div>
  );
}
