/**
 * SideRail — exact bingr.one vertical navigation rail.
 * 64px wide, solid #0f1014 bg, white active icon, gray inactive.
 * No hover background boxes — color-only transitions.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Tv, Compass, Sword, Clock, LayoutGrid, Search, Shield, LogOut, LogIn, Bookmark, Zap } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { AnimatedLogoMark } from '../brand';

const NAV_ITEMS = [
  { icon: Home,       path: '/',           label: 'Home' },
  { icon: Search,     path: '__search',    label: 'Search' },
  { icon: Tv,         path: '/tv',         label: 'TV Shows' },
  { icon: Clock,      path: '/history',    label: 'History' },
  { icon: Bookmark,   path: '/watchlist',  label: 'Watchlist' },
  { icon: Sword,      path: '/anime',      label: 'Anime' },
  { icon: Zap,        path: '/categories', label: 'Browse' },
  { icon: LayoutGrid, path: '/categories', label: 'Categories' },
];

// Deduplicate paths so /categories only shows once
const UNIQUE_NAV = NAV_ITEMS.filter((item, idx, arr) =>
  arr.findIndex(i => i.label === item.label) === idx
);

export default function SideRail({ onOpenSearch }: { onOpenSearch: () => void }) {
  const nav = useNavigate();
  const loc = useLocation();
  const { user, signOut, isLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    nav('/');
  };

  const initial = user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  return (
    <nav
      className="hidden md:flex fixed inset-y-0 left-0 z-40 flex-col items-center py-5 gap-0"
      style={{ width: 64, background: '#0f1014' }}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <button
        onClick={() => nav('/')}
        className="shrink-0 mb-8 mt-1 transition-transform hover:scale-105 active:scale-95"
        aria-label="Home"
      >
        <AnimatedLogoMark size={26} interactive title="Home" variant="mono" />
      </button>

      {/* Icon stack */}
      <div className="flex flex-col items-center gap-0.5">
        {UNIQUE_NAV.map(item => {
          const isSearch = item.path === '__search';
          const active = !isSearch && (
            loc.pathname === item.path ||
            (item.path !== '/' && loc.pathname.startsWith(item.path))
          );
          return (
            <button
              key={item.label}
              onClick={() => (isSearch ? onOpenSearch() : nav(item.path))}
              aria-label={item.label}
              title={item.label}
              aria-current={active ? 'page' : undefined}
              className={`
                group relative flex items-center justify-center
                w-[48px] h-[44px] rounded-[12px]
                transition-colors duration-150
                focus:outline-none
                ${active ? 'text-white' : 'text-white/30 hover:text-white/70'}
              `}
            >
              <item.icon
                size={20}
                strokeWidth={active ? 2.2 : 1.7}
                className="relative z-10"
              />

              {/* Tooltip */}
              <span className="
                pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2
                whitespace-nowrap rounded-lg bg-[#1a1c20] border border-white/10 px-2.5 py-1.5
                font-sans text-[12px] text-white opacity-0 -translate-x-1 scale-95
                group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100
                transition-all duration-150 z-30 shadow-xl
              ">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Profile / Auth — pinned to bottom */}
      <div className="mt-auto relative shrink-0" ref={menuRef}>
        {!isLoading && (
          user ? (
            <>
              <button
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Account menu"
                aria-expanded={menuOpen}
                className="
                  w-[36px] h-[36px] rounded-full
                  bg-white/10 border border-white/15
                  flex items-center justify-center
                  font-sans font-semibold text-[13px] text-white
                  hover:bg-white/20 transition-colors
                "
                title={user.displayName || user.email}
              >
                {initial}
              </button>
              {menuOpen && (
                <div className="
                  absolute left-[calc(100%+12px)] bottom-0 w-52
                  bg-[#1a1c20] border border-white/10 rounded-2xl
                  shadow-[0_16px_40px_-8px_rgba(0,0,0,0.8)] overflow-hidden z-50
                  animate-fadeUp
                ">
                  <div className="px-3.5 py-3 border-b border-white/10">
                    <p className="font-sans text-[12.5px] font-semibold text-white truncate">
                      {user.displayName || 'User'}
                    </p>
                    <p className="font-sans text-[10px] text-white/40 truncate">{user.email}</p>
                    {user.role === 'ADMIN' && (
                      <span className="mt-1.5 inline-block font-sans text-[8.5px] text-white/70
                        bg-white/10 border border-white/20 rounded px-1.5 py-0.5 uppercase tracking-wide">
                        Admin
                      </span>
                    )}
                  </div>
                  {user.role === 'ADMIN' && (
                    <button
                      onClick={() => { setMenuOpen(false); nav('/admin'); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 font-sans text-[13px] text-white hover:bg-white/[0.05] transition-colors text-left"
                    >
                      <Shield size={13} className="text-white/60" /> Admin Panel
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 font-sans text-[13px] text-white/60 hover:bg-white/[0.05] hover:text-white transition-colors text-left border-t border-white/10"
                  >
                    <LogOut size={13} /> Sign out
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => nav('/login')}
              aria-label="Sign in"
              title="Sign in"
              className="
                w-[48px] h-[44px] rounded-[12px] flex items-center justify-center
                text-white/30 hover:text-white/70
                transition-colors duration-150
              "
            >
              <LogIn size={20} strokeWidth={1.7} />
            </button>
          )
        )}
      </div>
    </nav>
  );
}
