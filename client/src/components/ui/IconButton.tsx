/**
 * IconButton — reusable icon button with consistent hover/active/focus states.
 * Follows the design spec: 40px (44px on mobile), transparent bg, white icon.
 */
import { memo, forwardRef } from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'glass' | 'solid';
  shape?: 'circle' | 'rounded';
  children: React.ReactNode;
}

const SIZE_MAP = {
  sm: 'w-8 h-8 min-w-[32px]',
  md: 'w-10 h-10 min-w-[40px] md:w-10 md:h-10',
  lg: 'w-11 h-11 min-w-[44px]',
} as const;

const SHAPE_MAP = {
  circle: 'rounded-full',
  rounded: 'rounded-lg',
} as const;

const VARIANT_MAP = {
  ghost:  'bg-transparent text-white/70 hover:bg-white/[0.08] hover:text-white',
  glass:  'bg-white/[0.06] border border-white/[0.08] text-white/70 hover:bg-white/[0.10] hover:border-white/[0.14] hover:text-white',
  solid:  'bg-white text-black hover:bg-white/90',
} as const;

export const IconButton = memo(forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { size = 'md', variant = 'ghost', shape = 'circle', className = '', children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        className={`
          inline-flex items-center justify-center shrink-0
          transition-all duration-200 touch-manipulation select-none
          active:scale-[0.92]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20
          disabled:opacity-40 disabled:pointer-events-none
          ${SIZE_MAP[size]}
          ${SHAPE_MAP[shape]}
          ${VARIANT_MAP[variant]}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
));
