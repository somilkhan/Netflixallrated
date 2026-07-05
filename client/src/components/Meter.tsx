const tiers = ['skip', 'timepass', 'goforit', 'perfection'] as const;
const tierMap = { skip: 'bg-ink-faint', timepass: 'bg-ink-dim', goforit: 'bg-amber', perfection: 'bg-maroon-bright' };

export default function Meter({ tier, mini = false }: { tier: string; mini?: boolean }) {
  const idx = tiers.indexOf(tier.toLowerCase() as any);
  const w = mini ? 'w-3 h-[3px]' : 'w-[26px] h-[5px]';
  return <div className={`flex gap-[3px] ${mini ? 'gap-[3px]' : 'gap-1'}`}>{tiers.map((t, i) => <i key={t} className={`block rounded-sm ${w} ${i <= idx ? tierMap[t] : 'bg-line-bright'}`} />)}</div>;
}
