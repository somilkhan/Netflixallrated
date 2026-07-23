/**
 * ContentCard — rebuilt from scratch.
 * Poster (2:3) with hover info overlay on desktop, tap-to-navigate on mobile.
 * New design: elevated glass info panel, animated reveal, clean action row.
 */
import { memo, useState, useCallback } from 'react';
import { Play, Plus, Info, Film, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/** Highlight matching substring in title text */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} style={{ background: 'rgba(255,255,255,0.22)', color: '#fff', borderRadius: 2, padding: '0 1px' }}>{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

export interface ContentCardProps {
  title: any;
  rank?: number;
  showProgress?: boolean;
  progressSeconds?: number;
  durationSeconds?: number;
  className?: string;
  onAddToList?: (titleId: string) => void;
  fluid?: boolean;
  /** Override default /title/:id navigation. Called with play=true for the Play button. */
  onNavigate?: (play?: boolean) => void;
  /** When set, highlights matching text in the visible card title */
  highlightQuery?: string;
}

const TYPE_LABEL: Record<string, string> = {
  MOVIE: 'Film', SERIES: 'TV', ANIME: 'Anime',
};

const ContentCard = memo(function ContentCard({
  title,
  rank,
  highlightQuery = '',
  showProgress = false,
  progressSeconds = 0,
  durationSeconds = 0,
  className = '',
  onAddToList,
  fluid = false,
  onNavigate,
}: ContentCardProps) {
  const nav = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError,  setImgError]  = useState(false);

  const hasImage    = !!title.posterUrl && !imgError;
  const rating      = title.rating || title.imdbRating || title.voteAverage;
  const progressPct = durationSeconds > 0
    ? Math.min(100, (progressSeconds / durationSeconds) * 100)
    : 0;

  const handleClick    = useCallback(() => { if (onNavigate) { onNavigate(false); } else { nav(`/title/${title.id}`); } }, [nav, title.id, onNavigate]);
  const handlePlay     = useCallback((e: React.MouseEvent) => { e.stopPropagation(); if (onNavigate) { onNavigate(true); } else { nav(`/title/${title.id}?play=1`); } }, [nav, title.id, onNavigate]);
  const handleAddList  = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onAddToList?.(title.id); }, [onAddToList, title.id]);
  const handleInfo     = useCallback((e: React.MouseEvent) => { e.stopPropagation(); if (onNavigate) { onNavigate(false); } else { nav(`/title/${title.id}`); } }, [nav, title.id, onNavigate]);
  const handleKeyDown  = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); }
  }, [handleClick]);

  if (!title?.id) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={title.name}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        group relative cursor-pointer select-none touch-manipulation
        focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 rounded-lg
        ${fluid ? 'w-full' : 'shrink-0 w-[104px] md:w-[150px] scroll-snap-start'}
        ${className}
      `}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* ── Poster container ─────────────────────────────────────────────── */}
      <div
        className="
          relative w-full rounded-lg overflow-hidden
          bg-[#141414]
          transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
          md:group-hover:scale-[1.08] md:group-hover:-translate-y-1
          active:scale-[0.97] md:active:scale-100 md:active:translate-y-0
        "
        style={{
          aspectRatio: '2/3',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        {/* Glow layer — opacity-only toggle, no repaint */}
        <div
          className="
            absolute inset-0 rounded-xl pointer-events-none z-[-1]
            opacity-0 md:group-hover:opacity-100 transition-opacity duration-[400ms]
          "
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)' }}
          aria-hidden
        />

        {/* Poster image */}
        {hasImage ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 bg-[#1A1A1A] overflow-hidden">
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05) 50%, transparent)',
                  animation: 'shimmer 1.8s ease-in-out infinite',
                }} />
              </div>
            )}
            <img
              src={title.posterUrl}
              alt={title.name}
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`
                absolute inset-0 w-full h-full object-cover
                transition-all duration-[400ms]
                md:group-hover:scale-[1.04] md:group-hover:opacity-60
                ${imgLoaded ? 'opacity-100' : 'opacity-0'}
              `}
            />
          </>
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3"
            style={{
              background: `radial-gradient(140% 120% at 30% 0%, ${title.posterColorFrom || '#1e1e2e'}, ${title.posterColorTo || '#0A0A0A'} 75%)`,
            }}
          >
            <Film size={22} className="text-white/20" />
            <span className="text-[9px] text-white/25 text-center leading-tight line-clamp-3">
              {title.name}
            </span>
          </div>
        )}

        {/* Rank badge */}
        {rank != null && (
          <div className="
            absolute top-2 left-2 z-20
            h-[22px] min-w-[22px] px-1 flex items-center justify-center
            rounded-full bg-black/80 border border-white/[0.12]
            text-[10px] font-bold text-white/80 leading-none
          ">
            {rank}
          </div>
        )}

        {/* Type badge */}
        {title.type && (
          <span className="
            absolute top-2 right-2 z-20
            text-[8px] font-medium px-[5px] py-[2.5px] rounded-full
            border border-white/[0.08] bg-black/70
            text-white/45 uppercase tracking-wide leading-none
          ">
            {TYPE_LABEL[title.type] ?? title.type}
          </span>
        )}

        {/* Persistent bottom gradient */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.25) 35%, transparent 65%)' }}
        />

        {/* ── Desktop hover overlay ─────────────────────────────────────── */}
        <div className="
          hidden md:block
          absolute inset-0 z-20
          opacity-0 group-hover:opacity-100
          transition-opacity duration-[400ms]
          pointer-events-none group-hover:pointer-events-auto
        ">
          {/* Center play — fades in on hover */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              aria-label={`Play ${title.name}`}
              onClick={handlePlay}
              className="
                flex items-center justify-center
                w-12 h-12 rounded-full
                bg-white hover:bg-white/90
                shadow-[0_4px_24px_rgba(0,0,0,0.6)]
                transition-transform duration-200 active:scale-90
                scale-90 group-hover:scale-100
              "
              style={{ touchAction: 'manipulation', transition: 'transform 400ms cubic-bezier(0.4,0,0.2,1)' }}
            >
              <Play size={18} className="fill-black text-black ml-0.5" />
            </button>
          </div>

          {/* Bottom metadata — slides up on hover */}
          <div
            className="absolute bottom-0 inset-x-0 z-30 px-2.5 pb-2.5 pt-8 translate-y-2 group-hover:translate-y-0"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.4) 70%, transparent)',
              transition: 'transform 400ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <p className="text-[12px] font-semibold text-white leading-tight line-clamp-1 mb-1.5">
              {title.name}
            </p>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1">
                {onAddToList && (
                  <button
                    type="button"
                    aria-label={`Add ${title.name} to list`}
                    onClick={handleAddList}
                    className="
                      flex items-center gap-1 px-2 py-1 rounded-full
                      bg-white/10 border border-white/10
                      text-white/80 hover:text-white hover:bg-white/20
                      text-[10px] font-medium
                      transition-colors duration-150
                    "
                  >
                    <Plus size={10} /> Add
                  </button>
                )}
              </div>
              <button
                type="button"
                aria-label={`Info about ${title.name}`}
                onClick={handleInfo}
                className="
                  flex items-center justify-center
                  w-7 h-7 rounded-full
                  bg-white/10 border border-white/10
                  text-white/80 hover:text-white hover:bg-white/20
                  transition-colors duration-150
                "
              >
                <Info size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar (continue watching) */}
        {showProgress && progressPct > 0 && (
          <div className="absolute bottom-0 inset-x-0 z-30 h-[4px] bg-white/10">
            <div className="h-full rounded-r-full" style={{ width: `${progressPct}%`, background: 'rgba(255,255,255,0.9)' }} />
          </div>
        )}
      </div>

      {/* ── Text below poster ──────────────────────────────────────────── */}
      <div className="mt-2 px-0.5">
            <p className="text-[14px] font-semibold text-white leading-[1.25] line-clamp-2">
          {highlightQuery
            ? <HighlightText text={title.name} query={highlightQuery} />
            : title.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {rating && (
            <span className="flex items-center gap-0.5">
              <Star size={9} className="fill-[#f5c518] text-[#f5c518]" />
              <span className="text-[12px] text-[#8a8a8a]">
                {typeof rating === 'number' ? rating.toFixed(1) : rating}
              </span>
            </span>
          )}
          {title.year && <span className="text-[12px] text-[#8a8a8a]">{title.year}</span>}
        </div>
      </div>
    </div>
  );
});

export default ContentCard;
