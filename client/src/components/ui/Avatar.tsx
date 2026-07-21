/**
 * Avatar — user profile avatar, 32px circle with initials fallback.
 */
import { memo } from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
}

function getInitials(name?: string | null, email?: string | null): string {
  const source = name || email || '';
  if (!source) return '?';
  const parts = source.split(/[\s@]/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source[0]?.toUpperCase() ?? '?';
}

export const Avatar = memo(function Avatar({ src, name, email, size = 32, className = '' }: AvatarProps) {
  const initials = getInitials(name, email);
  const fontSize = Math.max(10, Math.round(size * 0.38));

  return (
    <div
      className={`
        relative shrink-0 flex items-center justify-center overflow-hidden
        rounded-full bg-white/[0.08] border border-white/[0.12]
        text-white font-semibold select-none
        ${className}
      `}
      style={{ width: size, height: size, fontSize }}
      aria-hidden
    >
      {src ? (
        <img
          src={src}
          alt={name ?? ''}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : initials === '?' ? (
        <User size={size * 0.5} className="text-white/60" />
      ) : (
        initials
      )}
    </div>
  );
});
