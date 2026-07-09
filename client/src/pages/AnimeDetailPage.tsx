/**
 * AnimeDetailPage — detail view for AniList anime that may not be in the local catalog.
 * Route: /anime/view/:anilistId
 *
 * Flow:
 *  1. Try liveSearch for the title in the local catalog → redirect to /title/:id if found.
 *  2. Otherwise render a full detail page from AniList data + anicrush player.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAnimeById } from '../lib/anilist';
import {
  searchAnime as anicrushSearch,
  getEpisodeCount,
  getEmbedUrl as anicrushEmbed,
} from '../lib/anicrush';
import { api } from '../lib/api';
import { ChevronLeft, Star, Tv, PlayCircle, ChevronLeft as Prev, ChevronRight as Next } from 'lucide-react';
import '@/styles/MovieDetailPage.css';

export default function AnimeDetailPage() {
  const { anilistId } = useParams<{ anilistId: string }>();
  const nav = useNavigate();

  const [anime, setAnime] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Anicrush player state
  const [anicrushId, setAnicrushId]       = useState<string | null>(null);
  const [epCount, setEpCount]             = useState(0);
  const [selectedEp, setSelectedEp]       = useState(1);
  const [embedUrl, setEmbedUrl]           = useState<string | null>(null);
  const [embedLoading, setEmbedLoading]   = useState(false);
  const [embedError, setEmbedError]       = useState(false);
  const [isPlaying, setIsPlaying]         = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  // ── Step 1: Load AniList data, try local catalog redirect ──────────────────
  useEffect(() => {
    if (!anilistId) return;
    const id = Number(anilistId);
    if (isNaN(id)) { setError('Invalid anime ID'); setLoading(false); return; }

    (async () => {
      try {
        const data = await getAnimeById(id);
        if (!data) throw new Error('Anime not found');
        setAnime(data);

        // Try to find this in the local catalog → redirect for full TitleDetail
        const titleStr = data.title.english || data.title.romaji;
        try {
          const res = await api.titles.liveSearch(titleStr);
          const match = (res.local || []).find((t: any) => t.type === 'ANIME');
          if (match) { nav(`/title/${match.id}`, { replace: true }); return; }
        } catch { /* not in local catalog — stay on this page */ }

        setLoading(false);
      } catch (e: any) {
        setError(e.message || 'Failed to load anime');
        setLoading(false);
      }
    })();
  }, [anilistId, nav]);

  // ── Step 2: Find on Anicrush once anime is loaded ─────────────────────────
  useEffect(() => {
    if (!anime) return;
    const titleStr = anime.title.english || anime.title.romaji;
    (async () => {
      try {
        const results = await anicrushSearch(titleStr, 1, 5);
        if (!results.length) return;
        const best = results[0];
        setAnicrushId(best.id);
        const count = await getEpisodeCount(best.id);
        setEpCount(count);
      } catch { /* anicrush not available */ }
    })();
  }, [anime]);

  // ── Step 3: Fetch embed URL when episode changes ──────────────────────────
  const loadEmbed = useCallback(async (ep: number) => {
    if (!anicrushId) return;
    setEmbedLoading(true);
    setEmbedError(false);
    setEmbedUrl(null);
    try {
      const { embedUrl: url } = await anicrushEmbed(anicrushId, ep);
      setEmbedUrl(url);
    } catch {
      setEmbedError(true);
    } finally {
      setEmbedLoading(false);
    }
  }, [anicrushId]);

  const openPlayer = useCallback(() => {
    setIsPlaying(true);
    loadEmbed(selectedEp);
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  }, [loadEmbed, selectedEp]);

  const changeEp = (delta: number) => {
    const next = Math.min(Math.max(1, selectedEp + delta), epCount || 1);
    setSelectedEp(next);
    if (isPlaying) loadEmbed(next);
  };

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-maroon border-t-transparent animate-spin" />
          <p className="font-mono text-xs text-ink-faint uppercase tracking-wider">Loading anime…</p>
        </div>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="font-mono text-sm text-ink-faint">{error || 'Anime not found'}</p>
        <button onClick={() => nav(-1)} className="text-maroon font-mono text-xs underline">Go back</button>
      </div>
    );
  }

  const title      = anime.title.english || anime.title.romaji;
  const altTitle   = anime.title.english ? anime.title.romaji : null;
  const score      = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const year       = anime.startDate?.year;
  const poster     = anime.coverImage?.extraLarge || anime.coverImage?.large;
  const banner     = anime.bannerImage;
  const genres     = anime.genres || [];
  const status     = anime.status ? anime.status.toLowerCase().replace(/_/g, ' ') : null;
  const description = anime.description
    ? anime.description.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    : null;
  const studio     = anime.studios?.nodes?.[0]?.name || null;
  const canPlay    = !!anicrushId && !embedLoading;

  return (
    <div className="detail-page">
      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <div className="detail-hero" style={banner ? { backgroundImage: `url(${banner})` } : {}}>
        {!banner && poster && (
          <div
            className="absolute inset-0 bg-cover bg-center scale-110 blur-xl opacity-30"
            style={{ backgroundImage: `url(${poster})` }}
          />
        )}
        <div className="detail-hero-overlay" />

        {/* Back button */}
        <button
          onClick={() => nav(-1)}
          className="absolute top-4 left-4 z-30 flex items-center gap-1.5 font-mono text-[11px] text-ink-dim hover:text-ink transition-colors"
        >
          <ChevronLeft size={14} />
          Back
        </button>

        {/* Play button on hero */}
        {canPlay && !isPlaying && (
          <button
            onClick={openPlayer}
            className="absolute inset-0 z-20 flex items-center justify-center group"
            aria-label="Play"
          >
            <div className="w-16 h-16 rounded-full bg-maroon/80 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-maroon/40">
              <PlayCircle size={32} className="text-white" />
            </div>
          </button>
        )}

        {/* Poster + meta */}
        <div className="detail-hero-content">
          {poster && (
            <img
              src={poster}
              alt={title}
              className="detail-poster"
              loading="eager"
            />
          )}
          <div className="detail-meta">
            <p className="detail-label">Anime · AniList</p>
            <h1 className="detail-title">{title}</h1>
            {altTitle && <p className="detail-subtitle">{altTitle}</p>}

            <div className="detail-chips">
              {year && <span>{year}</span>}
              {anime.episodes && (
                <><span className="dot">·</span><span>{anime.episodes} eps</span></>
              )}
              {score && (
                <><span className="dot">·</span>
                <span className="flex items-center gap-1">
                  <Star size={11} className="text-amber fill-amber" />
                  {score}
                </span></>
              )}
              {status && (
                <><span className="dot">·</span>
                <span className="capitalize">{status}</span></>
              )}
            </div>

            {studio && (
              <p className="font-mono text-[10px] text-ink-faint uppercase tracking-wider mt-1">
                {studio}
              </p>
            )}

            {genres.length > 0 && (
              <div className="detail-genres mt-2">
                {genres.slice(0, 5).map((g: string) => (
                  <button
                    key={g}
                    className="detail-genre-tag"
                    onClick={() => nav(`/browse/genre/${g.toLowerCase().replace(/\s+/g, '-')}`)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}

            <div className="detail-actions mt-4">
              {anicrushId ? (
                <button
                  className="btn-primary"
                  onClick={openPlayer}
                  disabled={embedLoading}
                >
                  {embedLoading ? 'Loading…' : '▶ Play'}
                </button>
              ) : (
                <button className="btn-primary opacity-50 cursor-not-allowed" disabled>
                  <Tv size={14} className="mr-1.5" />
                  Not available yet
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Player section ────────────────────────────────────────────────── */}
      {isPlaying && (
        <div ref={playerRef} className="px-4 mt-4 max-w-4xl mx-auto">
          {/* Episode controls */}
          {epCount > 1 && (
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => changeEp(-1)}
                disabled={selectedEp <= 1}
                className="p-1.5 rounded border border-white/10 text-ink-dim hover:text-ink hover:border-maroon/50 disabled:opacity-30 transition-colors"
              >
                <Prev size={14} />
              </button>
              <span className="font-mono text-xs text-ink-dim">
                Episode <span className="text-ink font-semibold">{selectedEp}</span>
                {epCount > 0 && <span className="text-ink-faint"> / {epCount}</span>}
              </span>
              <button
                onClick={() => changeEp(1)}
                disabled={epCount > 0 && selectedEp >= epCount}
                className="p-1.5 rounded border border-white/10 text-ink-dim hover:text-ink hover:border-maroon/50 disabled:opacity-30 transition-colors"
              >
                <Next size={14} />
              </button>
            </div>
          )}

          {/* Embed */}
          <div className="video-embed-wrapper rounded-xl overflow-hidden bg-void-mid border border-white/[0.06] aspect-video">
            {embedLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full border-2 border-maroon border-t-transparent animate-spin" />
              </div>
            )}
            {embedError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <p className="font-mono text-xs text-ink-faint">Stream unavailable</p>
                <button
                  className="font-mono text-xs text-maroon underline"
                  onClick={() => loadEmbed(selectedEp)}
                >
                  Retry
                </button>
              </div>
            )}
            {embedUrl && !embedLoading && (
              <iframe
                key={`${anicrushId}-${selectedEp}`}
                src={embedUrl}
                className="w-full h-full border-0"
                allowFullScreen
                allow="fullscreen; autoplay; encrypted-media"
                title={`${title} — Episode ${selectedEp}`}
              />
            )}
          </div>

          <p className="font-mono text-[9px] text-ink-faint mt-2 text-center uppercase tracking-wider">
            Powered by Anicrush
          </p>
        </div>
      )}

      {/* ── Description ──────────────────────────────────────────────────── */}
      {description && (
        <div className="px-4 mt-6 max-w-3xl mx-auto">
          <h2 className="font-serif text-base text-ink mb-2">Synopsis</h2>
          <p className="text-sm text-ink-dim leading-relaxed whitespace-pre-line">{description}</p>
        </div>
      )}

      {/* ── Episode grid (quick-jump) ─────────────────────────────────────── */}
      {isPlaying && epCount > 1 && (
        <div className="px-4 mt-6 max-w-4xl mx-auto pb-8">
          <h2 className="font-serif text-base text-ink mb-3">Episodes</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-1.5">
            {Array.from({ length: Math.min(epCount, 100) }, (_, i) => i + 1).map(ep => (
              <button
                key={ep}
                onClick={() => { setSelectedEp(ep); loadEmbed(ep); }}
                className={`
                  h-9 rounded font-mono text-[11px] transition-colors border
                  ${ep === selectedEp
                    ? 'bg-maroon text-white border-maroon'
                    : 'bg-void-mid text-ink-dim border-white/[0.06] hover:border-maroon/40 hover:text-ink'}
                `}
              >
                {ep}
              </button>
            ))}
            {epCount > 100 && (
              <div className="col-span-full font-mono text-[10px] text-ink-faint text-center pt-1">
                + {epCount - 100} more episodes
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
