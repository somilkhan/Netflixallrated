/**
 * Section — content row with smooth whileInView reveal via framer-motion.
 */
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { m, LazyMotion, domAnimation } from 'framer-motion';

interface SectionProps {
  title: string;
  count?: string;
  children: React.ReactNode;
  viewAllPath?: string;
}

const Section = memo(function Section({ title, count, children, viewAllPath }: SectionProps) {
  const nav = useNavigate();

  return (
    <LazyMotion features={domAnimation} strict>
      <m.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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

        {/* Horizontal slider */}
        <div
          className="flex gap-3 overflow-x-auto overflow-y-visible px-5 pb-3 scrollbar-hide overscroll-x-contain"
          style={{ scrollSnapType: 'x mandatory', willChange: 'scroll-position' }}
        >
          {children}
        </div>
      </m.section>
    </LazyMotion>
  );
});

export default Section;
