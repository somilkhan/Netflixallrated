/**
 * SideRail — bingr-style icon-only vertical navigation rail.
 * Pure black background, white active icon, gray inactive icons.
 * No colored accents — matches bingr.one exactly.
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
      className="hidden md:flex fixed inset-y-0 left-0 z-40 w-[68px] flex-col items-center py-5 gap-0"
      style={{ background: 'transparent' }}
      aria-label="Main navigation"
    >
      {/* Subtle left-side shadow so icons read on any hero */}
      <div className="absolute inset-y-0 left-0 w-full -z-10 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

      {/* Logo */}
      <button
        onClick={() => nav('/')}
        className="shrink-0 mb-7 mt-1 rounded-[10px] transition-transform hover:scale-105 active:scale-95"
        aria-label="Home"
      >
        <AnimatedLogoMark size={28} interactive title="Home" variant="mono" />
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
                w-[48px] h-[48px] rounded-[14px]
                transition-all duration-200
                focus:outline-none
                ${active
                  ? 'text-white'
                  : 'text-[#555] hover:text-[#ccc]'}
              `}
            >
              <item.icon size={20} strokeWidth={active ? 2.1 : 1.6} className="relative z-10" />

              {/* Tooltip */}
              <span className="
                pointer-events-none absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2
                whitespace-nowrap rounded-lg bg-[#1a1a1a] border border-white/10 px-2.5 py-1.5
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
                  w-[38px] h-[38px] rounded-full
                  bg-[#2a2a2a] border border-white/10
                  flex items-center justify-center
                  font-sans font-bold text-[13px] text-white
                  hover:bg-white/20 transition-colors
                "
                title={user.displayName || user.email}
              >
                {initial}
              </button>
              {menuOpen && (
                <div className="
                  absolute left-[calc(100%+12px)] bottom-0 w-52
                  bg-[#111] border border-white/10 rounded-2xl
                  shadow-[0_16px_40px_-8px_rgba(0,0,0,0.8)] overflow-hidden z-50
                  animate-fadeUp
                ">
                  <div className="px-3.5 py-3 border-b border-white/10">
                    <p className="font-sans text-[12.5px] font-semibold text-white truncate">
                      {user.displayName || 'User'}
                    </p>
                    <p className="font-mono text-[10px] text-[#666] truncate">{user.email}</p>
                    {user.role === 'ADMIN' && (
                      <span className="mt-1.5 inline-block font-mono text-[8.5px] text-[#C2434F]
                        bg-[#C2434F]/10 border border-[#C2434F]/30 rounded px-1.5 py-0.5">
                        ADMIN
                      </span>
                    )}
                  </div>
                  {user.role === 'ADMIN' && (
                    <button
                      onClick={() => { setMenuOpen(false); nav('/admin'); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 font-sans text-[13px] text-white hover:bg-white/[0.05] transition-colors text-left"
                    >
                      <Shield size={13} className="text-[#C2434F]" /> Admin Panel
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 font-sans text-[13px] text-[#999] hover:bg-white/[0.05] hover:text-white transition-colors text-left border-t border-white/10"
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
                w-[48px] h-[48px] rounded-[14px] flex items-center justify-center
                text-[#666] hover:text-white hover:bg-white/[0.06]
                transition-colors duration-150
              "
            >
              <LogIn size={20} strokeWidth={1.6} />
            </button>
          )
        )}
      </div>
    </nav>
  );
}
