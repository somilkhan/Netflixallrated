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
    <section ref={ref} className="pt-8 pb-1 opacity-0 translate-y-4 transition-all duration-500 ease-spring">
      {/* Row header */}
      <div className="flex items-center px-5 mb-4 gap-3">
        <h2 className="font-serif text-[19px] font-semibold tracking-tight text-ink leading-none shrink-0">
          {title}
        </h2>
        {count && (
          <span className="font-mono text-[10px] text-ink-faint">{count}</span>
        )}
        <div className="h-px bg-line/60 flex-1 min-w-0" />
        {viewAllPath && (
          <button
            onClick={() => nav(viewAllPath)}
            className="shrink-0 flex items-center gap-[3px] font-sans text-[11px] text-ink-faint hover:text-ink transition-colors duration-150"
          >
            View all
            <ChevronRight size={12} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Horizontal slider */}
      <div className="
        flex gap-3.5
        overflow-x-auto overflow-y-visible
        px-5 pb-3
        -webkit-overflow-scrolling touch
        scroll-snap-type-x mandatory
        scrollbar-hide
        overscroll-x-contain
      "
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {children}
      </div>
    </section>
  );
});

export default Section;
