import { memo } from 'react';

interface SkeletonCardProps {
  className?: string;
  fluid?: boolean;
}

/** Netflix-style shimmer sweep animation */
const SHIMMER_SWEEP = {
  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
  animation: 'shimmer 1.6s linear infinite',
};

export const SkeletonCard = memo(function SkeletonCard({ className = '', fluid = false }: SkeletonCardProps) {
  return (
    <div
      className={`
        ${fluid ? 'w-full' : 'shrink-0 w-[140px] sm:w-[180px] lg:w-[230px] scroll-snap-start'}
        ${className}
      `}
      aria-hidden="true"
    >
      {/* Poster skeleton */}
      <div
        className="relative w-full rounded-lg overflow-hidden bg-surface"
        style={{ aspectRatio: '2/3' }}
      >
        <div
          className="absolute top-0 bottom-0 w-[40%]"
          style={SHIMMER_SWEEP}
        />
      </div>
      {/* Text skeleton */}
      <div className="mt-2 space-y-1.5">
        <div className="h-3 w-4/5 rounded-md bg-surface relative overflow-hidden">
          <div className="absolute inset-0" style={{ ...SHIMMER_SWEEP, animationDelay: '0.2s' }} />
        </div>
        <div className="h-2.5 w-2/5 rounded-md bg-surface relative overflow-hidden">
          <div className="absolute inset-0" style={{ ...SHIMMER_SWEEP, animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
});

export function SkeletonRow({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-hidden px-4 md:px-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
