/**
 * ContentCard — rebuilt from scratch.
 * Poster (2:3) with hover info overlay on desktop, tap-to-navigate on mobile.
 * New design: elevated glass info panel, animated reveal, clean action row.
 */
import { memo, useState, useCallback, type KeyboardEvent, type MouseEvent } from 'react';
import { Play, Plus, Info, Film, Star } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tmdbSrcSet } from '../../services/tmdb';

/** Highlight matching substring in title text */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase()
          ? <mark key={i} style={{ background: 'rgba(255,255,255,0.22)', color: '#fff', borderRadius: 2, padding: '0 1px' }}>{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

export interface ContentCardProps {
  title: ContentCardTitle;
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

export interface ContentCardTitle {
  id: string;
  name: string;
  posterUrl?: string | null;
  posterColorFrom?: string;
  posterColorTo?: string;
  synopsis?: string;
  genres?: string[];
  rating?: number | string | null;
  imdbRating?: number | string | null;
  voteAverage?: number | string | null;
  year?: number | string | null;
  type?: string;
  originalLanguage?: string;
}

const TYPE_LABEL: Record<string, string> = {
  MOVIE: 'Film', SERIES: 'TV', ANIME: 'Anime',
};

/** ISO 639-1 language codes → short display label shown on the card.
 *  Covers all 20 regions supported by geo.ts plus common Indian languages. */
const LANG_LABEL: Record<string, string> = {
  // Indian languages
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  ml: 'Malayalam',
  kn: 'Kannada',
  mr: 'Marathi',
  bn: 'Bengali',
  pa: 'Punjabi',
  // Global region languages (only show badge for non-English to avoid cluttering EN cards)
  ko: 'Korean',
  ja: 'Japanese',
  pt: 'Portuguese',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  it: 'Italian',
  tr: 'Turkish',
  ru: 'Russian',
  id: 'Indonesian',
  th: 'Thai',
  tl: 'Filipino',
  pl: 'Polish',
  nl: 'Dutch',
  sv: 'Swedish',
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
  const location = useLocation();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError,  setImgError]  = useState(false);

  const hasImage    = !!title.posterUrl && !imgError;
  const rating      = title.rating || title.imdbRating || title.voteAverage;
  const progressPct = durationSeconds > 0
    ? Math.min(100, (progressSeconds / durationSeconds) * 100)
    : 0;

  // Keep the navigation target and its action buttons as sibling elements.
  // This avoids the invalid interactive-element nesting that breaks touch and keyboard input.
  const handleClick = useCallback(() => {
    if (onNavigate) onNavigate(false);
    else nav(`/title/${title.id}`, { state: { from: `${location.pathname}${location.search}` } });
  }, [nav, title.id, onNavigate, location.pathname, location.search]);
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);
  const handlePlay = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onNavigate) onNavigate(true);
    else nav(`/title/${title.id}?play=1`, { state: { from: `${location.pathname}${location.search}` } });
  }, [nav, title.id, onNavigate, location.pathname, location.search]);
  const handleAddList = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onAddToList?.(title.id);
  }, [onAddToList, title.id]);
  const handleInfo = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onNavigate) onNavigate(false);
    else nav(`/title/${title.id}`, { state: { from: `${location.pathname}${location.search}` } });
  }, [nav, title.id, onNavigate, location.pathname, location.search]);

  if (!title?.id) return null;

  return (
    <article
      className={`
        group relative select-none touch-manipulation
        ${fluid ? 'w-full' : 'shrink-0 w-[140px] sm:w-[180px] lg:w-[230px] scroll-snap-start'}
        ${className}
      `}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* ── Poster container — navigation target ───────────────────────── */}
      <div
        role="link"
        tabIndex={0}
        aria-label={`View ${title?.name ?? 'Untitled'}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="
          block relative z-10 w-full rounded-lg overflow-hidden aspect-[2/3]
          bg-[#141414] cursor-pointer
          transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
          md:group-hover:scale-[1.08] md:group-hover:-translate-y-1
          active:scale-[0.97] md:active:scale-100 md:active:translate-y-0
          focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25
        "
        style={{
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          display: 'block',
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
            {tmdbSrcSet(title.posterUrl) && (
              <img
                {...tmdbSrcSet(title.posterUrl)!}
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 230px"
                alt={title?.name ?? 'Untitled'}
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
            )}
          </>
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3"
            style={{
              background: 'radial-gradient(140% 120% at 30% 0%, #1e1e2e, #0A0A0A 75%)',
            }}
          >
            <Film size={22} className="text-white/20" />
            <span className="text-[9px] text-white/25 text-center leading-tight line-clamp-3">
              {title?.name ?? 'Untitled'}
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

        {/* Indian language badge — bottom-left, above progress bar */}
        {title.originalLanguage && LANG_LABEL[title.originalLanguage] && (
          <span className="
            absolute bottom-2 left-2 z-20
            text-[8px] font-semibold px-[5px] py-[2.5px] rounded-full leading-none
            border border-orange-400/30 bg-black/80 text-orange-300/85
          ">
            {LANG_LABEL[title.originalLanguage]}
          </span>
        )}

        {/* Persistent bottom gradient */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.25) 35%, transparent 65%)' }}
        />

        {/* Progress bar (continue watching) */}
        {showProgress && progressPct > 0 && (
          <div className="absolute bottom-0 inset-x-0 z-30 h-[4px] bg-white/10">
            <div className="h-full rounded-r-full" style={{ width: `${progressPct}%`, background: 'rgba(255,255,255,0.9)' }} />
          </div>
        )}
      </div>

      {/* Actions are siblings of the navigation target, never nested inside it. */}
      <div className="hidden md:block absolute inset-0 z-20 opacity-0 md:group-hover:opacity-100 transition-opacity duration-[400ms] pointer-events-none">
        <button
          type="button"
          aria-label={`Play ${title?.name ?? 'Untitled'}`}
          onClick={handlePlay}
          className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 rounded-full bg-white hover:bg-white/90 shadow-[0_4px_24px_rgba(0,0,0,0.6)] transition-transform duration-200 active:scale-90 scale-90 group-hover:scale-100"
          style={{ touchAction: 'manipulation', transition: 'transform 400ms cubic-bezier(0.4,0,0.2,1)' }}
        >
          <Play size={18} className="fill-black text-black ml-0.5" />
        </button>

        <div
          className="absolute bottom-[38px] inset-x-0 z-30 px-2.5 pb-2.5 pt-8 translate-y-2 group-hover:translate-y-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.4) 70%, transparent)',
            transition: 'transform 400ms cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <p className="text-[12px] font-semibold text-white leading-tight line-clamp-1 mb-1.5">{title?.name ?? 'Untitled'}</p>
          <div className="flex items-center justify-between gap-1">
            {onAddToList ? (
              <button
                type="button"
                aria-label={`Add ${title?.name ?? 'Untitled'} to list`}
                onClick={handleAddList}
                className="pointer-events-auto flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 border border-white/10 text-white/80 hover:text-white hover:bg-white/20 text-[10px] font-medium transition-colors duration-150"
              >
                <Plus size={10} /> Add
              </button>
            ) : <span />}
            <button
              type="button"
              aria-label={`Info about ${title?.name ?? 'Untitled'}`}
              onClick={handleInfo}
              className="pointer-events-auto flex items-center justify-center w-7 h-7 rounded-full bg-white/10 border border-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors duration-150"
            >
              <Info size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Text below poster ──────────────────────────────────────────── */}
      <div className="mt-2 px-0.5">
            <p className="text-[14px] font-semibold text-white leading-[1.25] line-clamp-2">
          {highlightQuery
            ? <HighlightText text={title?.name ?? 'Untitled'} query={highlightQuery} />
            : title?.name ?? 'Untitled'}
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
    </article>
  );
});

export default ContentCard;
