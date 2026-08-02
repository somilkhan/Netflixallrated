/**
 * Card — Unified Netflix-style content card.
 * Variants: poster (default) | top10 | continue-watching | backdrop
 * Zero hardcoded colors — uses design tokens via inline styles for color,
 * Tailwind classes for layout.
 */
import { memo, useState, useCallback, type KeyboardEvent, type MouseEvent } from 'react';
import { Play, Plus, Info, Film, Star, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { colors, radius, transitions, shadows, zIndex } from '../../lib/design-tokens';

// ── Types ───────────────────────────────────────────────────────────

export interface CardData {
  id: string;
  name: string;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  year?: number | string | null;
  type?: string;
  genres?: string[];
  rating?: number | string | null;
  originalLanguage?: string;
}

export interface CardProgress {
  seconds: number;
  duration: number;
}

export type RankStyle = 'badge' | 'top10';
export type CardVariant = 'poster' | 'backdrop' | 'top10' | 'continue-watching';

export interface CardProps {
  data: CardData;
  variant?: CardVariant;
  rank?: number;
  rankStyle?: RankStyle;
  fluid?: boolean;
  className?: string;
  highlightQuery?: string;
  progress?: CardProgress;
  episodeLabel?: string;
  onNavigate?: (play?: boolean) => void;
  onAddToList?: () => void;
  onRemove?: () => void;
  isResolving?: boolean;
  imageSrc?: string;
  imageSrcSet?: string;
  imageSizes?: string;
  imageReferrerPolicy?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  MOVIE: 'Film',
  SERIES: 'TV',
  ANIME: 'Anime',
};

const LANG_LABEL: Record<string, string> = {
  hi: 'Hindi', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam',
  kn: 'Kannada', mr: 'Marathi', bn: 'Bengali', pa: 'Punjabi',
  ko: 'Korean', ja: 'Japanese', pt: 'Portuguese', fr: 'French',
  de: 'German', es: 'Spanish', it: 'Italian', tr: 'Turkish',
  ru: 'Russian', id: 'Indonesian', th: 'Thai', tl: 'Filipino',
  pl: 'Polish', nl: 'Dutch', sv: 'Swedish',
};

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase()
          ? <mark key={i} className="bg-white/20 text-white rounded-sm px-px">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

// ── Component ───────────────────────────────────────────────────────

const Card = memo(function Card({
  data,
  variant = 'poster',
  rank,
  rankStyle = 'badge',
  fluid = false,
  className = '',
  highlightQuery = '',
  progress,
  episodeLabel,
  onNavigate,
  onAddToList,
  onRemove,
  isResolving = false,
  imageSrc = '',
  imageSrcSet,
  imageSizes,
  imageReferrerPolicy,
}: CardProps) {
  const nav = useNavigate();
  const location = useLocation();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isBackdrop = variant === 'backdrop';
  const isContinueWatching = variant === 'continue-watching';

  const hasImage = !!imageSrc && !imgError;
  const rating = data.rating;
  const progressPct = progress && progress.duration > 0
    ? Math.min(100, (progress.seconds / progress.duration) * 100)
    : 0;

  // Navigation handlers
  const handleClick = useCallback(() => {
    if (onNavigate) onNavigate(false);
    else nav(`/title/${data.id}`, { state: { from: `${location.pathname}${location.search}` } });
  }, [nav, data.id, onNavigate, location.pathname, location.search]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  const handlePlay = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onNavigate) onNavigate(true);
    else nav(`/title/${data.id}?play=1`, { state: { from: `${location.pathname}${location.search}` } });
  }, [nav, data.id, onNavigate, location.pathname, location.search]);

  const handleAddList = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onAddToList?.();
  }, [onAddToList]);

  const handleInfo = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onNavigate) onNavigate(false);
    else nav(`/title/${data.id}`, { state: { from: `${location.pathname}${location.search}` } });
  }, [nav, data.id, onNavigate, location.pathname, location.search]);

  const handleRemove = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onRemove?.();
  }, [onRemove]);

  if (!data.id) return null;

  const aspectClass = isBackdrop ? 'aspect-[16/9]' : 'aspect-[2/3]';
  const widthClass = fluid
    ? 'w-full'
    : isBackdrop
      ? 'shrink-0 w-[280px] sm:w-[320px] lg:w-[400px] scroll-snap-start'
      : 'shrink-0 w-[140px] sm:w-[180px] lg:w-[230px] scroll-snap-start';

  return (
    <article
      className={`group relative select-none touch-manipulation ${widthClass} ${className}`}
      style={{
        WebkitTapHighlightColor: 'transparent',
        transition: `transform ${transitions.slow}, z-index 0ms 350ms`,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.zIndex = String(zIndex.overlay);
        el.style.transform = 'scale(1.4)';
        el.style.transition = `transform ${transitions.slow}, z-index 0ms`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'scale(1)';
        el.style.transition = `transform ${transitions.slow}, z-index 0ms 350ms`;
        setTimeout(() => { el.style.zIndex = ''; }, 350);
      }}
    >
      {/* Poster / Backdrop container */}
      <div
        role="link"
        tabIndex={0}
        aria-label={`View ${data.name ?? 'Untitled'}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          block relative w-full overflow-hidden ${aspectClass}
          cursor-pointer
          active:scale-[0.97] md:active:scale-100
          focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25
        `}
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          boxShadow: shadows.md,
          display: 'block',
        }}
      >
        {/* Glow layer */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 md:group-hover:opacity-100 transition-opacity duration-[400ms]"
          style={{ zIndex: -1, borderRadius: radius.md, boxShadow: shadows.lg }}
          aria-hidden
        />

        {/* Image */}
        {hasImage ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: colors.surface }}>
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${colors.overlayLight} 50%, transparent)`,
                    animation: 'shimmer 1.8s ease-in-out infinite',
                  }}
                />
              </div>
            )}
            <img
              src={imageSrc}
              srcSet={imageSrcSet}
              sizes={imageSizes}
              alt={data.name ?? 'Untitled'}
              loading="lazy"
              decoding="async"
              referrerPolicy={imageReferrerPolicy}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`
                absolute inset-0 w-full h-full object-cover
                transition-opacity duration-[400ms]
                md:group-hover:opacity-40
                ${imgLoaded ? 'opacity-100' : 'opacity-0'}
              `}
            />
          </>
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3"
            style={{
              background: `radial-gradient(140% 120% at 30% 0%, #1e1e2e, ${colors.page} 75%)`,
            }}
          >
            <Film size={22} style={{ color: colors.textDisabled }} />
            <span className="text-3xs text-white/25 text-center leading-tight line-clamp-3">
              {data.name ?? 'Untitled'}
            </span>
          </div>
        )}

        {/* Rank — Top 10 style */}
        {rank != null && rankStyle === 'top10' && (
          <span
            className="absolute -left-1 bottom-0 font-black leading-none tracking-tighter select-none pointer-events-none"
            style={{
              fontSize: 'clamp(64px, 10vw, 96px)',
              color: 'transparent',
              WebkitTextStroke: `2px ${colors.borderDefault}`,
              fontFamily: 'Inter, system-ui, sans-serif',
              transform: 'translateY(16px)',
              zIndex: zIndex.content,
            }}
            aria-hidden
          >
            {rank}
          </span>
        )}

        {/* Rank — Badge style */}
        {rank != null && rankStyle === 'badge' && (
          <div
            className="absolute top-2 left-2 flex items-center justify-center h-[22px] min-w-[22px] px-1 text-2xs font-bold text-white/80 leading-none"
            style={{
              zIndex: zIndex.content,
              borderRadius: radius.full,
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: `1px solid ${colors.borderDefault}`,
            }}
          >
            {rank}
          </div>
        )}

        {/* Type badge */}
        {data.type && (
          <span
            className="absolute top-2 right-2 text-[8px] font-medium px-[5px] py-[2.5px] uppercase tracking-wide leading-none"
            style={{
              zIndex: zIndex.content,
              borderRadius: radius.full,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: colors.textTertiary,
            }}
          >
            {TYPE_LABEL[data.type] ?? data.type}
          </span>
        )}

        {/* Language badge */}
        {data.originalLanguage && LANG_LABEL[data.originalLanguage] && (
          <span
            className="absolute bottom-2 left-2 text-[8px] font-semibold px-[5px] py-[2.5px] leading-none"
            style={{
              zIndex: zIndex.content,
              borderRadius: radius.full,
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: colors.warning,
              border: `1px solid ${colors.warning}30`,
            }}
          >
            {LANG_LABEL[data.originalLanguage]}
          </span>
        )}

        {/* Episode label (continue watching) */}
        {episodeLabel && (
          <span
            className="absolute left-2 top-2 z-30 text-2xs font-medium px-1.5 py-1 leading-none"
            style={{
              borderRadius: radius.md,
              backgroundColor: 'rgba(0,0,0,0.75)',
              border: `1px solid ${colors.borderDefault}`,
              color: colors.textSecondary,
            }}
          >
            {episodeLabel}
          </span>
        )}

        {/* Bottom gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: zIndex.base, background: colors.gradientHero }}
        />

        {/* Progress bar — Netflix spec: h-3px, #e50914, no radius */}
        {isContinueWatching && progress && progressPct > 0 && (
          <div
            className="absolute bottom-0 inset-x-0"
            style={{ zIndex: zIndex.content, height: '3px', backgroundColor: colors.buttonSecondary }}
          >
            <div
              className="h-full"
              style={{ width: `${progressPct}%`, backgroundColor: colors.primary, borderRadius: 0 }}
            />
          </div>
        )}

        {/* Resolving spinner */}
        {isResolving && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40">
            <div
              className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: colors.borderHover, borderTopColor: colors.textPrimary }}
            />
          </div>
        )}

        {/* Remove button (continue watching) */}
        {isContinueWatching && onRemove && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 z-30 flex h-7 w-7 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
            style={{
              backgroundColor: 'rgba(0,0,0,0.75)',
              border: `1px solid ${colors.borderDefault}`,
              color: colors.textSecondary,
            }}
            title="Remove from history"
            aria-label="Remove from history"
          >
            <X size={10} strokeWidth={2.5} />
          </button>
        )}

        {/* Hover overlay — centered Play button */}
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 opacity-0 md:group-hover:opacity-100 transition-opacity duration-[400ms] pointer-events-none"
          aria-hidden
        >
          <button
            type="button"
            onClick={handlePlay}
            className="pointer-events-auto w-12 h-12 rounded-full bg-white hover:bg-white/90 flex items-center justify-center text-black transition-transform duration-200 active:scale-90 scale-90 group-hover:scale-100"
            style={{ touchAction: 'manipulation', boxShadow: shadows.hero }}
          >
            <Play size={20} className="fill-current ml-0.5" />
          </button>
        </div>
      </div>

      {/* Expanded hover info panel (poster variants only) */}
      {!isBackdrop && (
        <div
          className="hidden md:block absolute -bottom-[90px] left-0 right-0 opacity-0 md:group-hover:opacity-100 transition-opacity duration-[300ms] pointer-events-none"
          style={{ zIndex: zIndex.overlay }}
        >
          <div
            className="absolute -bottom-[72px] inset-x-0 px-2.5 pb-2.5 pt-6"
            style={{
              borderRadius: `0 0 ${radius.md} ${radius.md}`,
              background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.4) 80%, transparent 100%)',
            }}
          >
            {/* Action row */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <button
                type="button"
                aria-label={`Play ${data.name ?? 'Untitled'}`}
                onClick={handlePlay}
                className="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-white/90 transition-colors"
              >
                <Play size={12} className="fill-black text-black ml-0.5" />
              </button>
              {onAddToList && (
                <button
                  type="button"
                  aria-label={`Add ${data.name ?? 'Untitled'} to list`}
                  onClick={handleAddList}
                  className="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full border text-white hover:border-white transition-colors"
                  style={{ borderColor: colors.borderHover }}
                >
                  <Plus size={12} />
                </button>
              )}
              <div className="flex-1" />
              <button
                type="button"
                aria-label={`Info about ${data.name ?? 'Untitled'}`}
                onClick={handleInfo}
                className="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full border text-white hover:border-white transition-colors"
                style={{ borderColor: colors.borderHover }}
              >
                <Info size={12} />
              </button>
            </div>

            {/* Metadata row */}
            <div className="flex items-center gap-1.5 mb-1">
              {rating && typeof rating === 'number' && rating >= 7.5 && (
                <span className="text-3xs font-bold leading-none" style={{ color: colors.success }}>
                  {Math.round(rating * 10)}% Match
                </span>
              )}
              {data.year && (
                <span className="text-3xs leading-none" style={{ color: colors.textSecondary }}>
                  {data.year}
                </span>
              )}
              {data.type && (
                <span className="text-3xs leading-none uppercase" style={{ color: colors.textTertiary }}>
                  {TYPE_LABEL[data.type] ?? data.type}
                </span>
              )}
            </div>

            {/* Genre pills */}
            {data.genres && data.genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {data.genres.slice(0, 3).map((g) => (
                  <span key={g} className="text-[8px] leading-none" style={{ color: colors.textTertiary }}>
                    {g}
                    {g !== data.genres[Math.min(2, data.genres.length - 1)] && (
                      <span className="ml-1" style={{ color: colors.textDisabled }}>·</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Text below poster */}
      <div className="mt-2 px-0.5">
        <p className="text-md font-semibold text-white leading-[1.25] line-clamp-2">
          {highlightQuery
            ? <HighlightText text={data.name ?? 'Untitled'} query={highlightQuery} />
            : data.name ?? 'Untitled'}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {rating && (
            <span className="flex items-center gap-0.5">
              <Star size={9} className="fill-[#f5c518] text-[#f5c518]" />
              <span className="text-sm" style={{ color: colors.textSecondary }}>
                {typeof rating === 'number' ? rating.toFixed(1) : rating}
              </span>
            </span>
          )}
          {data.year && (
            <span className="text-sm" style={{ color: colors.textSecondary }}>{data.year}</span>
          )}
        </div>
      </div>
    </article>
  );
});

export default Card;
