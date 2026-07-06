import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Search, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import Meter from '../components/Meter';

const STREAMRIP = 'https://streamrip-website-production.up.railway.app';

const tiers = ['SKIP', 'TIMEPASS', 'GOFORIT', 'PERFECTION'];
const tierLabels: Record<string, string> = {
  SKIP: 'Skip', TIMEPASS: 'Timepass', GOFORIT: 'Go for it', PERFECTION: 'Perfection',
};
const tierColors: Record<string, string> = {
  SKIP: 'border-red-800 bg-red-900/20 text-red-400',
  TIMEPASS: 'border-yellow-700 bg-yellow-900/20 text-yellow-400',
  GOFORIT: 'border-green-700 bg-green-900/20 text-green-400',
  PERFECTION: 'border-maroon-bright bg-maroon/20 text-ink',
};

function getStreamSrc(title: any, season: number, episode: number): string | null {
  if (!title?.tmdbId) return null;
  if (title.type === 'MOVIE') return `${STREAMRIP}/movie/${title.tmdbId}`;
  if (title.type === 'SERIES') return `${STREAMRIP}/tv/${title.tmdbId}/${season}/${episode}`;
  if (title.type === 'ANIME') return `${STREAMRIP}/anime/${title.tmdbId}/${episode}`;
  return null;
}

export default function TitleDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [title, setTitle] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [myTier, setMyTier] = useState('');
  const [review, setReview] = useState('');
  const [watchlistStatus, setWatchlistStatus] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // Player state
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerSrc, setPlayerSrc] = useState<string | null>(null);

  // Season/episode state (SERIES only)
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
      .then(setSeasons)
      .catch(() => setSeasons([]))
      .finally(() => setSeasonsLoading(false));
  }, [title, id]);

  useEffect(() => {
    if (!title || title.type !== 'SERIES' || !id) return;
    setEpsLoading(true);
    setEpisodes([]);
    setSelectedEp(1);
    api.titles.episodes(id, selectedSeason)
      .then(setEpisodes)
      .catch(() => setEpisodes([]))
      .finally(() => setEpsLoading(false));
  }, [selectedSeason, title, id]);

  const openPlayer = useCallback((src: string) => {
    setPlayerSrc(src);
    setPlayerOpen(true);
  }, []);

  const submitRating = async () => {
    if (!myTier || !id) return;
    setRatingSubmitting(true);
    try {
      await api.titles.rate(id, { tier: myTier, reviewText: review || undefined });
      const r = await api.titles.ratings(id);
      setRatings(r);
    } finally { setRatingSubmitting(false); }
  };

  const addToWatchlist = async (status: string) => {
    if (!id) return;
    await api.watchlist.add({ titleId: id, status });
    setWatchlistStatus(status);
  };

  if (!title) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-ink-dim font-mono text-sm animate-pulse">Loading…</div>
    </div>
  );

  const streamSrc = getStreamSrc(title, selectedSeason, selectedEp);
  const filteredEps = episodes.filter(e =>
    !epSearch ||
    String(e.episodeNumber).includes(epSearch) ||
    e.name.toLowerCase().includes(epSearch.toLowerCase())
  );

  return (
    <div className="pb-20">
      {/* Hero backdrop */}
      <div className="relative w-full h-[52vw] max-h-[480px] min-h-[260px] overflow-hidden">
        {title.backdropUrl
          ? <img src={title.backdropUrl} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ background: `radial-gradient(90% 70% at 30% 0%, ${title.posterColorFrom}, ${title.posterColorTo} 70%)` }} />
        }
        <div className="absolute inset-0 bg-gradient-to-b from-void/10 via-void/50 to-void" />
        <div className="absolute inset-0 bg-gradient-to-r from-void/60 to-transparent" />
      </div>

      {/* Main content */}
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

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {streamSrc && (
                <button
                  onClick={() => openPlayer(streamSrc)}
                  className="flex items-center gap-2 bg-ink text-void font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-ink/90 active:scale-[0.97] transition-all shadow-lg"
                >
                  <Play size={13} fill="currentColor" /> Play
                </button>
              )}
              {user && (
                <select
                  onChange={e => addToWatchlist(e.target.value)}
                  value={watchlistStatus}
                  className="flex items-center gap-2 bg-surface border border-line text-ink text-sm px-3 py-2.5 rounded-lg focus:border-maroon outline-none cursor-pointer"
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

        {/* === SERIES: Season + Episode Selector === */}
        {title.type === 'SERIES' && (
          <div className="mt-8 space-y-4">
            <h2 className="font-serif text-xl font-semibold">Episodes</h2>

            {/* Season selector */}
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

            {/* Episode search */}
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

            {/* Episode list */}
            {epsLoading
              ? <p className="text-ink-dim text-sm font-mono animate-pulse">Loading episodes…</p>
              : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-none">
                  {filteredEps.map(ep => {
                    const src = getStreamSrc(title, selectedSeason, ep.episodeNumber);
                    const isActive = selectedEp === ep.episodeNumber;
                    return (
                      <div
                        key={ep.episodeNumber}
                        onClick={() => { setSelectedEp(ep.episodeNumber); if (src) openPlayer(src); }}
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

        {/* === ANIME: Episode picker === */}
        {title.type === 'ANIME' && (
          <div className="mt-8 space-y-4">
            <h2 className="font-serif text-xl font-semibold">Watch Episode</h2>
            <div className="flex items-center gap-3">
              <label className="text-sm text-ink-dim font-mono">Episode</label>
              <input
                type="number"
                min={1}
                value={selectedEp}
                onChange={e => setSelectedEp(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink focus:border-maroon outline-none"
              />
              {streamSrc && (
                <button
                  onClick={() => openPlayer(`${STREAMRIP}/anime/${title.tmdbId}/${selectedEp}`)}
                  className="flex items-center gap-2 bg-ink text-void text-sm font-semibold px-4 py-2 rounded-lg hover:bg-ink/90 transition-colors"
                >
                  <Play size={12} fill="currentColor" /> Watch
                </button>
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
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-mono hover:border-maroon-bright transition-colors"
                >
                  {link.platform}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Rating */}
        {user && (
          <div className="mt-8 space-y-4 pt-6 border-t border-line">
            <h2 className="font-serif text-xl font-semibold">Your Rating</h2>
            <div className="flex flex-wrap gap-2">
              {tiers.map(t => (
                <button
                  key={t}
                  onClick={() => setMyTier(t)}
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

        {/* Community reviews */}
        <div className="mt-8 space-y-3 pt-6 border-t border-line">
          <h2 className="font-serif text-xl font-semibold">Reviews <span className="text-ink-dim font-sans text-base font-normal">({ratings.length})</span></h2>
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

      {/* StreamRip player fullscreen overlay */}
      {playerOpen && playerSrc && (
        <div className="fixed inset-0 z-50 bg-void flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line shrink-0 bg-void/95 backdrop-blur-sm">
            <div>
              <p className="font-serif text-base font-semibold">{title.name}</p>
              <p className="text-xs text-ink-dim font-mono">
                {title.type === 'SERIES' ? `S${selectedSeason} · E${selectedEp}` : title.year}
              </p>
            </div>
            <div className="flex gap-2">
              {title.type === 'SERIES' && (
                <>
                  <button
                    onClick={() => { const prev = Math.max(1, selectedEp - 1); setSelectedEp(prev); const s = getStreamSrc(title, selectedSeason, prev); if (s) setPlayerSrc(s); }}
                    className="text-xs text-ink-dim border border-line rounded-lg px-3 py-1.5 hover:text-ink transition-colors"
                  >← Prev</button>
                  <button
                    onClick={() => { const next = selectedEp + 1; setSelectedEp(next); const s = getStreamSrc(title, selectedSeason, next); if (s) setPlayerSrc(s); }}
                    className="text-xs text-ink-dim border border-line rounded-lg px-3 py-1.5 hover:text-ink transition-colors"
                  >Next →</button>
                </>
              )}
              <button
                onClick={() => setPlayerOpen(false)}
                className="text-xs text-ink-dim border border-line rounded-lg px-3 py-1.5 hover:text-ink transition-colors"
              >✕ Close</button>
            </div>
          </div>
          <iframe
            key={playerSrc}
            src={playerSrc}
            className="flex-1 w-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            title={title.name}
          />
        </div>
      )}
    </div>
  );
}
