/**
 * BottomNav — solid background (no backdrop-blur on mobile = no GPU compositing cost).
 */
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Tv, Compass, Sword, BookMarked, Clock, User, Shield } from 'lucide-react';
import { useAuth } from '../lib/auth';

const BASE_ITEMS = [
  { icon: Home,       path: '/',           label: 'Home' },
  { icon: Tv,         path: '/tv',         label: 'TV' },
  { icon: Compass,    path: '/categories', label: 'Browse' },
  { icon: Sword,      path: '/anime',      label: 'Anime' },
  { icon: BookMarked, path: '/watchlist',  label: 'Watch' },
  { icon: Clock,      path: '/history',    label: 'History' },
];

export default function BottomNav() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user } = useAuth();

  const lastItem = user?.role === 'ADMIN'
    ? { icon: Shield, path: '/admin', label: 'Admin' }
    : { icon: User,   path: '/login', label: 'Profile' };

  const items = [...BASE_ITEMS, lastItem];

  return (
    <nav
      className="
        md:hidden
        fixed bottom-4 left-1/2 -translate-x-1/2 z-50
        flex items-center
        rounded-[30px]
        px-1.5 py-1.5
        gap-0
      "
      aria-label="Main navigation"
      style={{
        /* Solid bg — no backdrop-blur so GPU doesn't composite this layer every frame */
        background: '#0d0e11',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 8px 32px -4px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {items.map(item => {
        const active = loc.pathname === item.path ||
          (item.path !== '/' && loc.pathname.startsWith(item.path));

        return (
          <button
            key={item.path}
            onClick={() => nav(item.path)}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            className={`
              relative flex flex-col items-center justify-center
              w-[46px] h-[46px] rounded-[22px]
              gap-[3px]
              transition-colors duration-200
              focus:outline-none
              ${active
                ? 'text-white'
                : 'text-white/28 active:text-white/65'
              }
            `}
            style={active ? { background: 'rgba(255,255,255,0.08)' } : undefined}
          >
            <item.icon
              size={17}
              strokeWidth={active ? 2.3 : 1.8}
              className="relative z-10"
            />

            <span
              className={`
                relative z-10 font-sans text-[8.5px] font-medium leading-none
                ${active ? 'text-white' : 'text-white/28'}
              `}
            >
              {item.label}
            </span>

            {active && (
              <span className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-white" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
