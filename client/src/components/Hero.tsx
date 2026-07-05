import { useEffect, useRef } from 'react';
import { Play, Info } from 'lucide-react';
import Meter from './Meter';

export default function Hero({ title }: { title: any }) {
  const bgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!bgRef.current || !window.matchMedia('(pointer:fine)').matches) return;
    const el = bgRef.current.parentElement; if (!el) return;
    let ticking = false, lx = 0, ly = 0;
    const onMove = (e: MouseEvent) => {
      lx = (e.clientX / window.innerWidth - 0.5) * 14; ly = (e.clientY / window.innerHeight - 0.5) * 14;
      if (!ticking) { requestAnimationFrame(() => { if (bgRef.current) bgRef.current.style.transform = `translate3d(${lx}px, ${ly}px, 0)`; ticking = false; }); ticking = true; }
    };
    el.addEventListener('mousemove', onMove, { passive: true });
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  if (!title) return null;
  return (
    <section className="relative min-h-[86vh] flex items-end px-5 pb-11 border-b border-line overflow-hidden">
      <div
        ref={bgRef}
        className="absolute inset-[-4%] z-0 animate-drift will-change-transform bg-cover bg-center"
        style={{
          backgroundImage: title.backdropUrl
            ? `linear-gradient(160deg, rgba(26,17,16,0.55), rgba(11,9,8,0.85) 75%), url(${title.backdropUrl})`
            : 'radial-gradient(90% 70% at 12% 0%, #341318 0%, transparent 55%), radial-gradient(70% 60% at 88% 10%, #14161e 0%, transparent 50%), linear-gradient(160deg, #1a1110, #0B0908 75%)',
        }}
      >
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
      </div>
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-void/50 to-void" />
      <div className="relative z-[2] max-w-[600px] space-y-4">
        <div className="font-mono text-[11px] tracking-widest text-ink-dim uppercase flex items-center gap-2 animate-fadeUp"><span className="w-4 h-px bg-maroon-bright" /> Featured Today</div>
        <h1 className="font-serif font-semibold text-[clamp(46px,9vw,78px)] leading-[0.97] tracking-tight animate-fadeUp" style={{ animationDelay: '0.1s' }}>{title.name}</h1>
        <p className="text-ink-dim text-sm leading-relaxed max-w-[440px] animate-fadeUp" style={{ animationDelay: '0.2s' }}>{title.synopsis}</p>
        <div className="flex items-center gap-5 pb-6 border-b border-line flex-wrap animate-fadeUp" style={{ animationDelay: '0.3s' }}>
          <Meter tier="PERFECTION" />
          <div className="font-mono text-xs text-ink-dim flex gap-2 items-center"><span>{title.year}</span><span className="text-ink-faint">·</span><span>{title.runtimeMinutes ? `${Math.floor(title.runtimeMinutes / 60)}H ${title.runtimeMinutes % 60}M` : '45M'}</span><span className="text-ink-faint">·</span><span>{title.type}</span></div>
        </div>
        <div className="flex gap-2.5 animate-fadeUp" style={{ animationDelay: '0.4s' }}>
          <button className="flex items-center gap-2 bg-ink text-void font-semibold text-[13.5px] px-5 py-3 rounded-lg active:scale-[0.97] transition-transform"><Play size={13} fill="currentColor" /> Play</button>
          <button className="flex items-center gap-2 bg-transparent text-ink font-semibold text-[13.5px] px-5 py-3 rounded-lg border border-line-bright hover:bg-surface transition-colors"><Info size={14} /> More info</button>
        </div>
      </div>
    </section>
  );
}
