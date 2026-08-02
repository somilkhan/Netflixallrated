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
        px-4 py-1.5 rounded-[8px]
        text-sm font-medium leading-none
        border transition-all duration-200
        touch-manipulation select-none
        focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30
        active:scale-[0.97]
        ${active
          ? 'bg-white text-black border-white'
          : 'bg-transparent text-white border-white/20 hover:border-white/40'
        }
        ${className}
      `}
    >
      {label}
    </button>
  );
});
