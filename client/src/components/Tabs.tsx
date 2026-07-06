import { useState, useRef, useEffect } from 'react';

const tabs = ['All', 'Movies', 'Series', 'Anime'];

export default function Tabs({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const idx = tabs.indexOf(active);
    const btn = btnRefs.current[idx];
    if (btn && containerRef.current) setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth - 20 });
  }, [active]);

  return (
    <div ref={containerRef} className="relative flex px-5 pt-4 border-b border-line">
      {tabs.map((t, i) => (
        <button
          key={t}
          ref={el => btnRefs.current[i] = el}
          onClick={() => onChange(t)}
          className={`font-mono text-[11px] tracking-widest pb-3 mr-6 transition-colors uppercase ${active === t ? 'text-ink' : 'text-ink-faint hover:text-ink-dim'}`}
        >
          {t}
        </button>
      ))}
      {/* Cyan sliding indicator */}
      <div
        className="absolute bottom-[-1px] h-[2px] bg-maroon-bright transition-all duration-300"
        style={{ left: indicator.left, width: indicator.width, boxShadow: '0 0 8px rgba(0,212,255,0.6)' }}
      />
    </div>
  );
}
