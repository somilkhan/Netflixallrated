/**
 * NotFound — 404 page. Full-bleed void, oversized serif numerals, and a
 * touch of personality (in the app's own voice, not borrowed) instead of a
 * bare error string.
 */
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { LogoMark } from '../brand';

export default function NotFound() {
  const nav = useNavigate();

  return (
    <div className="min-h-[calc(100vh-64px)] md:min-h-screen flex flex-col items-center justify-center px-6 text-center gap-6 page-enter">
      <div className="relative">
        <div
          className="absolute inset-0 -z-10 blur-2xl opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(194,67,79,0.35) 0%, transparent 70%)' }}
        />
        <LogoMark size={64} glow detailed />
      </div>

      <h1 className="font-serif font-semibold text-[clamp(56px,14vw,140px)] leading-none tracking-tight text-ink">
        404
      </h1>

      <div className="space-y-2 max-w-[380px]">
        <p className="font-sans text-[16px] font-semibold text-ink">
          This title dropped off the catalog.
        </p>
        <p className="font-sans text-[13.5px] text-ink-dim leading-relaxed">
          The page you're looking for doesn't exist, moved, or never made it past the cutting room floor.
        </p>
      </div>

      <button
        onClick={() => nav('/')}
        className="
          flex items-center gap-2 mt-2
          bg-ink text-void font-sans font-semibold text-[13px]
          px-5 py-2.5 rounded-full
          active:scale-[0.97] transition-transform duration-150
          shadow-[0_4px_16px_-4px_rgba(245,240,236,0.3)]
          hover:bg-ink/90
        "
      >
        <Home size={13} /> Back to Home
      </button>
    </div>
  );
}
