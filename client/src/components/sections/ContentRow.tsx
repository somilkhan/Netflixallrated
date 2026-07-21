/**
 * ContentRow — rebuilt from scratch.
 * Horizontal scroll section with fade-in-view + navigation arrows on desktop.
 */
import { memo, useRef, useCallback } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const nav       = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? el.clientWidth * 0.78 : -el.clientWidth * 0.78, behavior: 'smooth' });
  }, []);

  return (
    <section className={`py-5 ${className}`}>
      {/* Row header */}
      <div className="flex items-center justify-between px-4 md:px-6 mb-3">
        <h2 className="text-[15px] md:text-[17px] font-semibold text-white tracking-tight leading-none">
          {title}
        </h2>
        {viewAllPath && (
          <button
            type="button"
            onClick={() => nav(viewAllPath)}
            className="
              group flex items-center gap-0.5
              text-[12px] text-[#737373] hover:text-white
              transition-colors duration-200 touch-manipulation
            "
          >
            View All
            <ChevronRight
              size={13}
              strokeWidth={2}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </button>
        )}
      </div>

      {/* Scroll container */}
      <div className="relative group/row">
        {/* Left arrow */}
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scroll('left')}
          className="
            hidden md:flex
            absolute left-0 top-0 bottom-0 z-20
            items-center justify-center w-14
            opacity-0 group-hover/row:opacity-100
            transition-opacity duration-200
            pointer-events-none group-hover/row:pointer-events-auto
          "
          style={{ background: 'linear-gradient(to right, rgba(10,10,10,0.95), transparent)' }}
        >
          <div className="
            flex items-center justify-center
            w-9 h-9 rounded-full
            bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.10]
            text-white transition-all duration-200
          ">
            <ChevronLeft size={16} />
          </div>
        </button>

        {/* Right arrow */}
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scroll('right')}
          className="
            hidden md:flex
            absolute right-0 top-0 bottom-0 z-20
            items-center justify-center w-14
            opacity-0 group-hover/row:opacity-100
            transition-opacity duration-200
            pointer-events-none group-hover/row:pointer-events-auto
          "
          style={{ background: 'linear-gradient(to left, rgba(10,10,10,0.95), transparent)' }}
        >
          <div className="
            flex items-center justify-center
            w-9 h-9 rounded-full
            bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.10]
            text-white transition-all duration-200
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
    </section>
  );
});

export default ContentRow;
