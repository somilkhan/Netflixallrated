/**
 * ContentCard — redesigned poster card.
 * Desktop: hover reveals play + info overlay, lifts 1.05x.
 * Mobile: tap navigates; no hover effects, no touch-action conflicts.
 */
import { memo, useState, useCallback } from 'react';
import { Play, Plus, Info, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface ContentCardProps {
  title: any;
  rank?: number;
  showProgress?: boolean;
  progressSeconds?: number;
  durationSeconds?: number;
  className?: string;
  onAddToList?: (titleId: string) => void;
}

const ContentCard = memo(function ContentCard({
  title,
  rank,
  showProgress = false,
  progressSeconds = 0,
  durationSeconds = 0,
  className = '',
  onAddToList,
}: ContentCardProps) {
  const nav = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const hasImage = !!title.posterUrl && !imgError;
  const rating = title.rating || title.imdbRating || title.voteAverage;
  const progressPct = durationSeconds > 0 ? Math.min(100, (progressSeconds / durationSeconds) * 100) : 0;

  const handleClick = useCallback(() => {
    nav(`/title/${title.id}`);
  }, [nav, title.id]);

  const handlePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    nav(`/title/${title.id}?play=1`);
  }, [nav, title.id]);

  const handleAddToList = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToList?.(title.id);
  }, [onAddToList, title.id]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); }
  }, [handleClick]);

  if (!title?.id) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${title.name}${rating ? `, rated ${typeof rating === 'number' ? rating.toFixed(1) : rating}` : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        group relative shrink-0
        w-[148px] md:w-[160px]
        scroll-snap-start cursor-pointer
        touch-manipulation select-none
        focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-xl
        ${className}
      `}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* ── Poster ──────────────────────────────────────────────────────── */}
      <div
        className="
          relative w-full overflow-hidden rounded-xl
          bg-[#141414]
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          md:group-hover:scale-[1.05]
          active:scale-[0.97] md:active:scale-100
        "
        style={{
          aspectRatio: '2/3',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        {/* Shadow on hover — pre-rendered, opacity toggle */}
        <div
          className="
            absolute inset-0 rounded-xl pointer-events-none z-[-1]
            opacity-0 md:group-hover:opacity-100
            transition-opacity duration-300
          "
          style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
          aria-hidden
        />

        {/* Poster image */}
        {hasImage ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 bg-[#1A1A1A] overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
                    animation: 'shimmer 1.8s ease-in-out infinite',
                  }}
                />
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
                transition-opacity duration-300
                ${imgLoaded ? 'opacity-100' : 'opacity-0'}
              `}
            />
          </>
        ) : (
          /* Fallback: gradient placeholder */
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3"
            style={{
              background: `radial-gradient(130% 110% at 30% 0%, ${title.posterColorFrom || '#1f1f1f'}, ${title.posterColorTo || '#0A0A0A'} 72%)`,
            }}
          >
            <Film size={24} className="text-white/20" />
            <span className="text-[9px] text-white/30 text-center leading-tight line-clamp-3 font-medium">
              {title.name}
            </span>
          </div>
        )}

        {/* Rank badge */}
        {rank != null && (
          <div className="
            absolute top-2 left-2 z-20
            h-[22px] w-[22px] flex items-center justify-center
            rounded-full bg-black/70 border border-white/10
            text-[11px] font-semibold text-white/80 leading-none
          ">
            {rank}
          </div>
        )}

        {/* Type badge */}
        {title.type && (
          <span className="
            absolute top-2 right-2 z-20
            text-[9px] font-medium px-[6px] py-[3px] rounded-full
            border border-white/[0.08] bg-black/60
            text-white/50 uppercase tracking-wide leading-none
          ">
            {title.type === 'MOVIE' ? 'Film' : title.type === 'SERIES' ? 'TV' : 'Anime'}
          </span>
        )}

        {/* Gradient overlay — always present, stronger on hover */}
        <div
          className="
            absolute inset-0 pointer-events-none z-10
            transition-opacity duration-300
          "
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 30%, transparent 60%)',
          }}
        />

        {/* ── Desktop hover overlay ─────────────────────────────────────── */}
        <div className="
          hidden md:flex
          absolute inset-0 z-20
          flex-col items-center justify-center
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300
          pointer-events-none group-hover:pointer-events-auto
        ">
          {/* Center play button */}
          <button
            type="button"
            aria-label={`Play ${title.name}`}
            onClick={handlePlay}
            className="
              flex items-center justify-center
              w-12 h-12 rounded-full
              bg-white hover:bg-white/90
              shadow-[0_4px_20px_rgba(0,0,0,0.5)]
              transition-transform duration-200 active:scale-90
              mb-3
            "
            style={{ touchAction: 'manipulation' }}
          >
            <Play size={18} className="fill-black text-black ml-0.5" />
          </button>

          {/* Quick actions row */}
          <div className="absolute bottom-3 inset-x-3 flex items-center justify-between">
            {onAddToList && (
              <button
                type="button"
                aria-label={`Add ${title.name} to list`}
                onClick={handleAddToList}
                className="
                  flex items-center gap-1 px-2.5 py-1.5 rounded-full
                  bg-black/60 border border-white/10
                  text-white/80 hover:text-white hover:border-white/20
                  text-[10px] font-medium
                  transition-colors duration-150
                "
              >
                <Plus size={10} /> List
              </button>
            )}
            <button
              type="button"
              aria-label={`Info about ${title.name}`}
              onClick={(e) => { e.stopPropagation(); nav(`/title/${title.id}`); }}
              className="
                ml-auto flex items-center justify-center
                w-7 h-7 rounded-full
                bg-black/60 border border-white/10
                text-white/80 hover:text-white hover:border-white/20
                transition-colors duration-150
              "
            >
              <Info size={12} />
            </button>
          </div>
        </div>

        {/* Progress bar (continue watching) */}
        {showProgress && progressPct > 0 && (
          <div className="absolute bottom-0 inset-x-0 z-30 h-[3px] bg-white/10">
            <div
              className="h-full bg-white rounded-r-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>

      {/* ── Text below poster ─────────────────────────────────────────── */}
      <div className="mt-2 px-0.5">
        <p className="text-[13px] font-medium text-white leading-tight truncate">
          {title.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {rating && (
            <span className="flex items-center gap-1">
              <svg width="9" height="9" viewBox="0 0 24 24" aria-hidden>
                <polygon
                  points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                  fill="#f5c518"
                />
              </svg>
              <span className="text-[11px] text-[#737373] font-medium">
                {typeof rating === 'number' ? rating.toFixed(1) : rating}
              </span>
            </span>
          )}
          {title.year && (
            <span className="text-[11px] text-[#737373]">{title.year}</span>
          )}
        </div>
      </div>
    </div>
  );
});

export default ContentCard;
