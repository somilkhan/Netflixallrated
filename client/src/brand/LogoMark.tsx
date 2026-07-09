import { useId } from 'react';
import {
  STAR_OUTLINE, FACET_TOP_RIGHT, FACET_BOTTOM_RIGHT, FACET_BOTTOM_LEFT, FACET_TOP_LEFT,
  CREASE_A, CREASE_N, PLAY_NEGATIVE_SPACE, BRAND,
} from './mark';

export type LogoMarkVariant = 'glass' | 'mono' | 'outline' | 'flat';

export interface LogoMarkProps {
  size?: number;
  variant?: LogoMarkVariant;
  /** Adds the soft cinematic outer glow (hero / splash contexts). */
  glow?: boolean;
  /** Renders the facet crease lines (A/N hint). Turn off for tiny sizes (favicon). */
  detailed?: boolean;
  className?: string;
  'aria-hidden'?: boolean;
  title?: string;
}

/**
 * The Aperture Star — NetflixAllrated's primary mark. Pure SVG, no raster
 * assets, crisp at any size. See `brand/mark.ts` for the geometry rationale.
 */
export default function LogoMark({
  size = 40,
  variant = 'glass',
  glow = false,
  detailed = true,
  className = '',
  title = 'NetflixAllrated',
  ...aria
}: LogoMarkProps) {
  const uid = useId().replace(/:/g, '');

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role={aria['aria-hidden'] ? undefined : 'img'}
      aria-hidden={aria['aria-hidden']}
      aria-label={aria['aria-hidden'] ? undefined : title}
    >
      <defs>
        <linearGradient id={`g-tr-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={BRAND.rose} />
          <stop offset="100%" stopColor={BRAND.maroonBright} />
        </linearGradient>
        <linearGradient id={`g-br-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={BRAND.maroonBright} />
          <stop offset="100%" stopColor={BRAND.maroon} />
        </linearGradient>
        <linearGradient id={`g-bl-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={BRAND.maroon} />
          <stop offset="100%" stopColor={BRAND.maroonDeep} />
        </linearGradient>
        <linearGradient id={`g-tl-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={BRAND.maroonBright} />
          <stop offset="100%" stopColor={BRAND.maroon} />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          <path d={STAR_OUTLINE} />
        </clipPath>
        {glow && (
          <filter id={`glow-${uid}`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feColorMatrix
              in="b"
              type="matrix"
              values="0 0 0 0 0.76  0 0 0 0 0.26  0 0 0 0 0.31  0 0 0 0.9 0"
            />
          </filter>
        )}
      </defs>

      {glow && (
        <path d={STAR_OUTLINE} fill={BRAND.maroonBright} filter={`url(#glow-${uid})`} opacity={0.55} />
      )}

      <g clipPath={`url(#clip-${uid})`}>
        {variant === 'mono' ? (
          <path d="M0 0 H100 V100 H0 Z" fill={BRAND.ink} />
        ) : variant === 'outline' ? (
          <path d="M0 0 H100 V100 H0 Z" fill="none" />
        ) : variant === 'flat' ? (
          <path d="M0 0 H100 V100 H0 Z" fill={BRAND.maroonBright} />
        ) : (
          <>
            <path d={FACET_TOP_RIGHT} fill={`url(#g-tr-${uid})`} />
            <path d={FACET_BOTTOM_RIGHT} fill={`url(#g-br-${uid})`} />
            <path d={FACET_BOTTOM_LEFT} fill={`url(#g-bl-${uid})`} />
            <path d={FACET_TOP_LEFT} fill={`url(#g-tl-${uid})`} />
            {/* glass sheen */}
            <path d="M50 3.5 L96.5 50 L50 50 Z" fill={BRAND.ink} opacity={0.14} />
          </>
        )}

        {detailed && variant !== 'outline' && (
          <g stroke={variant === 'mono' ? BRAND.bg : BRAND.ink} strokeOpacity={variant === 'mono' ? 0.35 : 0.28} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d={CREASE_A} />
            <path d={CREASE_N} />
          </g>
        )}

        {/* hidden play glyph in negative space */}
        <path d={PLAY_NEGATIVE_SPACE} fill={variant === 'mono' ? BRAND.bg : BRAND.bg} />
      </g>

      <path
        d={STAR_OUTLINE}
        fill="none"
        stroke={variant === 'mono' ? BRAND.ink : BRAND.ink}
        strokeOpacity={variant === 'outline' ? 0.9 : 0.16}
        strokeWidth={variant === 'outline' ? 3 : 1.2}
      />
    </svg>
  );
}
