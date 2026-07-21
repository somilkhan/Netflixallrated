/**
 * ProgressBar — thin, elegant, clickable/draggable progress bar.
 * 4px default, 8px on hover, white fill, grey track.
 */
import { memo, useRef, useCallback } from 'react';

interface ProgressBarProps {
  value: number;       // 0-100
  buffered?: number;   // 0-100, optional buffered indicator
  onClick?: (pct: number) => void;
  onChange?: (pct: number) => void;
  className?: string;
  thin?: boolean;
}

export const ProgressBar = memo(function ProgressBar({
  value,
  buffered = 0,
  onClick,
  onChange,
  className = '',
  thin = false,
}: ProgressBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const getPct = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(getPct(e));
  }, [onClick, getPct]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const onMove = (ev: MouseEvent) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
      onChange?.(pct);
    };
    const onUp = (ev: MouseEvent) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
      onChange?.(pct);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [onChange]);

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      tabIndex={0}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      className={`
        group relative w-full cursor-pointer
        flex items-center
        ${thin ? 'h-4' : 'h-5'}
        ${className}
      `}
    >
      {/* Track */}
      <div className={`
        relative w-full rounded-full overflow-hidden bg-white/15
        transition-all duration-150
        ${thin ? 'h-[3px] group-hover:h-[5px]' : 'h-[4px] group-hover:h-[7px]'}
      `}>
        {/* Buffered */}
        {buffered > 0 && (
          <div
            className="absolute inset-y-0 left-0 bg-white/25 rounded-full"
            style={{ width: `${buffered}%` }}
          />
        )}
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 bg-white rounded-full transition-[width] duration-100"
          style={{ width: `${value}%` }}
        />
      </div>
      {/* Thumb */}
      <div
        className="
          absolute top-1/2 -translate-y-1/2 -translate-x-1/2
          w-3 h-3 rounded-full bg-white
          opacity-0 group-hover:opacity-100
          transition-all duration-150
          shadow-[0_0_6px_rgba(0,0,0,0.5)]
          pointer-events-none
        "
        style={{ left: `${value}%` }}
        aria-hidden
      />
    </div>
  );
});
