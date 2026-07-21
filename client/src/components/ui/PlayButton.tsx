/**
 * PlayButton — circular, minimal, 48px play button with ring animation on hover.
 */
import { memo } from 'react';
import { Play, Pause } from 'lucide-react';

interface PlayButtonProps {
  playing?: boolean;
  size?: number;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  'aria-label'?: string;
}

export const PlayButton = memo(function PlayButton({
  playing = false,
  size = 48,
  onClick,
  className = '',
  'aria-label': ariaLabel,
}: PlayButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? (playing ? 'Pause' : 'Play')}
      className={`
        relative group flex items-center justify-center
        rounded-full bg-white text-black
        transition-transform duration-200 active:scale-90
        hover:scale-105 touch-manipulation select-none
        focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30
        shadow-[0_4px_20px_rgba(0,0,0,0.5)]
        ${className}
      `}
      style={{ width: size, height: size, minWidth: size }}
    >
      {/* Hover ring */}
      <span
        className="
          absolute inset-[-6px] rounded-full border border-white/30
          opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100
          transition-all duration-300
        "
        aria-hidden
      />
      {playing ? (
        <Pause size={size * 0.35} className="fill-current" />
      ) : (
        <Play size={size * 0.35} className="fill-current ml-[2px]" />
      )}
    </button>
  );
});
