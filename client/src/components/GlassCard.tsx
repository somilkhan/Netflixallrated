/**
 * GlassCard — unified premium poster card for every content surface.
 * Design: near-black void, deep mehroon glassmorphism, frosted backdrop-blur.
 */
import { useState, memo } from 'react';
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
}

const TIER_STYLE: Record<string, string> = {
  PERFECTION: 'text-amber border-amber/40 bg-amber/15',
  GOFORIT:    'text-maroon-bright border-maroon-bright/40 bg-maroon-bright/15',
  TIMEPASS:   'text-ink-dim border-line-bright bg-surface-2/70',
  SKIP:       'text-ink-faint border-line bg-surface-2/50',
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
  className = '', overlay, fluid = false,
}: GlassCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const hasImage  = !!posterUrl && !errored;
  const runtime   = runtimeMinutes
    ? `${Math.floor(runtimeMinutes / 60)}h ${runtimeMinutes % 60}m`
    : null;
  const tierStyle = ratingLabel ? TIER_STYLE[ratingLabel] : null;
  const tierLabel = ratingLabel ? TIER_LABEL[ratingLabel] : null;
  const hasTier   = !!tierStyle && !!tierLabel;
  const metaParts = [year, runtime].filter(Boolean).join(' · ');

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? title : undefined}
      className={`
        relative cursor-pointer group
        focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-bright/60
        rounded-[18px]
        ${fluid ? 'w-full' : 'shrink-0 w-[148px] md:w-[172px] scroll-snap-start'}
        ${className}
      `}
      onClick={onClick}
      onKeyDown={onClick
        ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }
        : undefined}
    >
      {/* Inner card */}
      <div className="
        relative w-full poster-ratio rounded-[18px] overflow-hidden
        bg-surface border border-white/[0.06]
        transition-all duration-300 ease-spring will-change-transform
        group-hover:-translate-y-[6px] group-hover:scale-[1.025]
        group-hover:border-maroon/25
        group-hover:shadow-[0_24px_48px_-10px_rgba(0,0,0,0.9),0_0_0_1px_rgba(122,37,48,0.18),0_0_28px_-6px_rgba(194,67,79,0.22)]
      ">
        {/* Poster */}
        {hasImage ? (
          <>
            {!loaded && (
              <div className="absolute inset-0 bg-surface-2" style={{
                background: 'linear-gradient(120deg, #161011 25%, #1D1516 50%, #161011 75%)',
                backgroundSize: '200% 100%',
                animation: 'glShimmer 1.8s ease-in-out infinite',
              }} />
            )}
            <img
              src={posterUrl!}
              alt={title}
              loading="lazy"
              decoding="async"
              onLoad={() => setLoaded(true)}
              onError={() => setErrored(true)}
              className={`
                absolute inset-0 h-full w-full object-cover
                transition-opacity duration-500
                ${loaded ? 'opacity-100' : 'opacity-0'}
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

        {/* Bottom gradient — slim and subtle */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{ height: '60%', background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 40%, transparent 100%)' }}
        />

        {/* Top-left badge: rank OR tier */}
        {rank != null ? (
          <div className="
            absolute top-2 left-2 z-10
            h-[22px] w-[22px] flex items-center justify-center
            rounded-full bg-void/75 border border-white/[0.12] backdrop-blur-md
            font-serif font-semibold text-[11px] text-ink-dim leading-none
          ">
            {rank}
          </div>
        ) : hasTier ? (
          <span className={`
            absolute top-2 left-2 z-10
            inline-flex items-center justify-center
            rounded-full border w-[20px] h-[20px]
            text-[10px] font-sans font-semibold
            backdrop-blur-sm leading-none
            ${tierStyle}
          `}>
            {tierLabel}
          </span>
        ) : null}

        {/* Top-right: type label */}
        {typeLabel && (
          <span className="
            absolute top-2 right-2 z-10
            font-mono text-[7px] px-[6px] py-[2.5px] rounded-full
            border border-white/[0.10] bg-black/50 backdrop-blur-sm
            text-ink-faint/65 uppercase tracking-[0.08em] leading-none
          ">
            {typeLabel}
          </span>
        )}

        {/* Centre play button */}
        <button
          type="button"
          aria-label={`Play ${title}`}
          onClick={(e) => {
            e.stopPropagation();
            onPlay ? onPlay() : onClick?.();
          }}
          className="
            absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%]
            h-[40px] w-[40px] flex items-center justify-center rounded-full
            bg-white/[0.10] border border-white/[0.16] backdrop-blur-md text-ink
            opacity-0 scale-75 pointer-events-none
            transition-all duration-250 ease-spring
            group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto
            hover:bg-maroon/80 hover:border-maroon-bright/50
            hover:shadow-[0_0_20px_-2px_rgba(194,67,79,0.6)]
          "
        >
          <Play size={13} className="fill-current ml-[2px]" />
        </button>

        {/* Glass info panel */}
        <div className="
          absolute inset-x-0 bottom-0 z-10
          px-2.5 pt-2 pb-2
          bg-black/50 backdrop-blur-[16px]
          border-t border-white/[0.06]
          transition-all duration-300 ease-spring
          group-hover:pb-[10px]
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
              {providers.slice(0, 4).map((p, i) =>
                p.logoUrl ? (
                  <img
                    key={i} src={p.logoUrl} alt={p.name} title={p.name}
                    loading="lazy" decoding="async"
                    className="h-[13px] w-[13px] rounded-[3px] object-cover border border-white/[0.07]"
                  />
                ) : (
                  <span
                    key={i}
                    className="h-[13px] px-[4px] rounded-[3px] border border-white/[0.07]
                      bg-white/[0.04] text-[6.5px] font-mono flex items-center text-ink-faint"
                  >
                    {p.name.slice(0, 3)}
                  </span>
                )
              )}
            </div>
          )}

          {/* Expanded on hover */}
          <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-spring">
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
                        border border-white/[0.07] bg-white/[0.03] text-ink-faint/70
                        leading-none
                      "
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
              {overview && (
                <p className="mt-[5px] text-[8.5px] leading-[1.45] text-ink-faint/65 line-clamp-2">
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
        relative w-full poster-ratio rounded-[18px]
        border border-white/[0.05] bg-surface overflow-hidden
      ">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(120deg, #161011 25%, #1D1516 50%, #161011 75%)',
            backgroundSize: '200% 100%',
            animation: 'glShimmer 1.8s ease-in-out infinite',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        <div className="absolute top-2 left-2 h-[20px] w-[20px] rounded-full bg-white/[0.05] animate-pulse" />
        <div className="absolute top-2 right-2 h-[14px] w-[28px] rounded-full bg-white/[0.04] animate-pulse" />
        <div className="absolute inset-x-0 bottom-0 px-2.5 pt-2 pb-2 bg-black/38 backdrop-blur-[14px] border-t border-white/[0.05]">
          <div className="h-[10px] w-[82%] rounded-full bg-white/[0.08] animate-pulse mb-[4px]" />
          <div className="h-[8px] w-[50%] rounded-full bg-white/[0.06] animate-pulse mb-[6px]" />
          <div className="flex gap-[4px]">
            <div className="h-[13px] w-[13px] rounded-[3px] bg-white/[0.06] animate-pulse" />
            <div className="h-[13px] w-[13px] rounded-[3px] bg-white/[0.05] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
