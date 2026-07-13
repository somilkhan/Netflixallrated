import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Tv, Compass, Sword, BookMarked, Clock, User, Shield } from 'lucide-react';
import { useAuth } from '../lib/auth';

const BASE_ITEMS = [
  { icon: Home,        path: '/',           label: 'Home' },
  { icon: Tv,          path: '/tv',         label: 'TV' },
  { icon: Compass,     path: '/categories', label: 'Browse' },
  { icon: Sword,       path: '/anime',      label: 'Anime' },
  { icon: BookMarked,  path: '/watchlist',  label: 'Watchlist' },
  { icon: Clock,       path: '/history',    label: 'History' },
];

export default function BottomNav() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user } = useAuth();

  const lastItem = user?.role === 'ADMIN'
    ? { icon: Shield, path: '/admin',  label: 'Admin' }
    : { icon: User,   path: '/login',  label: 'Profile' };

  const items = [...BASE_ITEMS, lastItem];

  return (
    <div
      className="
        md:hidden
        fixed bottom-4 left-1/2 -translate-x-1/2 z-50
        flex items-center
        bg-[#0f0f0f]/90 backdrop-blur-2xl
        border border-white/[0.08]
        rounded-[28px]
        px-2 py-1.5
        shadow-[0_8px_32px_-8px_rgba(0,0,0,0.9)]
      "
      role="navigation"
      aria-label="Main navigation"
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
              w-[46px] h-[46px] rounded-[18px]
              gap-[3px]
              transition-all duration-200 ease-spring
              focus:outline-none
              ${active
                ? 'text-white'
                : 'text-[#555] hover:text-[#aaa]'
              }
            `}
          >
            {/* Active indicator */}

            <item.icon
              size={18}
              strokeWidth={active ? 2.2 : 1.8}
              className={`relative z-10 transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`}
            />

            <span
              className={`
                relative z-10 font-sans text-[9.5px] font-medium leading-none tracking-wide
                transition-colors duration-200
                ${active ? 'text-ink' : 'text-ink-faint'}
              `}
            >
              {item.label}
            </span>

            {/* Active dot */}
            {active && (
              <span className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-white" />
            )}
          </button>
        );
      })}
    </div>
  );
}
