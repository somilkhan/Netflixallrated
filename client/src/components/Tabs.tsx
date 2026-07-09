import { useState, useRef, useEffect, memo } from 'react';

const TABS = ['All', 'Movies', 'Series', 'Anime'];

const Tabs = memo(function Tabs({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const idx = TABS.indexOf(active);
    const btn = btnRefs.current[idx];
    if (btn && containerRef.current) {
      setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
  }, [active]);

  return (
    <div ref={containerRef} className="relative flex items-center px-5 pt-5 pb-0 border-b border-line/50 gap-1">
      {TABS.map((t, i) => (
        <button
          key={t}
          ref={el => { btnRefs.current[i] = el; }}
          onClick={() => onChange(t)}
          className={`
            relative font-sans text-[12.5px] font-medium pb-3 px-3 transition-colors duration-150
            ${active === t ? 'text-ink' : 'text-ink-faint hover:text-ink-dim'}
          `}
        >
          {t}
        </button>
      ))}
      {/* Sliding indicator */}
      <div
        className="absolute bottom-[-1px] h-[2px] bg-maroon-bright rounded-full transition-all duration-300 ease-spring"
        style={{ left: indicator.left + 12, width: Math.max(0, indicator.width - 24) }}
      />
    </div>
  );
});

export default Tabs;
