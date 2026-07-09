/**
 * GlassCard — shared premium poster card used for movies, TV, anime and TMDB
 * results across the app (Home rows, search grid, geo rows). Poster fills the
 * card, a frosted-glass panel anchors info at the bottom, and hovering
 * expands the panel to reveal genres/overview plus a center Play button.
 *
 * Pure presentational component — callers own click/navigation/import
 * behaviour and can render extra overlays (e.g. "Adding…") as `overlay`.
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
}

const TIER_STYLE: Record<string, string> = {
  PERFECTION: 'text-amber border-amber/40 bg-amber/10',
  GOFORIT: 'text-maroon-bright border-maroon-bright/40 bg-maroon-bright/10',
  TIMEPASS: 'text-ink-dim border-line-bright bg-surface-2/60',
  SKIP: 'text-ink-faint border-line bg-surface-2/40',
};
const TIER_LABEL: Record<string, string> = {
  PERFECTION: 'Perfection', GOFORIT: 'Go For It', TIMEPASS: 'Timepass', SKIP: 'Skip',
};

export default function GlassCard({
  posterUrl, posterColorFrom, posterColorTo, title, typeLabel, year, runtimeMinutes,
  genres = [], overview, ratingLabel, providers = [], rank, onClick, onPlay, className = '', overlay,
}: GlassCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const hasImage = !!posterUrl && !errored;
  const runtime = runtimeMinutes ? `${Math.floor(runtimeMinutes / 60)}h ${runtimeMinutes % 60}m` : null;
  const tierChip = ratingLabel && TIER_STYLE[ratingLabel] ? (
    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-[1px] text-[9px] font-mono uppercase tracking-wide ${TIER_STYLE[ratingLabel]}`}>
      <Star size={9} className="fill-current" />{TIER_LABEL[ratingLabel]}
    </span>
  ) : null;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`relative shrink-0 w-[142px] md:w-[172px] cursor-pointer scroll-snap-start group focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-bright/70 rounded-[20px] ${className}`}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      <div
        className="relative w-full poster-ratio rounded-[20px] overflow-hidden border border-white/[0.08]
          bg-surface transition-all duration-300 ease-out
          group-hover:-translate-y-1.5 group-hover:scale-[1.03] group-hover:border-maroon-bright/50
          group-hover:shadow-[0_20px_44px_-14px_rgba(0,0,0,0.65),0_0_0_1px_rgba(194,67,79,0.35),0_0_28px_-6px_rgba(194,67,79,0.45)]"
      >
        {/* Poster / fallback */}
        {hasImage ? (
          <>
            {!loaded && <div className="absolute inset-0 bg-surface-2 animate-pulse" />}
            <img
              src={posterUrl!}
              alt={title}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              onError={() => setErrored(true)}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: `radial-gradient(120% 100% at 30% 0%, ${posterColorFrom || '#1a1510'}, ${posterColorTo || '#0a0908'} 70%)` }}
          >
            <Film size={28} className="text-ink-faint/50" />
          </div>
        )}

        {/* Dark gradient for readability, deepens on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent pointer-events-none transition-opacity duration-300 group-hover:from-black/92" />

        {/* Rank */}
        {rank && (
          <span
            className="absolute top-1 left-2 z-10 font-serif font-bold text-[36px] text-transparent leading-none pointer-events-none"
            style={{ WebkitTextStroke: '1px rgba(245,240,236,0.32)' }}
          >
            {String(rank).padStart(2, '0')}
          </span>
        )}

        {/* Type badge */}
        {typeLabel && (
          <span className="absolute top-2 right-2 z-10 font-mono text-[8.5px] px-1.5 py-0.5 rounded-full border border-white/15 bg-black/40 backdrop-blur-sm text-ink-faint uppercase tracking-wide">
            {typeLabel}
          </span>
        )}

        {/* Center play button on hover */}
        <button
          type="button"
          aria-label={`Play ${title}`}
          onClick={(e) => { e.stopPropagation(); onPlay ? onPlay() : onClick?.(); }}
          className="absolute inset-0 z-10 m-auto h-10 w-10 flex items-center justify-center rounded-full
            bg-white/10 border border-white/25 backdrop-blur-md text-ink
            opacity-0 scale-75 pointer-events-none
            transition-all duration-300 ease-out
            group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto
            hover:bg-maroon-bright/80 hover:border-maroon-bright hover:shadow-[0_0_18px_rgba(194,67,79,0.65)]"
        >
          <Play size={15} className="fill-current ml-0.5" />
        </button>

        {/* Frosted glass info panel — expands on hover */}
        <div
          className="absolute inset-x-0 bottom-0 z-10 px-2.5 pt-2 pb-2 bg-black/45 backdrop-blur-md
            border-t border-white/[0.08] transition-all duration-300 ease-out
            group-hover:pb-2.5 group-hover:bg-black/60"
        >
          <div className="text-[12.5px] font-semibold text-ink truncate leading-tight">{title}</div>
          <div className="mt-1 flex items-center gap-1.5 min-w-0">
            {tierChip}
            <span className="font-mono text-[10px] text-ink-faint truncate">
              {[year, runtime].filter(Boolean).join(' · ')}
            </span>
          </div>

          {providers.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1">
              {providers.slice(0, 4).map((p, i) => (
                p.logoUrl ? (
                  <img key={i} src={p.logoUrl} alt={p.name} title={p.name} className="h-4 w-4 rounded-[4px] object-cover border border-white/10" />
                ) : (
                  <span key={i} className="h-4 px-1 rounded-[4px] border border-white/10 bg-white/5 text-[8px] font-mono flex items-center text-ink-faint">
                    {p.name.slice(0, 3)}
                  </span>
                )
              ))}
            </div>
          )}

          {/* Expanded content — genres + overview, revealed on hover */}
          <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
            <div className="overflow-hidden">
              {genres.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {genres.slice(0, 2).map((g) => (
                    <span key={g} className="text-[8.5px] font-mono px-1.5 py-0.5 rounded-full border border-white/10 text-ink-dim">{g}</span>
                  ))}
                </div>
              )}
              {overview && (
                <p className="mt-1.5 text-[9.5px] leading-snug text-ink-dim line-clamp-3">{overview}</p>
              )}
            </div>
          </div>
        </div>

        {overlay}
      </div>
    </div>
  );
}

export function GlassCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`shrink-0 w-[142px] md:w-[172px] ${className}`}>
      <div className="relative w-full poster-ratio rounded-[20px] border border-white/[0.08] bg-surface overflow-hidden">
        <div className="absolute inset-0 bg-surface-2 animate-pulse" />
        <div className="absolute inset-x-0 bottom-0 p-2.5 bg-black/40 backdrop-blur-md border-t border-white/[0.06]">
          <div className="h-3 w-4/5 rounded bg-white/10 animate-pulse" />
          <div className="mt-1.5 h-2.5 w-1/2 rounded bg-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
