import { useState, useRef, useEffect, useCallback, memo } from 'react';

const TABS = ['All', 'Movies', 'Series', 'Anime'];

const Tabs = memo(function Tabs({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const updateIndicator = useCallback(() => {
    const idx = TABS.indexOf(active);
    const btn = btnRefs.current[idx];
    if (btn) {
      setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
  }, [active]);

  useEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center px-5 pt-6 pb-0 gap-0.5"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      {TABS.map((t, i) => (
        <button
          key={t}
          ref={el => { btnRefs.current[i] = el; }}
          onClick={() => onChange(t)}
          className={`
            relative font-sans text-[13px] font-medium pb-3 px-3.5
            transition-colors duration-200 ease-spring
            ${active === t ? 'text-white' : 'text-white/28 hover:text-white/65'}
          `}
        >
          {t}
        </button>
      ))}
      {/* Sliding indicator */}
      <div
        className="absolute bottom-[-1px] h-[2px] bg-white rounded-full"
        style={{
          left: indicator.left + 14,
          width: Math.max(0, indicator.width - 28),
          transition: 'left 0.3s cubic-bezier(.16,1,.3,1), width 0.3s cubic-bezier(.16,1,.3,1)',
          boxShadow: '0 0 8px rgba(255,255,255,0.5)',
        }}
      />
    </div>
  );
});

export default Tabs;
