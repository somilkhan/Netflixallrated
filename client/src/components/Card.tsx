import { useNavigate } from 'react-router-dom';
import Meter from './Meter';

const tierLabels: Record<string, string> = { SKIP: 'Skip', TIMEPASS: 'Timepass', GOFORIT: 'Go for it', PERFECTION: 'Perfection' };

export default function Card({ title, rank }: { title: any; index?: number; rank?: number }) {
  const nav = useNavigate();
  const tierIdx = Math.floor(Math.random() * 4);
  const tiers = ['SKIP', 'TIMEPASS', 'GOFORIT', 'PERFECTION'];
  const tier = tiers[tierIdx];

  return (
    <div className="shrink-0 w-[142px] md:w-[172px] cursor-pointer scroll-snap-start group" onClick={() => nav(`/title/${title.id}`)}>
      <div
        className="relative w-[142px] md:w-[172px] h-[200px] md:h-[246px] rounded-[11px] border border-line overflow-hidden flex flex-col justify-end p-2 bg-cover bg-center transition-all duration-200 group-hover:border-maroon group-hover:-translate-y-1 group-hover:shadow-[0_16px_32px_-12px_rgba(0,0,0,0.6),0_0_0_1px_#7A2530]"
        style={{
          backgroundImage: title.posterUrl
            ? `linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.65)), url(${title.posterUrl})`
            : `radial-gradient(120% 100% at 30% 0%, ${title.posterColorFrom}, ${title.posterColorTo} 70%)`,
        }}
      >
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
        <div className="absolute inset-0 shadow-[inset_0_-60px_50px_-20px_rgba(0,0,0,0.55)] pointer-events-none" />
        {rank && <span className="absolute top-1.5 left-2 z-10 font-serif font-bold text-[34px] text-transparent leading-none" style={{ WebkitTextStroke: '1px rgba(245,240,236,0.32)' }}>{String(rank).padStart(2, '0')}</span>}
        <div className="relative z-10"><Meter tier={tier} mini /></div>
      </div>
      <div className="mt-2.5 text-[13.5px] font-semibold truncate">{title.name}</div>
      <div className="font-mono text-[10.5px] text-ink-faint flex items-center gap-1">{tierLabels[tier]} · {title.year} · {title.type}</div>
    </div>
  );
}
