/**
 * GlassLoader — the app's single premium loading primitive. A frosted
 * burgundy-glass disc with a soft rotating glow ring, used everywhere the
 * app needs to signal "working" instead of a plain spinner.
 *
 * - `GlassLoader`  — fixed, full-viewport overlay (initial boot, route
 *   transitions / Suspense fallback). Fades in/out; unmounts after the
 *   fade-out transition so it never blocks input.
 * - `InlineLoader` — same visual, laid out in normal flow with a reserved
 *   min-height so content never jumps when it's swapped for real data.
 */
import { useEffect, useId, useState } from 'react';
import { LogoMark } from '../brand';

function LoaderMark({ size = 56 }: { size?: number }) {
  const gradId = `glr-grad-${useId().replace(/:/g, '')}`;
  return (
    <div className="glass-loader-mark" style={{ width: size, height: size }}>
      <div className="glass-loader-glow" />
      <div className="glass-loader-disc">
        <LogoMark size={size * 0.5} detailed={size >= 40} aria-hidden />
      </div>
      <svg className="glass-loader-ring" viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(245,240,236,0.08)" strokeWidth="3" />
        <circle
          cx="50" cy="50" r="44" fill="none" stroke={`url(#${gradId})`} strokeWidth="3"
          strokeLinecap="round" strokeDasharray="70 207"
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C2434F" stopOpacity="0" />
            <stop offset="55%" stopColor="#C2434F" stopOpacity="1" />
            <stop offset="100%" stopColor="#F0A5AD" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export function InlineLoader({
  label = 'Loading your experience…',
  minHeight = 220,
  size = 56,
  className = '',
}: {
  label?: string | null;
  minHeight?: number;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 w-full ${className}`}
      style={{ minHeight }}
      role="status"
      aria-live="polite"
    >
      <LoaderMark size={size} />
      {label && <p className="font-mono text-[11px] tracking-wide text-ink-faint animate-[glPulse_1.8s_ease-in-out_infinite]">{label}</p>}
    </div>
  );
}

export default function GlassLoader({
  visible,
  label = 'Loading your experience…',
}: {
  visible: boolean;
  label?: string | null;
}) {
  // Keep mounted through the fade-out transition, then unmount.
  const [mounted, setMounted] = useState(visible);
  useEffect(() => {
    if (visible) { setMounted(true); return; }
    const t = setTimeout(() => setMounted(false), 320);
    return () => clearTimeout(t);
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center gap-5 bg-[#090909]/90 backdrop-blur-md transition-opacity duration-300 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
      role="status"
      aria-live="polite"
      aria-label={label || 'Loading'}
    >
      <LoaderMark size={72} />
      {label && <p className="font-mono text-[12px] tracking-wide text-ink-dim animate-[glPulse_1.8s_ease-in-out_infinite]">{label}</p>}
    </div>
  );
}
