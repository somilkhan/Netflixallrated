/**
 * ContentRow — horizontal scroll section with navigation arrows (desktop)
 * and scroll-snap on mobile.
 */
import { memo, useRef, useCallback } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';

interface ContentRowProps {
  title: string;
  viewAllPath?: string;
  children: React.ReactNode;
  className?: string;
}

const ContentRow = memo(function ContentRow({
  title,
  viewAllPath,
  children,
  className = '',
}: ContentRowProps) {
  const nav = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  }, []);

  return (
    <m.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-24px' }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={`py-6 ${className}`}
    >
      {/* Row header */}
      <div className="flex items-center justify-between px-4 md:px-6 mb-3">
        <h2 className="text-base md:text-lg font-semibold text-white tracking-tight leading-none">
          {title}
        </h2>
        {viewAllPath && (
          <button
            type="button"
            onClick={() => nav(viewAllPath)}
            className="
              group flex items-center gap-0.5
              text-sm text-[#737373] hover:text-white
              transition-colors duration-200
              touch-manipulation
            "
          >
            View All
            <ChevronRight
              size={14}
              strokeWidth={2}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </button>
        )}
      </div>

      {/* Scroll container with arrows */}
      <div className="relative group/row">
        {/* Left arrow — desktop only */}
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scroll('left')}
          className="
            hidden md:flex
            absolute left-0 top-0 bottom-0 z-20
            items-center justify-center
            w-12 -translate-x-0
            opacity-0 group-hover/row:opacity-100
            transition-opacity duration-200
            pointer-events-none group-hover/row:pointer-events-auto
          "
          style={{
            background: 'linear-gradient(to right, rgba(10,10,10,0.9), transparent)',
          }}
        >
          <div className="
            flex items-center justify-center
            w-8 h-8 rounded-full
            bg-white/10 hover:bg-white/20 border border-white/10
            text-white transition-colors duration-200
          ">
            <ChevronLeft size={16} />
          </div>
        </button>

        {/* Right arrow — desktop only */}
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scroll('right')}
          className="
            hidden md:flex
            absolute right-0 top-0 bottom-0 z-20
            items-center justify-center
            w-12
            opacity-0 group-hover/row:opacity-100
            transition-opacity duration-200
            pointer-events-none group-hover/row:pointer-events-auto
          "
          style={{
            background: 'linear-gradient(to left, rgba(10,10,10,0.9), transparent)',
          }}
        >
          <div className="
            flex items-center justify-center
            w-8 h-8 rounded-full
            bg-white/10 hover:bg-white/20 border border-white/10
            text-white transition-colors duration-200
          ">
            <ChevronRight size={16} />
          </div>
        </button>

        {/* Scrollable track */}
        <div
          ref={scrollRef}
          className="
            flex gap-3 overflow-x-auto overflow-y-visible
            px-4 md:px-6 pb-3
            scrollbar-hide
          "
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            willChange: 'scroll-position',
          }}
        >
          {children}
        </div>
      </div>
    </m.section>
  );
});

export default ContentRow;
