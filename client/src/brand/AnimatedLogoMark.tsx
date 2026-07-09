import { useEffect, useState } from 'react';
import LogoMark, { type LogoMarkProps } from './LogoMark';
import './brand.css';

export interface AnimatedLogoMarkProps extends LogoMarkProps {
  /** Play the one-time intro (dither reveal + fade/scale) on mount. */
  intro?: boolean;
  /** Slow breathing glow, e.g. for splash/loading contexts. */
  breathe?: boolean;
  /** Soft glass shimmer sweep across the facets. */
  shimmer?: boolean;
  /** Pulse on hover/focus (interactive contexts, e.g. navbar button). */
  interactive?: boolean;
}

/**
 * Wraps `LogoMark` with the brand's motion language: a one-time dithered
 * reveal on mount, an optional slow breathing glow, a soft glass shimmer,
 * and a gentle pulse on hover. All motion collapses to a static mark under
 * `prefers-reduced-motion`.
 */
export default function AnimatedLogoMark({
  intro = true,
  breathe = false,
  shimmer = false,
  interactive = false,
  glow = breathe,
  className = '',
  focusable = false,
  ...rest
}: AnimatedLogoMarkProps & { focusable?: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const raf = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(raf); }, []);

  return (
    <span
      className={[
        'brand-mark-wrap',
        intro && mounted ? 'brand-mark-intro' : '',
        breathe ? 'brand-mark-breathe' : '',
        interactive ? 'brand-mark-hover' : '',
        className,
      ].filter(Boolean).join(' ')}
      tabIndex={interactive && focusable ? 0 : undefined}
    >
      <LogoMark glow={glow} {...rest} />
      {shimmer && <span className="brand-shimmer-layer" />}
    </span>
  );
}
