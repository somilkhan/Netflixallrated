import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Search, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import Meter from '../components/Meter';
import { searchAnime } from '../lib/anilist';
import VideoPlayer, { SERVERS } from '../components/VideoPlayer';
import RatingWidget from '../components/RatingWidget';
import type { Tier } from '../components/RatingWidget';

const MYAPI_BASE = 'https://myapi-psi-wheat.vercel.app';

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
  const [iframeKey, setIframeKey] = useState(0);

  // AniList metadata (anime only)
  const [anilistData, setAnilistData] = useState<any>(null);

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

  useEffect(() => {
    if (!title || title.type !== 'ANIME') return;
    setAnilistData(null);
    searchAnime(title.name).then((data) => { if (data) setAnilistData(data); });
  }, [title]);

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
  const canPlay = title.type === 'ANIME'
    ? !!animeSession && !!animeEpisodeSessions[selectedEp]
    : !!title.tmdbId;

  const filteredEps = episodes.filter(e =>
    !epSearch ||
    String(e.episodeNumber).includes(epSearch) ||
    e.name.toLowerCase().includes(epSearch.toLowerCase())
  );

  return (
    /* Fix #3: pb-28 so the last content line never hides behind the floating BottomNav */
    <div className="pb-28">
      {/* Backdrop — backdrop-ratio (16:9) with explicit overflow-hidden */}
      <div className="relative w-full backdrop-ratio max-h-[480px] min-h-[260px] overflow-hidden">
        {(() => {
          const src = title.backdropUrl || (title.type === 'ANIME' ? anilistData?.bannerImage : null);
          return src
            ? <img src={src} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full" style={{ background: `radial-gradient(90% 70% at 30% 0%, ${title.posterColorFrom}, ${title.posterColorTo} 70%)` }} />;
        })()}
        <div className="absolute inset-0 bg-gradient-to-b from-void/10 via-void/50 to-void" />
        <div className="absolute inset-0 bg-gradient-to-r from-void/60 to-transparent" />
      </div>

      {/* Main content */}
      <div className="px-5 -mt-28 relative z-10 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">

          {/* Poster — poster-ratio (2:3) */}
          <div
            className="w-[130px] md:w-[160px] poster-ratio rounded-xl border border-line shrink-0 bg-cover bg-center shadow-2xl"
            style={{
              backgroundImage: (() => {
                const src = title.posterUrl
                  || (title.type === 'ANIME' ? (anilistData?.coverImage?.extraLarge || anilistData?.coverImage?.large) : null);
                return src
                  ? `url(${src})`
                  : `radial-gradient(120% 100% at 30% 0%, ${title.posterColorFrom}, ${title.posterColorTo} 70%)`;
              })(),
            }}
          />

          {/* Meta */}
          <div className="flex-1 space-y-3 pt-2 md:pt-16">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold leading-tight">
              {title.type === 'ANIME' && anilistData
                ? (anilistData.title.english || anilistData.title.romaji)
                : title.name}
            </h1>
            {title.type === 'ANIME' && anilistData?.title.romaji && anilistData.title.english && (
              <p className="font-mono text-xs text-ink-faint">{anilistData.title.romaji}</p>
            )}
            <div className="font-mono text-xs text-ink-dim flex flex-wrap gap-2 items-center">
              <span>{title.year || anilistData?.startDate?.year}</span>·
              <span className="uppercase">{title.type}</span>
              {title.type === 'ANIME' && anilistData?.episodes && (
                <><span>·</span><span>{anilistData.episodes} eps</span></>
              )}
              {title.type === 'ANIME' && anilistData?.averageScore && (
                <><span>·</span>
                <span className="bg-maroon/20 border border-maroon text-ink rounded px-1.5 py-0.5">
                  ★ {(anilistData.averageScore / 10).toFixed(1)}
                </span></>
              )}
              {title.type !== 'ANIME' && title.runtimeMinutes && (
                <><span>·</span><span>{Math.floor(title.runtimeMinutes / 60)}h {title.runtimeMinutes % 60}m</span></>
              )}
              {(() => {
                const genres = title.genres?.length > 0 ? title.genres : (anilistData?.genres || []);
                return genres.length > 0 ? <><span>·</span><span>{genres.slice(0, 3).join(', ')}</span></> : null;
              })()}
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
        {(() => {
          const synopsis = title.synopsis
            || (title.type === 'ANIME' ? anilistData?.description?.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '') : null);
          return synopsis ? (
            <p className="text-ink-dim leading-relaxed mt-6 text-[15px] max-w-2xl">{synopsis}</p>
          ) : null;
        })()}

        {/* AniList genres + studio row */}
        {title.type === 'ANIME' && anilistData && (
          <div className="flex flex-wrap gap-2 mt-4">
            {(anilistData.genres || []).map((g: string) => (
              <span key={g} className="font-mono text-[11px] px-2 py-0.5 rounded border border-line text-ink-dim">
                {g}
              </span>
            ))}
            {anilistData.studios?.nodes?.[0]?.name && (
              <span className="font-mono text-[11px] px-2 py-0.5 rounded border border-maroon/40 text-ink-dim">
                {anilistData.studios.nodes[0].name}
              </span>
            )}
          </div>
        )}

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

        {/* ANIME: Episode picker */}
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

        {/* Your Rating — monochrome re-skin via RatingWidget (Fix #4) */}
        {user && (
          <RatingWidget
            myTier={myTier}
            setMyTier={setMyTier}
            review={review}
            setReview={setReview}
            submitRating={submitRating}
            ratingSubmitting={ratingSubmitting}
          />
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

      {/* Fullscreen player — extracted to VideoPlayer component (Fix #1) */}
      <VideoPlayer
        title={title}
        playerOpen={playerOpen}
        setPlayerOpen={setPlayerOpen}
        serverId={serverId}
        switchServer={switchServer}
        iframeKey={iframeKey}
        setIframeKey={setIframeKey}
        selectedSeason={selectedSeason}
        selectedEp={selectedEp}
        setSelectedEp={setSelectedEp}
        embedUrl={embedUrl}
      />
    </div>
  );
}
