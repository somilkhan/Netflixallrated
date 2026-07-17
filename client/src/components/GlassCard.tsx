/**
 * GlassCard — premium poster card.
 * Mobile: solid panel (no backdrop-blur), no will-change, no gloss.
 * Desktop: glass panel, butter hover with lift + gloss sweep.
 */
import { useState, useRef, memo, useCallback } from 'react';
import { Play, Film } from 'lucide-react';

export interface GlassCardProvider {
  name: string;
  logoUrl: string | null;
}

export interface GlassCardProps {
  posterUrl?: string | null;
  posterColorFrom?: string | null;
  posterColorTo?: string | null;
  title: string;
  typeLabel?: string;
  year?: number | string | null;
  runtimeMinutes?: number | null;
  genres?: string[];
  overview?: string | null;
  ratingLabel?: string | null;
  providers?: GlassCardProvider[];
  rank?: number;
  onClick?: () => void;
  onPlay?: () => void;
  className?: string;
  overlay?: React.ReactNode;
  fluid?: boolean;
  priority?: boolean;
}

const TIER_STYLE: Record<string, string> = {
  PERFECTION: 'text-amber border-amber/40 bg-amber/10',
  GOFORIT:    'text-[#C2434F] border-[#C2434F]/40 bg-[#C2434F]/10',
  TIMEPASS:   'text-[#999] border-[#333] bg-[#1a1a1a]',
  SKIP:       'text-[#555] border-[#222] bg-[#111]',
};
const TIER_LABEL: Record<string, string> = {
  PERFECTION: 'S',
  GOFORIT:    'A',
  TIMEPASS:   'B',
  SKIP:       'C',
};

const GlassCard = memo(function GlassCard({
  posterUrl, posterColorFrom, posterColorTo, title, typeLabel, year, runtimeMinutes,
  genres = [], overview, ratingLabel, providers = [], rank, onClick, onPlay,
  className = '', overlay, fluid = false, priority = false,
}: GlassCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [glossing, setGlossing] = useState(false);
  const glossTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasImage  = !!posterUrl && !errored;
  const runtime   = runtimeMinutes
    ? `${Math.floor(runtimeMinutes / 60)}h ${runtimeMinutes % 60}m`
    : null;
  const tierStyle = ratingLabel ? TIER_STYLE[ratingLabel] : null;
  const tierLabel = ratingLabel ? TIER_LABEL[ratingLabel] : null;
  const hasTier   = !!tierStyle && !!tierLabel;
  const metaParts = [year, runtime].filter(Boolean).join(' · ');

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }
  }, [onClick]);

  const handlePlayClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay ? onPlay() : onClick?.();
  }, [onPlay, onClick]);

  const handleMouseEnter = useCallback(() => {
    if (glossTimer.current) clearTimeout(glossTimer.current);
    setGlossing(true);
    glossTimer.current = setTimeout(() => setGlossing(false), 700);
  }, []);

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? (title || 'View details') : undefined}
      className={`
        relative cursor-pointer group
        focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25
        rounded-[14px]
        ${fluid ? 'w-full' : 'shrink-0 w-[148px] md:w-[168px] scroll-snap-start'}
        ${className}
      `}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      onMouseEnter={handleMouseEnter}
    >
      {/* Inner card — will-change only on desktop (md+) to save mobile GPU memory.
          Shadow via .card-glow opacity-trick (avoids box-shadow repaint). */}
      <div
        className="
          relative w-full poster-ratio rounded-[14px] overflow-hidden
          bg-[#1a1c20] border border-white/[0.07]
          transition-[transform,border-color] duration-300 ease-spring
          md:will-change-transform
          md:group-hover:-translate-y-[8px] md:group-hover:scale-[1.026]
          md:group-hover:border-white/[0.16]
          active:scale-[0.97] md:active:scale-100
        "
      >
        {/* Pre-rendered shadow layer — opacity is composite-only, no repaint */}
        <div className="card-glow hidden md:block" aria-hidden />
        {/* Poster */}
        {hasImage ? (
          <>
            {!loaded && (
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(120deg, #1a1c20 25%, #1f2126 50%, #1a1c20 75%)',
                backgroundSize: '200% 100%',
                animation: 'glShimmer 1.8s ease-in-out infinite',
              }} />
            )}
            <img
              src={posterUrl!}
              alt={title}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              {...{ fetchpriority: priority ? 'high' : 'low' }}
              onLoad={() => setLoaded(true)}
              onError={() => setErrored(true)}
              className={`
                absolute inset-0 h-full w-full object-cover
                transition-opacity duration-500
                ${loaded ? 'opacity-100' : 'opacity-0'}
                md:group-hover:scale-[1.04] md:transition-transform md:duration-350 md:ease-spring
              `}
            />
          </>
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3"
            style={{
              background: `radial-gradient(130% 110% at 30% 0%,
                ${posterColorFrom || '#221416'},
                ${posterColorTo  || '#090909'} 72%)`,
            }}
          >
            <Film size={22} className="text-ink-faint/30" />
            <span className="text-[9px] font-mono text-ink-faint/35 text-center leading-tight line-clamp-3">
              {title}
            </span>
          </div>
        )}

        {/* Gloss sweep — desktop only (no touch hover) */}
        <div
          aria-hidden
          className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-[14px] hidden md:block"
        >
          <div
            className={glossing ? 'card-gloss-sweep' : ''}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '60%',
              height: '100%',
              background: 'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)',
              transform: 'translateX(-150%) skewX(-12deg)',
            }}
          />
        </div>

        {/* Bottom gradient */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: '65%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 35%, transparent 100%)',
          }}
        />

        {/* Top-left: rank or tier — no blur on mobile */}
        {rank != null ? (
          <div className="
            absolute top-2 left-2 z-10
            h-[22px] w-[22px] flex items-center justify-center
            rounded-full bg-black/80 border border-white/[0.12]
            font-serif font-semibold text-[11px] text-ink-dim leading-none
          ">
            {rank}
          </div>
        ) : hasTier ? (
          <span className={`
            absolute top-2 left-2 z-10
            inline-flex items-center justify-center
            rounded-full border w-[20px] h-[20px]
            text-[10px] font-sans font-semibold leading-none
            ${tierStyle}
          `}>
            {tierLabel}
          </span>
        ) : null}

        {/* Top-right: type label — no blur on mobile */}
        {typeLabel && (
          <span className="
            absolute top-2 right-2 z-10
            font-mono text-[7px] px-[6px] py-[2.5px] rounded-full
            border border-white/[0.10] bg-black/60
            text-ink-faint/65 uppercase tracking-[0.08em] leading-none
          ">
            {typeLabel}
          </span>
        )}

        {/* Play button — desktop only */}
        <button
          type="button"
          aria-label={`Play ${title}`}
          onClick={handlePlayClick}
          className="
            hidden md:flex
            absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-[58%]
            items-center justify-center
            opacity-0 scale-75 pointer-events-none
            transition-all duration-300 ease-spring
            group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto
          "
        >
          <span className="absolute inset-[-6px] rounded-full border border-white/25 transition-transform duration-300 ease-spring group-hover:scale-100 scale-90" />
          <span className="
            h-[42px] w-[42px] flex items-center justify-center rounded-full
            bg-white text-black hover:bg-white/88 transition-colors duration-150
            shadow-[0_4px_20px_rgba(0,0,0,0.5)]
          ">
            <Play size={14} className="fill-current ml-[2px]" />
          </span>
        </button>

        {/* Info panel:
            Mobile → solid bg (no backdrop-blur, zero GPU cost)
            Desktop → glass with backdrop-blur */}
        <div className="
          absolute inset-x-0 bottom-0 z-10
          px-2.5 pt-2 pb-2
          border-t border-white/[0.05]
          bg-black/80
          md:bg-black/60 md:backdrop-blur-[14px]
          transition-[background-color] duration-300 ease-spring
          md:group-hover:bg-black/70
        ">
          <p className="text-[11.5px] font-sans font-semibold leading-[1.28] line-clamp-2 text-ink">
            {title}
          </p>

          {metaParts && (
            <p className="mt-[2px] font-mono text-[9px] text-ink-faint/75 truncate leading-none">
              {metaParts}
            </p>
          )}

          {providers.length > 0 && (
            <div className="mt-[5px] flex items-center gap-[4px]">
              {providers.slice(0, 4).map((p) =>
                p.logoUrl ? (
                  <img
                    key={p.name} src={p.logoUrl} alt={p.name} title={p.name}
                    loading="lazy" decoding="async"
                    className="h-[13px] w-[13px] rounded-[3px] object-cover border border-white/[0.07]"
                  />
                ) : (
                  <span
                    key={p.name}
                    className="h-[13px] px-[4px] rounded-[3px] border border-white/[0.07]
                      bg-white/[0.04] text-[6.5px] font-mono flex items-center text-ink-faint"
                  >
                    {p.name.slice(0, 3)}
                  </span>
                )
              )}
            </div>
          )}

          {/* Expanded on hover — desktop only */}
          <div className="hidden md:grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-spring">
            <div className="overflow-hidden">
              {rank != null && hasTier && (
                <span className={`
                  mt-[6px] inline-flex items-center justify-center
                  rounded-full border w-[18px] h-[18px]
                  text-[9px] font-sans font-semibold leading-none ${tierStyle}
                `}>
                  {tierLabel}
                </span>
              )}
              {genres.length > 0 && (
                <div className="mt-[6px] flex flex-wrap gap-[3px]">
                  {genres.slice(0, 2).map((g) => (
                    <span
                      key={g}
                      className="
                        text-[7.5px] font-mono px-[5px] py-[2px] rounded-full
                        border border-white/[0.08] bg-white/[0.04] text-ink-faint/75
                        leading-none
                      "
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
              {overview && (
                <p className="mt-[5px] text-[8.5px] leading-[1.48] text-ink-faint/65 line-clamp-2">
                  {overview}
                </p>
              )}
            </div>
          </div>
        </div>

        {overlay}
      </div>
    </div>
  );
});

export default GlassCard;

// ── Skeleton ─────────────────────────────────────────────────────────────────

export function GlassCardSkeleton({
  className = '',
  fluid = false,
}: {
  className?: string;
  fluid?: boolean;
}) {
  return (
    <div
      className={`
        ${fluid ? 'w-full' : 'shrink-0 w-[148px] md:w-[172px]'}
        ${className}
      `}
    >
      <div className="
        relative w-full poster-ratio rounded-[14px]
        border border-white/[0.05] bg-surface overflow-hidden
      ">
        {/* Single shimmer sweep — no per-element animate-pulse (cheaper to composite) */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(120deg, #1a1c20 25%, #222529 50%, #1a1c20 75%)',
            backgroundSize: '200% 100%',
            animation: 'glShimmer 1.8s ease-in-out infinite',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        <div className="absolute top-2 left-2 h-[20px] w-[20px] rounded-full bg-white/[0.05]" />
        <div className="absolute top-2 right-2 h-[14px] w-[28px] rounded-full bg-white/[0.04]" />
        <div className="absolute inset-x-0 bottom-0 px-2.5 pt-2 pb-2 bg-black/70 border-t border-white/[0.05]">
          <div className="h-[10px] w-[82%] rounded-full bg-white/[0.08] mb-[4px]" />
          <div className="h-[8px] w-[50%] rounded-full bg-white/[0.06] mb-[6px]" />
          <div className="flex gap-[4px]">
            <div className="h-[13px] w-[13px] rounded-[3px] bg-white/[0.06]" />
            <div className="h-[13px] w-[13px] rounded-[3px] bg-white/[0.05]" />
          </div>
        </div>
      </div>
    </div>
  );
}
