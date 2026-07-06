import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Tv, Sword, BookMarked, User, Shield } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function BottomNav() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user } = useAuth();

  const items = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Tv, path: '/tv', label: 'TV Shows' },
    { icon: Sword, path: '/anime', label: 'Anime' },
    { icon: BookMarked, path: '/watchlist', label: 'Watchlist' },
    user?.role === 'ADMIN'
      ? { icon: Shield, path: '/admin', label: 'Admin' }
      : { icon: User, path: '/login', label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-1 items-center bg-surface/95 backdrop-blur-xl border border-line rounded-full p-1.5 z-50 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {items.map(item => {
        const active = loc.pathname === item.path || (item.path !== '/' && loc.pathname.startsWith(item.path));
        return (
          <button
            key={item.path}
            onClick={() => nav(item.path)}
            title={item.label}
            className={`w-[38px] h-[38px] rounded-full flex items-center justify-center transition-all ${
              active
                ? 'text-void bg-maroon-bright shadow-cyan-sm'
                : 'text-ink-faint hover:text-ink-dim'
            }`}
          >
            <item.icon size={17} />
          </button>
        );
      })}
    </div>
  );
}
