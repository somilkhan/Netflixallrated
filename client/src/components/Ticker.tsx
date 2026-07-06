import { useEffect, useState } from 'react';
import { api } from '../lib/api';

// Futuristic tier indicators using the new Deep Scan palette
const tierColors: Record<string, string> = {
  SKIP:       'text-ink-faint',
  TIMEPASS:   'text-ink-dim',
  GOFORIT:    'text-amber',
  PERFECTION: 'text-maroon-bright',
};
const tierLabels: Record<string, string> = {
  SKIP: 'SKIP',
  TIMEPASS: 'TIMEPASS',
  GOFORIT: 'GO FOR IT',
  PERFECTION: 'PERFECTION',
};

export default function Ticker() {
  const [items, setItems] = useState<{name: string; tier: string}[]>([]);
  useEffect(() => {
    api.titles.trending().then((data: any[]) => {
      setItems(data.slice(0, 14).map((t: any) => ({
        name: t.name,
        tier: ['SKIP','TIMEPASS','GOFORIT','PERFECTION'][Math.floor(Math.random() * 4)],
      })));
    });
  }, []);
  if (!items.length) return null;
  const content = items.map((it, i) => (
    <span key={i} className="flex items-center gap-6">
      <span className="text-ink-dim">{it.name}</span>
      <b className={`font-semibold tracking-widest ${tierColors[it.tier]}`}>{tierLabels[it.tier]}</b>
    </span>
  ));
  return (
    <div className="border-b border-line overflow-hidden whitespace-nowrap py-2 bg-surface grid-overlay">
      <div className="inline-flex gap-6 font-mono text-[10px] tracking-wide text-ink-faint animate-marquee will-change-transform">
        {content}{content}
      </div>
    </div>
  );
}
