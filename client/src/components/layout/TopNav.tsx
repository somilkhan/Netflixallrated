/**
 * TopNav — unified top navigation bar.
 * Desktop: transparent → glassmorphism on scroll. Logo | nav links | search + profile.
 * Mobile:  Logo | search icon | hamburger → full-screen menu overlay.
 */
import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Menu, LogIn, LogOut, Shield, User, Bookmark, Clock, Home, Tv, Swords, Trophy, Compass } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { useClickOutside } from '../../hooks/useClickOutside';

const NAV_LINKS = [
  { label: 'Home',      path: '/' },
  { label: 'Browse',    path: '/categories' },
  { label: 'TV Shows',  path: '/tv' },
  { label: 'Anime',     path: '/anime' },
  { label: 'My List',   path: '/watchlist' },
];

const MOBILE_NAV = [
  { icon: Home,     label: 'Home',     path: '/' },
  { icon: Tv,       label: 'TV Shows', path: '/tv' },
  { icon: Trophy,   label: 'Sports',   path: '/sports' },
  { icon: Swords,   label: 'Anime',    path: '/anime' },
  { icon: Compass,  label: 'Browse',   path: '/categories' },
  { icon: Bookmark, label: 'My List',  path: '/watchlist' },
  { icon: Clock,    label: 'History',  path: '/history' },
];

interface TopNavProps {
  onOpenSearch?: () => void;
}

const TopNav = memo(function TopNav({ onOpenSearch }: TopNavProps) {
  const nav = useNavigate();
  const loc = useLocation();
  const { user, signOut, isLoading } = useAuth();
  const { scrollY } = useScrollDirection();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const isScrolled = scrollY > 50;
  const initial = user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  useClickOutside(profileRef, useCallback(() => setProfileOpen(false), []), profileOpen);
  useClickOutside(searchRef, useCallback(() => { setSearchOpen(false); setSearchQuery(''); }, []), searchOpen);

  // Close mobile menu on navigation
  useEffect(() => { setMenuOpen(false); }, [loc.pathname]);

  // Ctrl+K opens search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (onOpenSearch) {
          onOpenSearch();
        } else {
          setSearchOpen(true);
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
        setMenuOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpenSearch]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      nav(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  }, [searchQuery, nav]);

  const handleSignOut = useCallback(async () => {
    setProfileOpen(false);
    setMenuOpen(false);
    await signOut();
    nav('/');
  }, [signOut, nav]);

  const handleSearchOpen = useCallback(() => {
    if (onOpenSearch) {
      onOpenSearch();
    } else {
      setSearchOpen(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [onOpenSearch]);

  return (
    <>
      {/* ── Main nav bar ────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 inset-x-0 z-50 flex items-center h-16 px-4 md:px-6 transition-all duration-300"
        style={{
          background: isScrolled
            ? 'rgba(10, 10, 10, 0.85)'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
          backdropFilter: isScrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(12px)' : 'none',
          borderBottom: isScrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <button
          type="button"
          onClick={() => nav('/')}
          className="shrink-0 mr-6 touch-manipulation active:opacity-70 transition-opacity"
          aria-label="Allrated home"
        >
          <span className="text-white font-bold text-xl tracking-[-0.03em] leading-none">
            all<span className="text-white/50">rated</span>
          </span>
        </button>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1 mr-auto">
          {NAV_LINKS.map(link => {
            const active = loc.pathname === link.path ||
              (link.path !== '/' && loc.pathname.startsWith(link.path));
            return (
              <button
                key={link.path}
                type="button"
                onClick={() => nav(link.path)}
                aria-current={active ? 'page' : undefined}
                className={`
                  h-9 px-3.5 rounded-lg text-sm font-medium
                  transition-colors duration-200 touch-manipulation
                  ${active
                    ? 'text-white bg-white/[0.08]'
                    : 'text-[#A3A3A3] hover:text-white hover:bg-white/[0.04]'
                  }
                `}
              >
                {link.label}
              </button>
            );
          })}
        </div>

        {/* Right side: search + profile */}
        <div className="ml-auto flex items-center gap-2">

          {/* Search — expandable on desktop, icon-only trigger on mobile */}
          <div ref={searchRef} className="relative">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <div className="
                  flex items-center gap-2
                  h-9 px-3 rounded-full
                  bg-white/[0.07] border border-white/[0.12]
                  w-[200px] md:w-[280px]
                ">
                  <Search size={13} className="shrink-0 text-white/50" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search titles…"
                    className="
                      flex-1 min-w-0 bg-transparent border-none outline-none
                      text-[13px] text-white placeholder:text-white/30
                    "
                    aria-label="Search"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                    className="shrink-0 text-white/40 hover:text-white/80 transition-colors"
                    aria-label="Close search"
                  >
                    <X size={12} />
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={handleSearchOpen}
                aria-label="Search"
                className="
                  flex items-center justify-center w-9 h-9 rounded-full
                  text-[#A3A3A3] hover:text-white hover:bg-white/[0.06]
                  transition-colors duration-200 touch-manipulation
                "
              >
                <Search size={17} strokeWidth={1.8} />
              </button>
            )}
          </div>

          {/* Profile — desktop */}
          <div ref={profileRef} className="relative hidden md:block">
            {!isLoading && (
              user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setProfileOpen(o => !o)}
                    aria-label="Account menu"
                    aria-expanded={profileOpen}
                    className="
                      w-8 h-8 rounded-full flex items-center justify-center
                      bg-white/[0.08] border border-white/[0.12]
                      text-[13px] font-semibold text-white
                      hover:bg-white/[0.14] hover:border-white/[0.20]
                      transition-colors duration-200
                    "
                    title={user.displayName || user.email || ''}
                  >
                    {initial}
                  </button>

                  {profileOpen && (
                    <div className="
                      absolute right-0 top-[calc(100%+8px)] w-52 z-50
                      rounded-xl border border-white/[0.08] overflow-hidden
                      animate-menu
                    " style={{ background: '#141414', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                      <div className="px-3.5 py-3 border-b border-white/[0.06]">
                        <p className="text-[12.5px] font-semibold text-white truncate">
                          {user.displayName || 'User'}
                        </p>
                        <p className="text-[11px] text-[#737373] truncate mt-0.5">{user.email}</p>
                        {user.role === 'ADMIN' && (
                          <span className="mt-1.5 inline-block text-[9px] text-white/50 bg-white/[0.06] border border-white/[0.10] rounded px-1.5 py-0.5 uppercase tracking-wide">
                            Admin
                          </span>
                        )}
                      </div>
                      {user.role === 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => { setProfileOpen(false); nav('/admin'); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-white/80 hover:bg-white/[0.04] hover:text-white transition-colors text-left"
                        >
                          <Shield size={13} className="text-white/40" />
                          Admin Panel
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { setProfileOpen(false); nav('/history'); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-white/80 hover:bg-white/[0.04] hover:text-white transition-colors text-left"
                      >
                        <Clock size={13} className="text-white/40" />
                        Watch History
                      </button>
                      <button
                        type="button"
                        onClick={() => { setProfileOpen(false); nav('/watchlist'); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-white/80 hover:bg-white/[0.04] hover:text-white transition-colors text-left"
                      >
                        <Bookmark size={13} className="text-white/40" />
                        My List
                      </button>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[#737373] hover:bg-white/[0.04] hover:text-white transition-colors text-left border-t border-white/[0.06]"
                      >
                        <LogOut size={13} />
                        Sign out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => nav('/login')}
                  className="
                    flex items-center gap-1.5
                    h-8 px-3.5 rounded-full
                    text-[12px] font-medium text-white/70
                    border border-white/[0.12] hover:border-white/[0.22] hover:text-white
                    transition-colors duration-200
                  "
                >
                  <LogIn size={12} /> Sign in
                </button>
              )
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="
              md:hidden flex items-center justify-center
              w-9 h-9 rounded-full
              text-[#A3A3A3] hover:text-white hover:bg-white/[0.06]
              transition-colors duration-200 touch-manipulation
            "
          >
            {menuOpen ? <X size={18} strokeWidth={1.8} /> : <Menu size={18} strokeWidth={1.8} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile full-screen menu ──────────────────────────────────────── */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 flex flex-col"
          style={{
            background: 'rgba(10, 10, 10, 0.97)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
          aria-modal="true"
          role="dialog"
          aria-label="Navigation menu"
        >
          {/* Spacer for nav bar */}
          <div className="h-16" />

          {/* Nav items — large tap targets */}
          <nav className="flex-1 flex flex-col justify-center px-6 gap-1">
            {MOBILE_NAV.map(item => {
              const active = loc.pathname === item.path ||
                (item.path !== '/' && loc.pathname.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => nav(item.path)}
                  aria-current={active ? 'page' : undefined}
                  className={`
                    flex items-center gap-4
                    h-14 px-4 rounded-xl
                    text-lg font-medium
                    transition-colors duration-200 touch-manipulation
                    active:bg-white/[0.06]
                    ${active
                      ? 'text-white bg-white/[0.06]'
                      : 'text-[#A3A3A3]'
                    }
                  `}
                >
                  <item.icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Profile section at bottom */}
          <div className="px-6 pb-8 pt-4 border-t border-white/[0.06]">
            {!isLoading && (
              user ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-sm font-semibold text-white">
                      {initial}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{user.displayName || 'User'}</p>
                      <p className="text-xs text-[#737373]">{user.email}</p>
                    </div>
                  </div>
                  {user.role === 'ADMIN' && (
                    <button
                      type="button"
                      onClick={() => nav('/admin')}
                      className="w-full flex items-center gap-3 h-12 px-4 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors text-left touch-manipulation"
                    >
                      <Shield size={16} className="text-white/40" />
                      Admin Panel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 h-12 px-4 rounded-xl text-sm text-[#737373] hover:text-white hover:bg-white/[0.04] transition-colors text-left touch-manipulation"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => nav('/login')}
                  className="w-full flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-medium text-white bg-white/[0.08] border border-white/[0.12] hover:bg-white/[0.12] transition-colors touch-manipulation"
                >
                  <User size={16} />
                  Sign in
                </button>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
});

export default TopNav;
