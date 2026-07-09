import LogoMark from './LogoMark';
import AnimatedLogoMark from './AnimatedLogoMark';
import Wordmark from './Wordmark';

/**
 * Composite lockups built from the mark + wordmark. These are the concrete
 * "Brand Assets" the identity system produces — swap any of these in
 * wherever the app currently shows the old "A" mark.
 */

export function PrimaryLogo({ size = 40, animated = false }: { size?: number; animated?: boolean }) {
  const Mark = animated ? AnimatedLogoMark : LogoMark;
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark size={size} detailed intro={animated} />
      <Wordmark size={size * 0.5} />
    </span>
  );
}

export function Monogram({ size = 40 }: { size?: number }) {
  return <LogoMark size={size} variant="glass" detailed glow />;
}

export function NavbarLogo({ size = 34 }: { size?: number }) {
  return (
    <AnimatedLogoMark
      size={size}
      detailed={size >= 28}
      interactive
      className="rounded-[9px]"
      title="NetflixAllrated home"
    />
  );
}

export function SplashLogo({ size = 96 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <AnimatedLogoMark size={size} intro breathe shimmer glow detailed />
      <Wordmark size={size * 0.24} />
    </div>
  );
}

export function LoadingLogo({ size = 56 }: { size?: number }) {
  return <AnimatedLogoMark size={size} breathe shimmer glow detailed={size >= 40} intro={false} />;
}

export function DarkVariantLogo({ size = 40 }: { size?: number }) {
  return <LogoMark size={size} variant="mono" detailed glow={false} />;
}
