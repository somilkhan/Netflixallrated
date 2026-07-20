import React, { useRef, useState, useCallback, useEffect } from 'react';

interface RelatedRowProps {
  title: string;
  count?: number;
  children: React.ReactNode;
}

/** Horizontally-scrolling section with desktop arrow navigation.
 *  Arrows appear only when there is overflow to scroll into. */
export default function RelatedRow({ title, count, children }: RelatedRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(false);

  const syncArrows = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    syncArrows();
    el.addEventListener('scroll', syncArrows, { passive: true });
    const ro = new ResizeObserver(syncArrows);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', syncArrows); ro.disconnect(); };
  }, [syncArrows]);

  const scroll = (dir: 'left' | 'right') => {
    rowRef.current?.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
  };

  return (
    <div className="dp-section">
      <div className="dp-section-head">
        <span className="dp-section-title">
          {title}
          {count != null && <span className="dp-section-count">({count})</span>}
        </span>

        {/* Desktop arrow buttons */}
        <div className="hidden md:flex items-center gap-1">
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canLeft}
            aria-label="Scroll left"
            className="w-7 h-7 flex items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.04] text-white/50 hover:text-white hover:border-white/[0.22] hover:bg-white/[0.08] transition-colors duration-150 disabled:opacity-0 disabled:pointer-events-none"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canRight}
            aria-label="Scroll right"
            className="w-7 h-7 flex items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.04] text-white/50 hover:text-white hover:border-white/[0.22] hover:bg-white/[0.08] transition-colors duration-150 disabled:opacity-0 disabled:pointer-events-none"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>

      <div ref={rowRef} className="related-row">{children}</div>
    </div>
  );
}
