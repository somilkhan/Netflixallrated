/**
 * TopTenRow — rebuilt from scratch.
 * Large outlined rank numerals behind poster cards, scroll-snap horizontal row.
 */
import { memo, useRef, useCallback } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ContentCard from '../ui/ContentCard';

interface TopTenRowProps {
  title: string;
  items: any[];
  viewAllPath?: string;
  /** Custom card renderer — defaults to <ContentCard title={item} /> */
  renderCard?: (item: any, index: number) => React.ReactNode;
}

const TopTenRow = memo(function TopTenRow({ title, items, viewAllPath, renderCard }: TopTenRowProps) {
  const nav       = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? el.clientWidth * 0.78 : -el.clientWidth * 0.78, behavior: 'smooth' });
  }, []);

  if (!items.length) return null;

  return (
    <section className="py-5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 mb-3">
        <h2 className="text-[18px] md:text-[24px] font-semibold text-white tracking-tight leading-none">
          {title}
        </h2>
        {viewAllPath && (
          <button
            type="button"
            onClick={() => nav(viewAllPath)}
            className="group flex items-center gap-0.5 text-[12px] text-[#737373] hover:text-white transition-colors duration-200 touch-manipulation"
          >
            View All
            <ChevronRight size={13} strokeWidth={2} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        )}
      </div>

      {/* Scroll area */}
      <div className="relative group/row">
        {/* Left arrow */}
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scroll('left')}
          className="
            hidden md:flex absolute left-0 top-0 bottom-0 z-20
            items-center justify-center w-14
            opacity-0 group-hover/row:opacity-100 transition-opacity duration-200
            pointer-events-none group-hover/row:pointer-events-auto
          "
          style={{ background: 'linear-gradient(to right, rgba(10,10,10,0.95), transparent)' }}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.10] text-white transition-all duration-200">
            <ChevronLeft size={16} />
          </div>
        </button>

        {/* Right arrow */}
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scroll('right')}
          className="
            hidden md:flex absolute right-0 top-0 bottom-0 z-20
            items-center justify-center w-14
            opacity-0 group-hover/row:opacity-100 transition-opacity duration-200
            pointer-events-none group-hover/row:pointer-events-auto
          "
          style={{ background: 'linear-gradient(to left, rgba(10,10,10,0.95), transparent)' }}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.10] text-white transition-all duration-200">
            <ChevronRight size={16} />
          </div>
        </button>

        <div
          ref={scrollRef}
          className="flex overflow-x-auto overflow-y-visible scrollbar-hide px-4 md:px-6 pb-3 gap-0"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', willChange: 'scroll-position' }}
        >
          {items.slice(0, 10).map((item, index) => (
            <div
              key={item.id}
              className="relative shrink-0 scroll-snap-start flex items-end"
              style={{ marginLeft: index === 0 ? 0 : '-10px' }}
            >
              {/* Rank numeral — outlined, behind card */}
              <div
                aria-hidden
                className="absolute left-0 bottom-10 z-0 leading-none font-black select-none pointer-events-none"
                style={{
                  fontSize: 'clamp(72px, 11vw, 104px)',
                  color: 'transparent',
                  WebkitTextStroke: '1.5px rgba(255,255,255,0.10)',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                }}
              >
                {index + 1}
              </div>
              {/* Card positioned so numeral peeks left */}
              <div className="relative z-10" style={{ marginLeft: index === 0 ? 0 : '40px' }}>
                {renderCard ? renderCard(item, index) : <ContentCard title={item} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

export default TopTenRow;
