import { useEffect, useState, memo } from 'react';
import { api } from '../lib/api';

const tierColors: Record<string, string> = {
  SKIP:       'text-ink-faint',
  TIMEPASS:   'text-ink-dim',
  GOFORIT:    'text-amber',
  PERFECTION: 'text-maroon-bright',
};
const tierLabels: Record<string, string> = {
  SKIP:       'Skip',
  TIMEPASS:   'Timepass',
  GOFORIT:    'Go for it',
  PERFECTION: 'Perfection',
};

const Ticker = memo(function Ticker() {
  const [items, setItems] = useState<{ name: string; tier: string | null }[]>([]);

  useEffect(() => {
    api.titles.trending()
      .then((data: any[]) => {
        setItems(data.slice(0, 14).map((t: any) => ({
          name: t.name,
          tier: t.topTier ?? null,
        })));
      })
      .catch(() => {});
  }, []);

  if (!items.length) return null;

  const content = items.map((it, i) => (
    <span key={i} className="flex items-center gap-7 shrink-0">
      <span className="text-ink-faint/80">{it.name}</span>
      {it.tier && (
        <span className={`font-semibold ${tierColors[it.tier]}`}>
          {tierLabels[it.tier]}
        </span>
      )}
    </span>
  ));

  return (
    <div className="border-b border-line/60 overflow-hidden whitespace-nowrap py-2 bg-surface/50">
      <div
        className="inline-flex gap-7 font-mono text-[10.5px] tracking-wide animate-marquee will-change-transform"
        aria-hidden="true"
      >
        {content}
        {content}
      </div>
    </div>
  );
});

export default Ticker;
