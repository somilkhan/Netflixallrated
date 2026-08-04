/**
 * TopTenRow — Netflix-style massive gradient rank numerals behind poster cards.
 */
import { memo, useRef, useCallback } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ContentCard from '../ui/ContentCard';

interface TopTenRowProps {
  title: string;
  items: unknown[];
  viewAllPath?: string;
  /** Custom card renderer — defaults to <ContentCard title={item} /> */
  renderCard?: (item: unknown, index: number) => React.ReactNode;
  isTrending?: boolean;
}

/**
 * Approximate height of the text area below the poster in ContentCard:
 *   mt-2 (8px) + title (~16px) + rating row (~14px) = ~38px
 * We add this to `bottom` so the number aligns with the POSTER bottom, not card bottom.
 */
const TEXT_AREA_HEIGHT = 38;

const TopTenRow = memo(function TopTenRow({ title, items, viewAllPath, renderCard, isTrending = false }: TopTenRowProps) {
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

  if (!items.length) return null;

  return (
    <section className="relative py-5">
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 mb-4">
        <h2 className="text-2xl md:text-5xl font-bold text-white tracking-tight leading-none">
          {title}
        </h2>
        {viewAllPath && (
          <button
            type="button"
            onClick={() => nav(viewAllPath)}
            className="group flex items-center gap-1 px-3 py-1.5 rounded-full bg-overlay-light text-md text-[#A3A3A3] hover:text-white hover:bg-white/[0.14] transition-all duration-200 touch-manipulation"
          >
            View All
            <ChevronRight size={16} strokeWidth={2} className="transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        )}
      </div>

      {/* Scroll area */}
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
            hidden md:flex absolute left-0 top-0 bottom-0 z-20
            items-center justify-center w-14
            opacity-0 group-hover/row:opacity-100 transition-opacity duration-200
            pointer-events-none group-hover/row:pointer-events-auto
          "
          style={{ background: 'linear-gradient(to right, rgba(10,10,10,0.95), transparent)' }}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-overlay-light hover:bg-white/[0.16] border border-border-light text-white transition-all duration-200">
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
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-overlay-light hover:bg-white/[0.16] border border-border-light text-white transition-all duration-200">
            <ChevronRight size={16} />
          </div>
        </button>

        <div
          ref={scrollRef}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-label={`${title} row`}
           className="flex gap-4 overflow-x-auto scrollbar-hide focus:outline-none focus-visible:ring-1 focus-visible:ring-white/25 rounded-lg"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            willChange: 'scroll-position',
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: 24,
            paddingTop: 8,
            /* Extra top padding so numbers peeking above poster aren't clipped */
          }}
        >
          {items.slice(0, 10).map((item, index) => (
            <div
              key={item.id}
              className="relative shrink-0 scroll-snap-start"
              /*
               * paddingLeft creates room for the numeral to peek out on the left.
               * All items (including 0) get padding so the numeral is always visible.
               */
              style={{ paddingLeft: '56px' }}
            >
              {/*
               * Rank numeral — sits at bottom of the POSTER (not full card).
               * bottom = TEXT_AREA_HEIGHT offsets past the title/rating text below the poster.
               * left = 0 so it starts at the left edge of paddingLeft space.
               * The card (z-index 2) covers the right portion; left ~45px peeks out.
               */}
              <div
                aria-hidden
                className="absolute select-none pointer-events-none leading-none"
                style={{
                  left: 5,
                  bottom: TEXT_AREA_HEIGHT,
                  zIndex: 1,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: 900,
                  /* clamp: 100px on mobile (~390px wide), 150px on desktop */
                  fontSize: 'clamp(76px, 21vw, 126px)',
                  letterSpacing: '-0.05em',
                  lineHeight: 0.85,
                  background: 'linear-gradient(to bottom, #FFFFFF 0%, #8B8B8B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {index + 1}
              </div>

              {/* Card at z-index 2 — covers the right portion of the numeral */}
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
