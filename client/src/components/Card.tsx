/**
 * Card — standard title card used in horizontal sections and the search grid.
 * Futuristic "Deep Scan" reskin: cyan hover glow, sharp corners, monospace meta.
 */
import { useNavigate } from 'react-router-dom';

export default function Card({ title, rank }: { title: any; index?: number; rank?: number }) {
  const nav = useNavigate();

  const genre = title.genres?.[0];
  const typeLabel = title.type === 'MOVIE' ? 'FILM' : title.type === 'SERIES' ? 'SERIES' : 'ANIME';

  return (
    <div
      className="shrink-0 w-[142px] md:w-[172px] cursor-pointer scroll-snap-start group"
      onClick={() => nav(`/title/${title.id}`)}
    >
      {/* poster-ratio = 2:3 */}
      <div
        className="relative w-full poster-ratio rounded-lg border border-line overflow-hidden flex flex-col justify-end p-2 bg-cover bg-center transition-all duration-200 group-hover:border-maroon-bright group-hover:-translate-y-1 group-hover:shadow-[0_16px_32px_-12px_rgba(0,0,0,0.7),0_0_0_1px_#00D4FF,0_0_20px_rgba(0,212,255,0.12)]"
        style={{
          backgroundImage: title.posterUrl
            ? `linear-gradient(to bottom, rgba(4,8,15,0.05), rgba(4,8,15,0.7)), url(${title.posterUrl})`
            : `radial-gradient(120% 100% at 30% 0%, ${title.posterColorFrom || '#0a1423'}, ${title.posterColorTo || '#04080f'} 70%)`,
        }}
      >
        {/* Scanline overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,212,255,0.3) 0px, transparent 1px, transparent 3px)',
          backgroundSize: '100% 4px',
        }} />
        {/* Bottom vignette */}
        <div className="absolute inset-0 shadow-[inset_0_-60px_50px_-20px_rgba(4,8,15,0.7)] pointer-events-none" />
        {/* Rank number */}
        {rank && (
          <span
            className="absolute top-1.5 left-2 z-10 font-mono font-bold text-[30px] text-transparent leading-none"
            style={{ WebkitTextStroke: '1px rgba(0,212,255,0.3)' }}
          >
            {String(rank).padStart(2, '0')}
          </span>
        )}
        {/* Type badge */}
        <div className="relative z-10">
          <span className="font-mono text-[8px] px-1.5 py-0.5 rounded-sm border border-maroon-bright/25 bg-void/70 text-maroon-bright/80 uppercase tracking-widest">
            {typeLabel}
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="mt-2.5 text-[13px] font-semibold truncate text-ink">{title.name}</div>
      {/* Meta */}
      <div className="font-mono text-[10px] text-ink-faint flex items-center gap-1 min-w-0 truncate">
        <span>{title.year}</span>
        {genre && (
          <>
            <span className="text-line-bright shrink-0">·</span>
            <span className="truncate">{genre}</span>
          </>
        )}
      </div>
    </div>
  );
}
