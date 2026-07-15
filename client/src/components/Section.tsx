/**
 * Section — bingr-style content row.
 * Clean header: title on left, "View All >" on right. No divider line.
 */
import { useEffect, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface SectionProps {
  title: string;
  count?: string;
  children: React.ReactNode;
  viewAllPath?: string;
}

const Section = memo(function Section({ title, count, children, viewAllPath }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  const nav = useNavigate();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          el.classList.add('opacity-100', 'translate-y-0');
          el.classList.remove('opacity-0', 'translate-y-4');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className="pt-7 pb-1 opacity-0 translate-y-4 transition-all duration-500 ease-spring">
      {/* Row header — bingr style */}
      <div className="flex items-center justify-between px-5 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-sans text-[17px] font-semibold tracking-tight text-white leading-none">
            {title}
          </h2>
          {!!count && (
            <span className="font-sans text-[12px] text-[#555]">{count}</span>
          )}
        </div>
        {viewAllPath && (
          <button
            onClick={() => nav(viewAllPath)}
            className="flex items-center gap-[2px] font-sans text-[13px] text-[#888] hover:text-white transition-colors duration-150"
          >
            View All
            <ChevronRight size={14} strokeWidth={1.8} />
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
    </section>
  );
});

export default Section;
