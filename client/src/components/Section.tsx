/**
 * Section — content row. Uses parent App-level LazyMotion context (never creates its own).
 * whileInView reveal is simple opacity+Y — GPU-composited, single-shot.
 */
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { m } from 'framer-motion';

interface SectionProps {
  title: string;
  count?: string;
  children: React.ReactNode;
  viewAllPath?: string;
}

const Section = memo(function Section({ title, count, children, viewAllPath }: SectionProps) {
  const nav = useNavigate();

  return (
    <m.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-32px' }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="pt-7 pb-1"
    >
      {/* Row header */}
      <div className="flex items-center justify-between px-5 mb-3.5">
        <div className="flex items-center gap-2">
          <h2 className="font-sans text-[17px] font-semibold tracking-tight text-white leading-none">
            {title}
          </h2>
          {!!count && (
            <span className="font-sans text-[11.5px] text-white/20 font-normal">{count}</span>
          )}
        </div>
        {viewAllPath && (
          <button
            onClick={() => nav(viewAllPath)}
            className="
              group flex items-center gap-[2px]
              font-sans text-[12.5px] text-white/35
              hover:text-white/80
              transition-colors duration-200
            "
          >
            View All
            <ChevronRight
              size={13}
              strokeWidth={1.8}
              className="transition-transform duration-200 group-hover:translate-x-[2px]"
            />
          </button>
        )}
      </div>

      {/* Horizontal slider — no overscroll-x-contain (causes iOS jank) */}
      <div
        className="flex gap-3 overflow-x-auto overflow-y-visible px-5 pb-3 scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {children}
      </div>
    </m.section>
  );
});

export default Section;
