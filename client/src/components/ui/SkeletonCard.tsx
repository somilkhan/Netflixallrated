import { memo } from 'react';

interface SkeletonCardProps {
  className?: string;
  fluid?: boolean;
}

export const SkeletonCard = memo(function SkeletonCard({ className = '', fluid = false }: SkeletonCardProps) {
  return (
    <div
      className={`
        ${fluid ? 'w-full' : 'shrink-0 w-[148px] md:w-[160px] scroll-snap-start'}
        ${className}
      `}
      aria-hidden="true"
    >
      {/* Poster skeleton */}
      <div
        className="relative w-full rounded-xl overflow-hidden bg-[#1A1A1A]"
        style={{ aspectRatio: '2/3' }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
            animation: 'shimmer 1.8s ease-in-out infinite',
          }}
        />
      </div>
      {/* Text skeleton */}
      <div className="mt-2 space-y-1.5">
        <div className="h-3 w-4/5 rounded-full bg-[#1A1A1A]" style={{ animation: 'shimmer 1.8s ease-in-out 0.2s infinite' }} />
        <div className="h-2.5 w-2/5 rounded-full bg-[#141414]" style={{ animation: 'shimmer 1.8s ease-in-out 0.4s infinite' }} />
      </div>
    </div>
  );
});

export function SkeletonRow({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden px-4 md:px-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
