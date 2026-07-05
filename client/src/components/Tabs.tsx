import { useState, useRef, useEffect } from 'react';

const tabs = ['All', 'Movies', 'Series', 'Anime'];

export default function Tabs({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const idx = tabs.indexOf(active);
    const btn = btnRefs.current[idx];
    if (btn && containerRef.current) setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth - 22 });
  }, [active]);

  return (
    <div ref={containerRef} className="relative flex px-5 pt-4 border-b border-line">
      {tabs.map((t, i) => (
        <button key={t} ref={el => btnRefs.current[i] = el} onClick={() => onChange(t)} className={`font-mono text-xs pb-3 mr-5 transition-colors ${active === t ? 'text-ink' : 'text-ink-faint hover:text-ink-dim'}`}>{t}</button>
      ))}
      <div className="absolute bottom-[-1px] h-[2px] bg-maroon-bright transition-all duration-300" style={{ left: indicator.left, width: indicator.width }} />
    </div>
  );
}
