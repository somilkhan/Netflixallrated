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
        bg-[#0d0e11]/92 backdrop-blur-2xl
        border border-white/[0.07]
        rounded-[30px]
        px-1.5 py-1.5
        shadow-nav
        gap-0
      "
      aria-label="Main navigation"
      style={{ boxShadow: '0 8px 40px -8px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.04)' }}
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
              transition-all duration-250 ease-spring
              focus:outline-none
              ${active
                ? 'text-white bg-white/[0.09]'
                : 'text-white/28 hover:text-white/55 hover:bg-white/[0.03]'
              }
            `}
          >
            <item.icon
              size={17}
              strokeWidth={active ? 2.3 : 1.8}
              className={`relative z-10 transition-all duration-250 ease-spring ${active ? 'scale-110' : 'scale-100'}`}
            />

            <span
              className={`
                relative z-10 font-sans text-[8.5px] font-medium leading-none
                transition-colors duration-200
                ${active ? 'text-white' : 'text-white/28'}
              `}
            >
              {item.label}
            </span>

            {/* Active dot */}
            {active && (
              <span
                className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-white"
                style={{ boxShadow: '0 0 6px rgba(255,255,255,0.7)' }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
