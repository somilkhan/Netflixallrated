import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface SectionProps {
  title: string;
  count?: string;
  children: React.ReactNode;
  viewAllPath?: string;
}

export default function Section({ title, count, children, viewAllPath }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  const nav = useNavigate();

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { el.classList.add('opacity-100', 'translate-y-0'); el.classList.remove('opacity-0', 'translate-y-4'); io.unobserve(el); }
      });
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className="px-5 pt-9 pb-1.5 opacity-0 translate-y-4 transition-all duration-500">
      <div className="flex items-center w-full mb-4 gap-3">
        {/* Cyan accent line */}
        <span className="w-[3px] h-5 rounded-full bg-maroon-bright shrink-0" />
        <span className="font-sans text-[15px] font-semibold tracking-tight text-ink">{title}</span>
        {count && <span className="font-mono text-[10px] text-ink-faint bg-surface border border-line rounded px-1.5 py-0.5">{count}</span>}
        <div className="h-px bg-line flex-1" />
        <button
          onClick={() => viewAllPath && nav(viewAllPath)}
          className={`font-mono text-[10px] text-ink-faint whitespace-nowrap flex items-center gap-1 tracking-wide ${viewAllPath ? 'hover:text-maroon-bright transition-colors cursor-pointer' : 'cursor-default'}`}
        >
          VIEW ALL →
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2.5 scrollbar-hide overscroll-x-contain" style={{ scrollSnapType: 'x mandatory' }}>
        {children}
      </div>
    </section>
  );
}
