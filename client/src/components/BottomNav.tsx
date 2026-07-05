import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Tv, Clock, User } from 'lucide-react';

const items = [
  { icon: Home, path: '/' },
  { icon: Search, path: '/search' },
  { icon: Tv, path: '/watchlist' },
  { icon: Clock, path: '/history' },
  { icon: User, path: '/profile' },
];

export default function BottomNav() {
  const nav = useNavigate();
  const loc = useLocation();
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 items-center bg-surface/90 backdrop-blur-xl border border-line rounded-full p-2 z-50">
      {items.map(item => {
        const active = loc.pathname === item.path;
        return <button key={item.path} onClick={() => nav(item.path)} className={`w-[38px] h-[38px] rounded-full flex items-center justify-center transition-all ${active ? 'text-void bg-ink' : 'text-ink-faint hover:text-ink-dim'}`}><item.icon size={18} /></button>;
      })}
    </div>
  );
}
