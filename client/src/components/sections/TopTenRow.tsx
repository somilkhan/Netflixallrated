/**
 * TopTenRow — Netflix-style massive gradient rank numerals behind poster cards.
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
      <div className="flex items-center justify-between px-4 md:px-6 mb-4">
        <h2 className="text-[18px] md:text-[24px] font-bold text-white tracking-tight leading-none">
          {title}
        </h2>
        {viewAllPath && (
          <button
            type="button"
            onClick={() => nav(viewAllPath)}
            className="group flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.08] text-[14px] text-[#A3A3A3] hover:text-white hover:bg-white/[0.14] transition-all duration-200 touch-manipulation"
          >
            View All
            <ChevronRight size={16} strokeWidth={2} className="transition-transform duration-200 group-hover:translate-x-1" />
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
          className="flex overflow-x-auto overflow-y-visible scrollbar-hide px-4 md:px-6 pb-4 gap-0"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', willChange: 'scroll-position' }}
        >
          {items.slice(0, 10).map((item, index) => (
            <div
              key={item.id}
              className="relative shrink-0 scroll-snap-start flex items-end"
              /* paddingLeft leaves room for the rank numeral to peek out from the left */
              style={{ paddingLeft: index === 0 ? '0px' : '50px' }}
            >
              {/* Rank numeral — massive gradient text behind poster */}
              <div
                aria-hidden
                className="absolute select-none pointer-events-none leading-none"
                style={{
                  left: index === 0 ? '-8px' : '0px',
                  bottom: '-4px',
                  fontSize: 'clamp(100px, 12vw, 150px)',
                  fontWeight: 900,
                  letterSpacing: '-0.05em',
                  lineHeight: 0.85,
                  zIndex: 1,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  /* Gradient white-to-grey */
                  background: 'linear-gradient(to bottom, #FFFFFF 0%, #8B8B8B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {index + 1}
              </div>
              {/* Card at z-index 2 so numeral peeks from behind on left */}
              <div className="relative" style={{ zIndex: 2 }}>
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
