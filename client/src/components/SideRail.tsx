/**
 * SideRail — icon-only vertical navigation rail for tablet/desktop.
 * Bingr-style minimal chrome: logo mark at top, icon stack in the middle,
 * profile/auth at the bottom. Mobile keeps the existing BottomNav dock;
 * this rail takes over navigation duties from md breakpoint upward so the
 * hero can run full-bleed with no top bar competing for space.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Tv, Compass, Sword, Clock, LayoutGrid, Search, Shield, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { AnimatedLogoMark } from '../brand';

const NAV_ITEMS = [
  { icon: Home,       path: '/',           label: 'Home' },
  { icon: Search,     path: '__search',    label: 'Search' },
  { icon: Tv,         path: '/tv',         label: 'TV Shows' },
  { icon: Clock,      path: '/history',    label: 'History' },
  { icon: Sword,      path: '/anime',      label: 'Anime' },
  { icon: Compass,    path: '/categories', label: 'Browse' },
  { icon: LayoutGrid, path: '/watchlist',  label: 'Watchlist' },
];

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
      className="
        hidden md:flex fixed inset-y-0 left-0 z-40
        w-[76px] flex-col items-center
        py-6 gap-1
      "
      aria-label="Main navigation"
    >
      {/* Ambient rail scrim so it reads on any hero image without a hard edge */}
      <div className="absolute inset-y-0 left-0 w-full -z-10 bg-gradient-to-r from-void/70 via-void/25 to-transparent" />

      {/* Logo */}
      <button
        onClick={() => nav('/')}
        className="shrink-0 mb-8 rounded-[10px] transition-transform hover:scale-105 active:scale-95"
        aria-label="NetflixAllrated home"
      >
        <AnimatedLogoMark size={30} interactive title="NetflixAllrated home" />
      </button>

      {/* Icon stack */}
      <div className="flex flex-col items-center gap-1.5">
        {NAV_ITEMS.map(item => {
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
                w-[44px] h-[44px] rounded-[14px]
                transition-all duration-200 ease-spring
                focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-bright/60
                ${active ? 'text-ink bg-white/[0.08]' : 'text-ink-faint hover:text-ink hover:bg-white/[0.04]'}
              `}
            >
              {active && (
                <span
                  className="absolute inset-0 rounded-[14px] pointer-events-none
                    bg-[radial-gradient(ellipse_80%_70%_at_50%_50%,rgba(194,67,79,0.22),transparent_70%)]"
                />
              )}
              <item.icon size={19} strokeWidth={active ? 2.2 : 1.7} className="relative z-10" />
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[16px] rounded-full
                  bg-maroon-bright shadow-[0_0_8px_rgba(194,67,79,0.8)]" />
              )}
              {/* Tooltip */}
              <span className="
                pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2
                whitespace-nowrap rounded-md bg-surface border border-line px-2 py-1
                font-sans text-[11px] text-ink opacity-0 -translate-x-1 scale-95
                group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100
                transition-all duration-150 z-30 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.6)]
              ">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Profile / Auth */}
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
                  bg-gradient-to-br from-maroon to-maroon-bright
                  border border-maroon-bright/50
                  flex items-center justify-center
                  font-sans font-bold text-[13px] text-white
                  hover:opacity-85 transition-opacity
                "
                title={user.displayName || user.email}
              >
                {initial}
              </button>
              {menuOpen && (
                <div className="
                  absolute left-[calc(100%+12px)] bottom-0 w-48
                  bg-surface border border-line rounded-2xl
                  shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6)] overflow-hidden z-50
                  animate-fadeUp
                ">
                  <div className="px-3.5 py-3 border-b border-line">
                    <p className="font-sans text-[12.5px] font-semibold text-ink truncate">
                      {user.displayName || 'User'}
                    </p>
                    <p className="font-mono text-[10px] text-ink-faint truncate">{user.email}</p>
                    {user.role === 'ADMIN' && (
                      <span className="mt-1.5 inline-block font-mono text-[8.5px] text-maroon-bright
                        bg-maroon/20 border border-maroon/30 rounded px-1.5 py-0.5">
                        ADMIN
                      </span>
                    )}
                  </div>
                  {user.role === 'ADMIN' && (
                    <button
                      onClick={() => { setMenuOpen(false); nav('/admin'); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 font-sans text-[13px] text-ink hover:bg-surface-2 transition-colors text-left"
                    >
                      <Shield size={13} className="text-maroon-bright" /> Admin Panel
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 font-sans text-[13px] text-ink-dim hover:bg-surface-2 hover:text-ink transition-colors text-left border-t border-line"
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
                w-[44px] h-[44px] rounded-[14px] flex items-center justify-center
                text-ink-faint hover:text-ink hover:bg-white/[0.04]
                transition-colors duration-150
              "
            >
              <LogIn size={19} strokeWidth={1.7} />
            </button>
          )
        )}
      </div>
    </nav>
  );
}
