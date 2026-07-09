/**
 * Card for raw TMDB items (geo rows) that don't have a local DB row yet.
 * Tapping resolves (get-or-create) the title on the backend, then navigates
 * to the standard /title/:id detail/player page — same destination as every
 * other card.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export interface TmdbItem {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  name: string;
  year: number | null;
  posterUrl: string | null;
  overview: string;
}

export default function TmdbCard({ item }: { item: TmdbItem }) {
  const nav = useNavigate();
  const [resolving, setResolving] = useState(false);

  const handleClick = async () => {
    if (resolving) return;
    setResolving(true);
    try {
      const { id } = await api.titles.resolveTmdb(item.tmdbId, item.mediaType);
      nav(`/title/${id}`);
    } catch {
      // Backend couldn't resolve/create the title (e.g. TMDB unreachable) —
      // fall back to search rather than leaving the tap dead.
      const typeFilter = item.mediaType === 'movie' ? 'MOVIE' : 'SERIES';
      nav(`/search?q=${encodeURIComponent(item.name)}&type=${typeFilter}`);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div
      className={`shrink-0 w-[142px] md:w-[172px] scroll-snap-start group cursor-pointer${resolving ? ' opacity-60 pointer-events-none' : ''}`}
      onClick={handleClick}
    >
      <div
        className="relative w-full poster-ratio rounded-[11px] border border-line overflow-hidden flex flex-col justify-end p-2 bg-cover bg-center transition-all duration-200 group-hover:border-maroon group-hover:-translate-y-1 group-hover:shadow-[0_16px_32px_-12px_rgba(0,0,0,0.6),0_0_0_1px_#7A2530]"
        style={{
          backgroundImage: item.posterUrl
            ? `linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.65)), url(${item.posterUrl})`
            : 'radial-gradient(120% 100% at 30% 0%, #1a1510, #0a0908 70%)',
        }}
      >
        {/* Grain overlay */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Bottom shadow */}
        <div className="absolute inset-0 shadow-[inset_0_-60px_50px_-20px_rgba(0,0,0,0.55)] pointer-events-none" />
        {/* Type badge */}
        <div className="relative z-10">
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-line/50 bg-void/60 text-ink-faint uppercase tracking-wide">
            {item.mediaType === 'movie' ? 'Movie' : 'Series'}
          </span>
        </div>
      </div>
      <div className="mt-2.5 text-[13.5px] font-semibold truncate">{item.name}</div>
      <div className="font-mono text-[10.5px] text-ink-faint truncate">{item.year ?? '—'}</div>
    </div>
  );
}
