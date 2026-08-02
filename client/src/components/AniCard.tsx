/**
 * AniCard — Netflix-style poster card for AniList anime results.
 * Visual design matches ContentCard exactly. Navigation resolves the
 * AniList ID to a local DB title via the backend (same flow as before).
 */
import { memo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Film, Star } from 'lucide-react';
import { navigateToAnime } from '../lib/animeResolve';

// Re-exported so animeResolve.ts can continue importing it
export interface AniListMediaLike {
  id: number;
  title: { romaji: string; english: string | null; native?: string | null };
  description?: string | null;
  episodes?: number | null;
  genres?: string[];
  averageScore?: number | null;
  coverImage?: { large?: string; extraLarge?: string } | null;
  startDate?: { year?: number | null } | null;
  format?: string | null;
  seasonYear?: number | null;
}

interface AniCardProps {
  anime: AniListMediaLike;
  rank?: number;
  fluid?: boolean;
  className?: string;
}

const AniCard = memo(function AniCard({ anime, rank, fluid = false, className = '' }: AniCardProps) {
  const nav = useNavigate();
  const location = useLocation();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [resolving, setResolving] = useState(false);

  const title = anime.title.english || anime.title.romaji || anime.title.native || 'Unknown';
  const posterUrl = anime.coverImage?.extraLarge || anime.coverImage?.large;
  const hasImage = !!posterUrl && !imgError;
  const rating = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const year = anime.seasonYear || anime.startDate?.year;

  const handleNav = useCallback((play = false) => {
    if (resolving) return;
    setResolving(true);
    navigateToAnime(anime, (path) => nav(play ? `${path}?play=1` : path, {
      state: { from: `${location.pathname}${location.search}` },
    }))
      .finally(() => setResolving(false));
  }, [anime, nav, resolving, location.pathname, location.search]);

  return (
    <article
      className={`
        group relative select-none touch-manipulation
        ${fluid ? 'w-full' : 'shrink-0 w-[140px] sm:w-[180px] lg:w-[230px] scroll-snap-start'}
        ${className}
      `}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Poster — navigation target */}
      <div
        role="link"
        tabIndex={0}
        aria-label={`View ${title}`}
        onClick={() => handleNav(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNav(false); }
        }}
        className="
          block relative z-10 w-full rounded-[8px] overflow-hidden aspect-[2/3]
          bg-[#161616] cursor-pointer
          transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
          md:group-hover:scale-[1.08] md:group-hover:-translate-y-1
          active:scale-[0.97] md:active:scale-100 md:active:translate-y-0
          focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25
        "
        style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.3)', display: 'block' }}
      >
        {/* Glow layer */}
        <div
          className="absolute inset-0 rounded-[8px] pointer-events-none z-[-1] opacity-0 md:group-hover:opacity-100 transition-opacity duration-[400ms]"
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
              src={posterUrl ? `/api/proxy-image?url=${encodeURIComponent(posterUrl)}` : ''}
              alt={title}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
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
            style={{ background: 'radial-gradient(140% 120% at 30% 0%, #1e1e2e, #000000 75%)' }}
          >
            <Film size={22} className="text-white/20" />
            <span className="text-[9px] text-white/25 text-center leading-tight line-clamp-3">{title}</span>
          </div>
        )}

        {/* Rank badge (Top 10 style — large translucent number) */}
        {rank != null && (
          <span
            className="absolute -left-1 bottom-0 z-20 font-black leading-none tracking-tighter select-none pointer-events-none"
            style={{
              fontSize: 'clamp(64px, 10vw, 96px)',
              color: 'transparent',
              WebkitTextStroke: '2px rgba(255,255,255,0.15)',
              fontFamily: 'Inter, system-ui, sans-serif',
              transform: 'translateY(16px)',
            }}
            aria-hidden
          >
            {rank}
          </span>
        )}

        {/* Type badge */}
        <span className="absolute top-2 right-2 z-20 text-[8px] font-medium px-[5px] py-[2.5px] rounded-full  bg-black/70 text-white/45 uppercase tracking-wide leading-none">
          {anime.format?.replace(/_/g, ' ') || 'Anime'}
        </span>

        {/* Bottom gradient */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.25) 35%, transparent 65%)' }}
        />

        {/* Resolving spinner */}
        {resolving && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          </div>
        )}

        {/* Hover overlay with Play button */}
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 opacity-0 md:group-hover:opacity-100 transition-opacity duration-[400ms] pointer-events-none"
          aria-hidden
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleNav(true); }}
            className="pointer-events-auto w-12 h-12 rounded-full bg-white hover:bg-white/90 flex items-center justify-center text-black shadow-[0_4px_24px_rgba(0,0,0,0.6)] transition-transform duration-200 active:scale-90 scale-90 group-hover:scale-100"
            style={{ touchAction: 'manipulation' }}
          >
            <Play size={20} className="fill-current ml-0.5" />
          </button>
        </div>
      </div>

      {/* Title + meta below card */}
      <div className="mt-2 px-0.5">
        <h3 className="text-[13px] font-semibold text-white leading-tight truncate">
          {title}
        </h3>
        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-white/70">
          {rating && (
            <span className="flex items-center gap-0.5 text-[#f5c518]">
              <Star size={10} className="fill-[#f5c518] text-[#f5c518]" />
              {rating}
            </span>
          )}
          {anime.episodes && <span>{anime.episodes} eps</span>}
          {year && <span>{year}</span>}
        </div>
      </div>
    </article>
  );
});

export default AniCard;
