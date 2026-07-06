/**
 * Card — standard title card used in horizontal sections and the search grid.
 *
 * Fix #5 applied:
 * - Fixed width + `poster-ratio` (2:3) ensures every card is the same height.
 * - Metadata line: `truncate` + `min-w-0` prevent overflow and wrapping.
 */
import { useNavigate } from 'react-router-dom';

export default function Card({ title, rank }: { title: any; index?: number; rank?: number }) {
  const nav = useNavigate();

  const genre = title.genres?.[0];
  const typeLabel = title.type === 'MOVIE' ? 'Movie' : title.type === 'SERIES' ? 'Series' : 'Anime';

  return (
    <div
      className="shrink-0 w-[142px] md:w-[172px] cursor-pointer scroll-snap-start group"
      onClick={() => nav(`/title/${title.id}`)}
    >
      {/* poster-ratio = 2:3, consistent with search grid and TMDB cards */}
      <div
        className="relative w-full poster-ratio rounded-[11px] border border-line overflow-hidden flex flex-col justify-end p-2 bg-cover bg-center transition-all duration-200 group-hover:border-maroon group-hover:-translate-y-1 group-hover:shadow-[0_16px_32px_-12px_rgba(0,0,0,0.6),0_0_0_1px_#7A2530]"
        style={{
          backgroundImage: title.posterUrl
            ? `linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.65)), url(${title.posterUrl})`
            : `radial-gradient(120% 100% at 30% 0%, ${title.posterColorFrom || '#1a1510'}, ${title.posterColorTo || '#0a0908'} 70%)`,
        }}
      >
        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
        {/* Bottom vignette */}
        <div className="absolute inset-0 shadow-[inset_0_-60px_50px_-20px_rgba(0,0,0,0.55)] pointer-events-none" />
        {/* Rank number */}
        {rank && (
          <span
            className="absolute top-1.5 left-2 z-10 font-serif font-bold text-[34px] text-transparent leading-none"
            style={{ WebkitTextStroke: '1px rgba(245,240,236,0.32)' }}
          >
            {String(rank).padStart(2, '0')}
          </span>
        )}
        {/* Type badge */}
        <div className="relative z-10">
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-line/50 bg-void/60 text-ink-faint uppercase tracking-wide">
            {typeLabel}
          </span>
        </div>
      </div>

      {/* Title — truncate so long names never wrap */}
      <div className="mt-2.5 text-[13.5px] font-semibold truncate">{title.name}</div>
      {/* Metadata — min-w-0 + truncate keeps to one line, no height variance */}
      <div className="font-mono text-[10.5px] text-ink-faint flex items-center gap-1 min-w-0 truncate">
        <span>{title.year}</span>
        {genre && (
          <>
            <span className="text-line shrink-0">·</span>
            <span className="truncate">{genre}</span>
          </>
        )}
      </div>
    </div>
  );
}
