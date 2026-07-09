import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const tierColors: Record<string, string> = { SKIP: 'text-ink-faint', TIMEPASS: 'text-ink-dim', GOFORIT: 'text-amber', PERFECTION: 'text-maroon-bright' };
const tierLabels: Record<string, string> = { SKIP: 'Skip', TIMEPASS: 'Timepass', GOFORIT: 'Go for it', PERFECTION: 'Perfection' };

export default function Ticker() {
  const [items, setItems] = useState<{ name: string; tier: string | null }[]>([]);
  // tier is the real most-common community rating from the backend
  // (never randomized) — titles with no ratings yet simply show no badge.
  useEffect(() => {
    api.titles.trending()
      .then((data: any[]) => { setItems(data.slice(0, 14).map((t: any) => ({ name: t.name, tier: t.topTier ?? null }))); })
      .catch(() => {});
  }, []);
  if (!items.length) return null;
  const content = items.map((it, i) => (
    <span key={i} className="flex items-center gap-[30px]">
      {it.name} {it.tier && <b className={`font-semibold ${tierColors[it.tier]}`}>{tierLabels[it.tier]}</b>}
    </span>
  ));
  return (
    <div className="border-b border-line overflow-hidden whitespace-nowrap py-2 bg-surface">
      <div className="inline-flex gap-[30px] font-mono text-[11px] tracking-wide text-ink-faint animate-marquee will-change-transform">{content}{content}</div>
    </div>
  );
}
