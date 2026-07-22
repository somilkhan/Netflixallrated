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
        px-5 rounded-full
        text-sm font-medium leading-none
        border transition-all duration-200
        touch-manipulation select-none
        focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30
        active:scale-[0.97]
        ${active
          ? 'bg-white text-black border-white h-10'
          : 'bg-transparent text-[#9CA3AF] border-[#4B5563] hover:border-white/40 hover:text-white h-10'
        }
        ${className}
      `}
    >
      {label}
    </button>
  );
});
