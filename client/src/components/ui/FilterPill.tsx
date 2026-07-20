import { memo } from 'react';

interface FilterPillProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  className?: string;
}

export const FilterPill = memo(function FilterPill({
  label,
  active = false,
  onClick,
  className = '',
}: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`
        shrink-0 inline-flex items-center justify-center
        h-9 px-4 rounded-full
        text-sm font-medium leading-none
        border transition-all duration-200
        touch-manipulation select-none
        focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30
        active:scale-[0.97]
        ${active
          ? 'bg-white text-black border-white'
          : 'bg-white/[0.04] text-[#A3A3A3] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] hover:text-white'
        }
        ${className}
      `}
    >
      {label}
    </button>
  );
});
