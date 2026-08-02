/**
 * ContentRow — horizontal scroll section with View All pill, fade-in-view + nav arrows.
 */
import { memo, useRef, useCallback } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ContentRowProps {
  title: string;
  viewAllPath?: string;
  children: React.ReactNode;
  className?: string;
  isTrending?: boolean;
}

const ContentRow = memo(function ContentRow({
  title,
  viewAllPath,
  children,
  className = '',
  isTrending = false,
}: ContentRowProps) {
  const nav       = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? el.clientWidth * 0.78 : -el.clientWidth * 0.78, behavior: 'smooth' });
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scroll('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scroll('right');
    }
  }, [scroll]);

  return (
    <section className={`relative py-5 ${className}`}>
        {/* Trending gradient wash */}
        {isTrending && (
          <div
            className="absolute inset-x-0 top-0 h-full pointer-events-none -z-10"
            style={{
              background: 'linear-gradient(180deg, #192247 0%, #461518 100%)',
              opacity: 0.35,
            }}
            aria-hidden
          />
        )}
      {/* Row header */}
      <div className="flex items-center justify-between px-4 md:px-6 mb-4">
        <h2 className="text-2xl md:text-5xl font-bold text-white tracking-tight leading-none">
          {title}
        </h2>
        {viewAllPath && (
          <button
            type="button"
            onClick={() => nav(viewAllPath)}
            className="
              group flex items-center gap-1
              px-3 py-1.5 rounded-full
              bg-overlay-light hover:bg-white/[0.14]
              text-md text-[#A3A3A3] hover:text-white
              transition-all duration-200 touch-manipulation
            "
          >
            View All
            <ChevronRight
              size={16}
              strokeWidth={2}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </button>
        )}
      </div>

      {/* Scroll container */}
      <div className="relative group/row">
        {/* Left fade edge */}
        <div
          className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none"
          style={{
            width: 'clamp(24px, 8vw, 60px)',
            background: 'linear-gradient(to right, #000000 0%, transparent 100%)',
          }}
          aria-hidden
        />
        {/* Right fade edge */}
        <div
          className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none"
          style={{
            width: 'clamp(24px, 8vw, 60px)',
            background: 'linear-gradient(to left, #000000 0%, transparent 100%)',
          }}
          aria-hidden
        />
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
            bg-overlay-light hover:bg-white/[0.16] border border-border-light
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
            bg-overlay-light hover:bg-white/[0.16] border border-border-light
            text-white transition-all duration-200
          ">
            <ChevronRight size={16} />
          </div>
        </button>

        {/* Scrollable track */}
        <div
          ref={scrollRef}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-label={`${title} row`}
          className="
             flex gap-4 overflow-x-auto overflow-y-visible
            px-4 md:px-6 pb-3
            scrollbar-hide
            focus:outline-none focus-visible:ring-1 focus-visible:ring-white/25 rounded-lg
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
