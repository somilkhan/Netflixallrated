import { lazy, Suspense } from 'react';
import { PrimaryLogo, Monogram, NavbarLogo, SplashLogo, LoadingLogo, DarkVariantLogo, LogoMark } from '../brand';

const InteractiveLogoScene = lazy(() => import('../brand/InteractiveLogoScene'));

function Panel({ title, children, dark = false }: { title: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <div className={`rounded-2xl border p-6 flex flex-col items-center justify-center gap-4 min-h-[180px] ${dark ? 'bg-[#F5F0EC] border-[#F5F0EC]' : 'bg-surface border-line'}`}>
      <div className="flex items-center justify-center">{children}</div>
      <p className={`font-mono text-[11px] tracking-wide ${dark ? 'text-black/60' : 'text-ink-faint'}`}>{title}</p>
    </div>
  );
}

/**
 * Internal brand review page — not linked from any nav. Visit /brand
 * directly to review every asset in the new identity system.
 */
export default function BrandShowcase() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-14 space-y-14">
      <header className="space-y-3">
        <p className="font-mono text-[11px] tracking-[0.2em] text-maroon-bright uppercase">Brand identity</p>
        <h1 className="font-serif text-4xl text-ink">The Aperture Star</h1>
        <p className="text-ink-dim max-w-2xl text-[14px] leading-relaxed">
          A faceted four-point compass star cut like polished glass. Its diagonal creases
          echo an "N" (left facet zigzag) and an "A" (top facet apex + crossbar); at the
          center, where every facet meets, a sliver of pure background shows through as a
          hidden play glyph.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-mono text-[11px] tracking-wide text-ink-faint uppercase">Primary logo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Panel title="Primary lockup (mark + wordmark)"><PrimaryLogo size={56} animated /></Panel>
          <Panel title="Monogram"><Monogram size={72} /></Panel>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-mono text-[11px] tracking-wide text-ink-faint uppercase">System assets</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Panel title="Navbar logo (34px)"><NavbarLogo /></Panel>
          <Panel title="Favicon (16px)"><LogoMark size={16} detailed={false} title="Favicon" /></Panel>
          <Panel title="App icon"><LogoMark size={72} detailed glow /></Panel>
          <Panel title="Loading logo"><LoadingLogo size={64} /></Panel>
          <Panel title="Splash logo"><SplashLogo size={64} /></Panel>
          <Panel title="Dark-mode (light bg) variant" dark><DarkVariantLogo size={64} /></Panel>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-mono text-[11px] tracking-wide text-ink-faint uppercase">Interactive 3D mark</h2>
        <p className="text-ink-faint text-[12.5px]">Slow auto-rotate · drag to spin · click to pulse · cursor parallax.</p>
        <div className="rounded-2xl border border-line bg-surface p-6 flex items-center justify-center">
          <Suspense fallback={<div className="w-[320px] h-[320px] flex items-center justify-center text-ink-faint font-mono text-xs">Loading 3D mark…</div>}>
            <InteractiveLogoScene size={320} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
