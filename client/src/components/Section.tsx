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
        if (e.isIntersecting) { el.classList.add('opacity-100', 'translate-y-0'); el.classList.remove('opacity-0', 'translate-y-5'); io.unobserve(el); }
      });
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className="px-5 pt-9 pb-1.5 opacity-0 translate-y-5 transition-all duration-500">
      <div className="flex items-baseline w-full mb-4">
        <span className="font-serif text-xl font-semibold tracking-tight">{title}</span>
        {count && <span className="font-mono text-[11px] text-ink-faint ml-2">{count}</span>}
        <div className="h-px bg-line flex-1 mx-4" />
        <button
          onClick={() => viewAllPath && nav(viewAllPath)}
          className={`font-mono text-[11px] text-ink-dim whitespace-nowrap flex items-center gap-1 ${viewAllPath ? 'hover:text-ink transition-colors cursor-pointer' : 'cursor-default'}`}
        >
          view all →
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2.5 scrollbar-hide overscroll-x-contain" style={{ scrollSnapType: 'x mandatory' }}>
        {children}
      </div>
    </section>
  );
}
