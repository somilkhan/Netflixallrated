/**
 * TopTenRow — large rank numbers behind poster cards.
 * Rank digit is rendered as a big outlined stroke numeral behind the card.
 */
import { memo, useRef, useCallback } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import ContentCard from '../ui/ContentCard';

interface TopTenRowProps {
  title: string;
  items: any[];
  viewAllPath?: string;
}

const TopTenRow = memo(function TopTenRow({ title, items, viewAllPath }: TopTenRowProps) {
  const nav = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? el.clientWidth * 0.8 : -el.clientWidth * 0.8, behavior: 'smooth' });
  }, []);

  if (!items.length) return null;

  return (
    <m.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-24px' }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="py-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 mb-3">
        <h2 className="text-base md:text-lg font-semibold text-white tracking-tight leading-none">
          {title}
        </h2>
        {viewAllPath && (
          <button
            type="button"
            onClick={() => nav(viewAllPath)}
            className="group flex items-center gap-0.5 text-sm text-[#737373] hover:text-white transition-colors duration-200 touch-manipulation"
          >
            View All
            <ChevronRight size={14} strokeWidth={2} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        )}
      </div>

      {/* Scroll area with rank numerals */}
      <div className="relative group/row">
        {/* Left arrow */}
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scroll('left')}
          className="hidden md:flex absolute left-0 top-0 bottom-0 z-20 items-center justify-center w-12 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 pointer-events-none group-hover/row:pointer-events-auto"
          style={{ background: 'linear-gradient(to right, rgba(10,10,10,0.9), transparent)' }}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors duration-200">
            <ChevronLeft size={16} />
          </div>
        </button>

        {/* Right arrow */}
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scroll('right')}
          className="hidden md:flex absolute right-0 top-0 bottom-0 z-20 items-center justify-center w-12 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 pointer-events-none group-hover/row:pointer-events-auto"
          style={{ background: 'linear-gradient(to left, rgba(10,10,10,0.9), transparent)' }}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors duration-200">
            <ChevronRight size={16} />
          </div>
        </button>

        <div
          ref={scrollRef}
          className="flex overflow-x-auto overflow-y-visible scrollbar-hide px-4 md:px-6 pb-3"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', willChange: 'scroll-position' }}
        >
          {items.slice(0, 10).map((item, index) => (
            <div
              key={item.id}
              className="relative shrink-0 scroll-snap-start"
              style={{ marginLeft: index === 0 ? 0 : '-14px' }}
            >
              {/* Rank numeral — behind the card */}
              <div
                className="absolute left-0 bottom-8 z-0 leading-none font-black select-none pointer-events-none"
                style={{
                  fontSize: 'clamp(64px, 10vw, 96px)',
                  color: 'transparent',
                  WebkitTextStroke: '1.5px rgba(255,255,255,0.12)',
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                }}
                aria-hidden
              >
                {index + 1}
              </div>
              {/* Card — positioned so rank numeral peeks out left */}
              <div className="relative z-10" style={{ marginLeft: index === 0 ? 0 : '36px' }}>
                <ContentCard title={item} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </m.section>
  );
});

export default TopTenRow;
