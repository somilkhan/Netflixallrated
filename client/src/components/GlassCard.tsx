/**
 * GlassCard — the unified premium poster card for every content surface in
 * NetflixAllRated (Home rows, Movies, TV, Anime, Search, Categories,
 * Recommendations, Similar titles, Watchlist, Continue Watching).
 *
 * Design language: near-black void, deep mehroon/burgundy glassmorphism,
 * frosted backdrop-blur, thin glass borders, soft burgundy glow on hover.
 *
 * Layout:
 *  · 2:3 poster fills the card — almost no wasted space
 *  · Rounded corners 22px
 *  · Slim frosted glass panel anchored to the bottom:
 *      — Title (up to 2 lines)
 *      — Year · Runtime · Genre (one mono line)
 *      — Streaming provider logos
 *  · Floating badges:
 *      — Top-left: tier rating  OR  rank number (rank takes priority)
 *      — Top-right: media type label
 *  · On hover (desktop): lift -2px + scale 1.03, stronger burgundy glow,
 *      centred play button fades in, panel expands to reveal
 *      genre chips + overview snippet
 *  · `fluid` prop: fills parent width (for grid layouts)
 */
import { useState } from 'react';
import { Play, Star, Film } from 'lucide-react';

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
  PERFECTION: 'Perfection',
  GOFORIT:    'Go For It',
  TIMEPASS:   'Timepass',
  SKIP:       'Skip',
};

export default function GlassCard({
  posterUrl, posterColorFrom, posterColorTo, title, typeLabel, year, runtimeMinutes,
  genres = [], overview, ratingLabel, providers = [], rank, onClick, onPlay,
  className = '', overlay, fluid = false,
}: GlassCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const hasImage     = !!posterUrl && !errored;
  const runtime      = runtimeMinutes
    ? `${Math.floor(runtimeMinutes / 60)}h ${runtimeMinutes % 60}m`
    : null;
  const tierStyle    = ratingLabel ? TIER_STYLE[ratingLabel] : null;
  const tierLabel    = ratingLabel ? TIER_LABEL[ratingLabel] : null;
  const hasTier      = !!tierStyle && !!tierLabel;
  const metaParts    = [year, runtime, genres[0]].filter(Boolean).join(' · ');

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? title : undefined}
      className={`
        relative cursor-pointer group
        focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-bright/70
        rounded-[22px]
        ${fluid ? 'w-full' : 'shrink-0 w-[148px] md:w-[178px] scroll-snap-start'}
        ${className}
      `}
      onClick={onClick}
      onKeyDown={onClick
        ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }
        : undefined
      }
    >
      {/* ── Inner card — carries the poster-ratio and all visual layers ── */}
      <div
        className="
          relative w-full poster-ratio rounded-[22px] overflow-hidden
          bg-surface border border-white/[0.07]
          transition-all duration-300 ease-out will-change-transform
          group-hover:-translate-y-[7px] group-hover:scale-[1.03]
          group-hover:border-maroon/30
          group-hover:shadow-[0_28px_56px_-10px_rgba(0,0,0,0.85),0_0_0_1px_rgba(122,37,48,0.22),0_0_36px_-4px_rgba(194,67,79,0.32)]
        "
      >
        {/* ── Poster ── */}
        {hasImage ? (
          <>
            {!loaded && (
              <div className="absolute inset-0 bg-surface-2 animate-pulse" />
            )}
            <img
              src={posterUrl!}
              alt={title}
              loading="lazy"
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
            <Film size={24} className="text-ink-faint/35" />
            <span className="text-[9px] font-mono text-ink-faint/40 text-center leading-tight line-clamp-3">
              {title}
            </span>
          </div>
        )}

        {/* ── Gradient vignette — slim bottom only ── */}
        <div
          className="
            absolute inset-x-0 bottom-0 pointer-events-none
            transition-opacity duration-300
          "
          style={{ height: '55%', background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.22) 45%, transparent 100%)' }}
        />

        {/* ── Top-left badge: rank (takes priority) OR tier ── */}
        {rank != null ? (
          <div className="
            absolute top-2.5 left-2.5 z-10
            h-[26px] w-[26px] flex items-center justify-center
            rounded-full bg-void/80 border border-white/[0.14] backdrop-blur-md
            font-serif font-bold text-[12px] text-ink-dim leading-none
          ">
            {rank}
          </div>
        ) : hasTier ? (
          <span className={`
            absolute top-2.5 left-2.5 z-10
            inline-flex items-center gap-[3px] rounded-full border
            px-[7px] py-[3px] text-[7.5px] font-mono uppercase tracking-[0.07em]
            backdrop-blur-sm leading-none
            ${tierStyle}
          `}>
            <Star size={6} className="fill-current shrink-0" />
            {tierLabel}
          </span>
        ) : null}

        {/* ── Top-right badge: media type ── */}
        {typeLabel && (
          <span className="
            absolute top-2.5 right-2.5 z-10
            font-mono text-[7.5px] px-[7px] py-[3px] rounded-full
            border border-white/[0.11] bg-black/55 backdrop-blur-sm
            text-ink-faint/75 uppercase tracking-[0.07em] leading-none
          ">
            {typeLabel}
          </span>
        )}

        {/* ── Centre play button — appears on hover ── */}
        <button
          type="button"
          aria-label={`Play ${title}`}
          onClick={(e) => {
            e.stopPropagation();
            onPlay ? onPlay() : onClick?.();
          }}
          className="
            absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-[58%]
            h-[42px] w-[42px] flex items-center justify-center rounded-full
            bg-white/[0.12] border border-white/[0.18] backdrop-blur-md text-ink
            opacity-0 scale-75 pointer-events-none
            transition-all duration-300 ease-out
            group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto
            hover:bg-maroon/90 hover:border-maroon-bright/60
            hover:shadow-[0_0_22px_-2px_rgba(194,67,79,0.7)]
          "
        >
          <Play size={15} className="fill-current ml-[2px]" />
        </button>

        {/* ── Frosted glass info panel ── */}
        <div className="
          absolute inset-x-0 bottom-0 z-10
          px-2.5 pt-[9px] pb-[9px]
          bg-black/55 backdrop-blur-[18px]
          border-t border-white/[0.07]
          transition-all duration-300 ease-out
          group-hover:bg-black/68 group-hover:pb-[11px]
        ">
          {/* Title — up to 2 lines */}
          <p className="
            text-[12px] font-semibold leading-[1.25] line-clamp-2 text-ink
          ">
            {title}
          </p>

          {/* Year · Runtime · Genre */}
          {metaParts && (
            <p className="mt-[3px] font-mono text-[9.5px] text-ink-faint/80 truncate leading-none">
              {metaParts}
            </p>
          )}

          {/* Provider logos */}
          {providers.length > 0 && (
            <div className="mt-[6px] flex items-center gap-[5px]">
              {providers.slice(0, 4).map((p, i) =>
                p.logoUrl ? (
                  <img
                    key={i} src={p.logoUrl} alt={p.name} title={p.name}
                    className="h-[15px] w-[15px] rounded-[3px] object-cover border border-white/[0.08]"
                  />
                ) : (
                  <span
                    key={i}
                    className="h-[15px] px-[5px] rounded-[3px] border border-white/[0.08]
                      bg-white/[0.05] text-[7px] font-mono flex items-center text-ink-faint"
                  >
                    {p.name.slice(0, 3)}
                  </span>
                )
              )}
            </div>
          )}

          {/* ── Expanded content on hover ── */}
          <div className="
            grid grid-rows-[0fr] group-hover:grid-rows-[1fr]
            transition-[grid-template-rows] duration-300 ease-out
          ">
            <div className="overflow-hidden">
              {/* Tier chip when rank occupies top-left */}
              {rank != null && hasTier && (
                <span className={`
                  mt-[7px] inline-flex items-center gap-[3px] rounded-full border
                  px-[7px] py-[3px] text-[7.5px] font-mono uppercase tracking-[0.07em]
                  leading-none ${tierStyle}
                `}>
                  <Star size={6} className="fill-current" />{tierLabel}
                </span>
              )}

              {/* Genre chips */}
              {genres.length > 0 && (
                <div className="mt-[7px] flex flex-wrap gap-1">
                  {genres.slice(0, 2).map((g) => (
                    <span
                      key={g}
                      className="
                        text-[8px] font-mono px-[6px] py-[2.5px] rounded-full
                        border border-white/[0.08] bg-white/[0.04] text-ink-dim/75
                        leading-none
                      "
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Overview snippet */}
              {overview && (
                <p className="mt-[6px] text-[9px] leading-[1.45] text-ink-faint/70 line-clamp-3">
                  {overview}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Caller-provided overlay (e.g. AniList score badge, import states) */}
        {overlay}
      </div>
    </div>
  );
}

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
        ${fluid ? 'w-full' : 'shrink-0 w-[148px] md:w-[178px]'}
        ${className}
      `}
    >
      <div className="
        relative w-full poster-ratio rounded-[22px]
        border border-white/[0.06] bg-surface overflow-hidden
      ">
        {/* Shimmer body */}
        <div className="
          absolute inset-0
          bg-gradient-to-br from-surface-2 via-surface to-surface-2
          bg-[length:200%_200%]
          animate-[glShimmer_1.8s_ease-in-out_infinite]
        " />

        {/* Subtle bottom vignette */}
        <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        {/* Fake badge placeholders */}
        <div className="absolute top-2.5 left-2.5 h-[22px] w-[44px] rounded-full bg-white/[0.06] animate-pulse" />
        <div className="absolute top-2.5 right-2.5 h-[18px] w-[32px] rounded-full bg-white/[0.05] animate-pulse" />

        {/* Glass panel */}
        <div className="
          absolute inset-x-0 bottom-0 px-2.5 pt-2.5 pb-[11px]
          bg-black/40 backdrop-blur-[18px] border-t border-white/[0.06]
        ">
          <div className="h-3 w-[82%] rounded-full bg-white/[0.09] animate-pulse mb-[5px]" />
          <div className="h-2.5 w-[55%] rounded-full bg-white/[0.07] animate-pulse mb-[7px]" />
          <div className="flex gap-[5px]">
            <div className="h-[15px] w-[15px] rounded-[3px] bg-white/[0.07] animate-pulse" />
            <div className="h-[15px] w-[15px] rounded-[3px] bg-white/[0.06] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
