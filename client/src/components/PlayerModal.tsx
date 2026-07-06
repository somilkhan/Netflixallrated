import { useEffect, useRef } from 'react';
import { RefreshCw, ExternalLink, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { SERVERS } from './VideoPlayer';

interface PlayerModalProps {
  title: any;
  isOpen: boolean;
  onClose: () => void;
  serverId: string;
  switchServer: (id: string) => void;
  iframeKey: number;
  setIframeKey: React.Dispatch<React.SetStateAction<number>>;
  seasons: any[];
  selectedSeason: number;
  setSelectedSeason: (s: number) => void;
  selectedEp: number;
  setSelectedEp: React.Dispatch<React.SetStateAction<number>>;
  episodes: any[];
  embedUrl: string | null;
  onAnimePrev?: () => void;
  onAnimeNext?: () => void;
  anicrushEpCount?: number;
}

export default function PlayerModal({
  title,
  isOpen,
  onClose,
  serverId,
  switchServer,
  iframeKey,
  setIframeKey,
  seasons,
  selectedSeason,
  setSelectedSeason,
  selectedEp,
  setSelectedEp,
  episodes,
  embedUrl,
  onAnimePrev,
  onAnimeNext,
  anicrushEpCount = 0,
}: PlayerModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !title) return null;

  const isMovie = title.type === 'MOVIE';
  const isAnime = title.type === 'ANIME';
  const isSeries = title.type === 'SERIES';

  const currentEpCount = episodes.length || anicrushEpCount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-void border border-line rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: 'calc(100dvh - 2rem)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line shrink-0 bg-surface/60">
          <div className="min-w-0">
            <p className="font-serif text-sm font-semibold truncate leading-tight">{title.name}</p>
            <p className="text-[10px] text-ink-dim font-mono mt-0.5">
              {isAnime
                ? `Episode ${selectedEp}`
                : isSeries
                ? `S${selectedSeason} · E${selectedEp}`
                : title.year}
            </p>
          </div>

          {/* Server pills — movies & series only */}
          {!isAnime && (
            <div className="flex gap-1.5 flex-wrap justify-center">
              {SERVERS.map(s => (
                <button
                  key={s.id}
                  onClick={() => { switchServer(s.id); }}
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
          {isAnime && (
            <span className="text-[10px] font-mono text-ink-dim border border-line rounded-full px-2.5 py-1 shrink-0">
              Anicrush
            </span>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIframeKey(k => k + 1)}
              title="Reload"
              className="p-1.5 rounded-lg border border-line text-ink-dim hover:text-ink transition-colors"
            >
              <RefreshCw size={12} />
            </button>
            {embedUrl && (
              <a
                href={embedUrl}
                target="_blank"
                rel="noreferrer"
                title="Open in new tab"
                className="p-1.5 rounded-lg border border-line text-ink-dim hover:text-ink transition-colors inline-flex"
              >
                <ExternalLink size={12} />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-line text-ink-dim hover:text-ink transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Season / Episode selectors (SERIES only) ───────────── */}
        {isSeries && (seasons.length > 0 || episodes.length > 0) && (
          <div className="flex items-center gap-4 px-4 py-2.5 border-b border-line bg-surface/40 shrink-0 flex-wrap">
            {seasons.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-ink-dim font-mono uppercase tracking-wide shrink-0">Season</label>
                <select
                  value={selectedSeason}
                  onChange={e => {
                    setSelectedSeason(Number(e.target.value));
                    setSelectedEp(1);
                  }}
                  className="bg-surface border border-line text-ink text-xs font-mono px-2 py-1 rounded-lg focus:border-maroon outline-none cursor-pointer"
                >
                  {seasons.map(s => (
                    <option key={s.seasonNumber} value={s.seasonNumber}>
                      {s.name || `Season ${s.seasonNumber}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {episodes.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-ink-dim font-mono uppercase tracking-wide shrink-0">Episode</label>
                <select
                  value={selectedEp}
                  onChange={e => { setSelectedEp(Number(e.target.value)); setIframeKey(k => k + 1); }}
                  className="bg-surface border border-line text-ink text-xs font-mono px-2 py-1 rounded-lg focus:border-maroon outline-none cursor-pointer max-w-[200px]"
                >
                  {episodes.map(ep => (
                    <option key={ep.episodeNumber} value={ep.episodeNumber}>
                      {ep.episodeNumber}. {ep.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* ── Video iframe ────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 bg-black">
          <div className="player-ratio w-full">
            {embedUrl ? (
              <iframe
                ref={iframeRef}
                key={`${serverId}-${selectedSeason}-${selectedEp}-${iframeKey}`}
                src={embedUrl}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                referrerPolicy="no-referrer"
                title={title.name}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-ink-dim text-sm font-mono">
                Loading stream…
              </div>
            )}
          </div>
        </div>

        {/* ── Prev / Next footer (series & anime) ─────────────────── */}
        {(isSeries || isAnime) && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-line bg-surface/60 shrink-0">
            <button
              onClick={() => {
                if (isAnime) { onAnimePrev?.(); }
                else { setSelectedEp(p => Math.max(1, p - 1)); setIframeKey(k => k + 1); }
              }}
              disabled={selectedEp <= 1}
              className="flex items-center gap-1.5 text-xs font-mono text-ink-dim border border-line rounded-lg px-3 py-1.5 hover:text-ink hover:border-line-bright transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={13} /> Prev
            </button>

            <span className="text-[11px] font-mono text-ink-faint">
              {isAnime
                ? (anicrushEpCount > 0 ? `${selectedEp} / ${anicrushEpCount}` : `Ep ${selectedEp}`)
                : (currentEpCount > 0 ? `Ep ${selectedEp} of ${currentEpCount}` : `Ep ${selectedEp}`)}
            </span>

            <button
              onClick={() => {
                if (isAnime) { onAnimeNext?.(); }
                else { setSelectedEp(p => p + 1); setIframeKey(k => k + 1); }
              }}
              disabled={isAnime
                ? (anicrushEpCount > 0 && selectedEp >= anicrushEpCount)
                : (episodes.length > 0 && selectedEp >= episodes.length)}
              className="flex items-center gap-1.5 text-xs font-mono text-ink-dim border border-line rounded-lg px-3 py-1.5 hover:text-ink hover:border-line-bright transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
