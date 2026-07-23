/**
 * TopNav — unified top navigation bar (rebuilt from scratch).
 * Desktop: transparent → glassmorphism on scroll. Logo | nav links | search + profile.
 * Mobile:  Logo | search icon | hamburger → full-screen menu overlay.
 */
import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, X, Menu, LogIn, LogOut, Shield, User,
  Bookmark, Clock, Home, Tv, Trophy, Swords, Compass,
  ChevronDown, Film,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { useClickOutside } from '../../hooks/useClickOutside';
import { Avatar } from '../ui/Avatar';

const NAV_LINKS = [
  { label: 'Home',     path: '/' },
  { label: 'Browse',   path: '/browse' },
  { label: 'TV Shows', path: '/tv' },
  { label: 'Anime',    path: '/anime' },
  { label: 'My List',  path: '/my-list' },
];

const MOBILE_NAV = [
  { icon: Home,       label: 'Home',      path: '/' },
  { icon: Film,       label: 'Browse',    path: '/browse' },
  { icon: Tv,         label: 'TV Shows',  path: '/tv' },
  { icon: Trophy,     label: 'Sports',    path: '/sports' },
  { icon: Swords,     label: 'Anime',     path: '/anime' },
   { icon: Bookmark,   label: 'My List',   path: '/my-list' },
  { icon: Clock,      label: 'History',   path: '/history' },
  { icon: Compass,    label: 'Profile',   path: '/profile' },
];

interface TopNavProps {
  onOpenSearch?: () => void;
}

const TopNav = memo(function TopNav({ onOpenSearch }: TopNavProps) {
  const nav = useNavigate();
  const loc = useLocation();
  const { user, signOut, isLoading } = useAuth();
  const { scrollY } = useScrollDirection();

  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileRef     = useRef<HTMLDivElement>(null);
  const searchRef      = useRef<HTMLDivElement>(null);

  const isScrolled = scrollY > 50;
  useClickOutside(profileRef, useCallback(() => setProfileOpen(false), []), profileOpen);
  useClickOutside(searchRef,  useCallback(() => { setSearchOpen(false); setSearchQuery(''); }, []), searchOpen);

  // Close mobile menu on navigation
  useEffect(() => { setMenuOpen(false); }, [loc.pathname]);

  // Keyboard shortcuts
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

  // Lock body scroll when mobile menu open
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
    if (window.matchMedia('(max-width: 767px)').matches) {
      nav('/search');
      return;
    }
    if (onOpenSearch) {
      onOpenSearch();
    } else {
      setSearchOpen(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [onOpenSearch]);

  const isActive = (path: string) =>
    path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(path);

  return (
    <>
      {/* ── Main nav bar ──────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 inset-x-0 z-50 flex items-center h-16 px-4 md:px-6 transition-all duration-300"
        style={{
          background: isScrolled
            ? 'rgba(10, 10, 10, 0.88)'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)',
          backdropFilter: isScrolled ? 'blur(14px)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(14px)' : 'none',
          borderBottom: isScrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
          boxShadow: isScrolled ? '0 4px 24px rgba(0,0,0,0.4)' : 'none',
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
          <span className="text-white font-bold text-xl tracking-[-0.03em] leading-none select-none">
            all<span className="text-white/45">rated</span>
          </span>
        </button>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-0.5 mr-auto">
          {NAV_LINKS.map(link => {
            const active = isActive(link.path);
            return (
              <button
                key={link.path}
                type="button"
                onClick={() => nav(link.path)}
                aria-current={active ? 'page' : undefined}
                className={`
                  h-9 px-3.5 rounded-lg text-[13px] font-medium
                  transition-all duration-200 touch-manipulation
                  ${active
                    ? 'text-white bg-white/[0.09]'
                    : 'text-[#A3A3A3] hover:text-white hover:bg-white/[0.05]'
                  }
                `}
              >
                {link.label}
              </button>
            );
          })}
        </div>

        {/* Right side: search + profile */}
        <div className="ml-auto flex items-center gap-1.5">

          {/* Expandable search — desktop */}
          <div ref={searchRef} className="relative">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <div className="
                  flex items-center gap-2
                  h-9 px-3 rounded-full
                  bg-white/[0.08] border border-white/[0.14]
                  w-[200px] md:w-[280px]
                  transition-all duration-200
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
                    className="shrink-0 text-white/40 hover:text-white/80 transition-colors touch-manipulation"
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
                  transition-all duration-200 touch-manipulation
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
                      flex items-center gap-1.5
                      h-9 pl-1 pr-2.5 rounded-full
                      bg-white/[0.06] border border-white/[0.09]
                      hover:bg-white/[0.10] hover:border-white/[0.15]
                      transition-all duration-200
                    "
                    title={user.displayName || user.email || ''}
                  >
                    <Avatar
                      name={user.displayName}
                      email={user.email}
                      src={user.avatarUrl}
                      size={26}
                    />
                    <span className="text-[12px] font-medium text-white/80 max-w-[80px] truncate">
                      {user.displayName?.split(' ')[0] || 'Account'}
                    </span>
                    <ChevronDown
                      size={12}
                      className={`text-white/40 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {profileOpen && (
                    <div
                      className="
                        absolute right-0 top-[calc(100%+8px)] w-56 z-50
                        rounded-2xl border border-white/[0.08] overflow-hidden
                        animate-menu
                      "
                      style={{ background: '#141414', boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }}
                    >
                      {/* User info */}
                      <div className="px-4 py-3.5 border-b border-white/[0.06]">
                        <p className="text-[13px] font-semibold text-white truncate">
                          {user.displayName || 'User'}
                        </p>
                        <p className="text-[11px] text-[#737373] truncate mt-0.5">{user.email}</p>
                        {user.role === 'ADMIN' && (
                          <span className="mt-1.5 inline-flex items-center gap-1 text-[9px] text-white/50 bg-white/[0.06] border border-white/[0.10] rounded-full px-2 py-0.5 uppercase tracking-wide">
                            <Shield size={7} /> Admin
                          </span>
                        )}
                      </div>

                      {/* Menu items */}
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => { setProfileOpen(false); nav('/profile'); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-white/75 hover:bg-white/[0.04] hover:text-white transition-colors text-left"
                        >
                          <User size={13} className="text-white/40 shrink-0" />
                          Profile
                        </button>
                        {user.role === 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => { setProfileOpen(false); nav('/admin'); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-white/75 hover:bg-white/[0.04] hover:text-white transition-colors text-left"
                          >
                            <Shield size={13} className="text-white/40 shrink-0" />
                            Admin Panel
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => { setProfileOpen(false); nav('/history'); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-white/75 hover:bg-white/[0.04] hover:text-white transition-colors text-left"
                        >
                          <Clock size={13} className="text-white/40 shrink-0" />
                          Watch History
                        </button>
                        <button
                          type="button"
            onClick={() => { setProfileOpen(false); nav('/my-list'); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-white/75 hover:bg-white/[0.04] hover:text-white transition-colors text-left"
                        >
                          <Bookmark size={13} className="text-white/40 shrink-0" />
                          My List
                        </button>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#737373] hover:bg-white/[0.04] hover:text-white transition-colors text-left border-t border-white/[0.06] mt-1"
                        >
                          <LogOut size={13} className="shrink-0" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => nav('/login')}
                  className="
                    flex items-center gap-1.5
                    h-9 px-4 rounded-full
                    text-[13px] font-medium text-white/75
                    border border-white/[0.12] hover:border-white/[0.24] hover:text-white
                    transition-all duration-200
                  "
                >
                  <LogIn size={13} /> Sign in
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
            {menuOpen ? <X size={19} strokeWidth={1.8} /> : <Menu size={19} strokeWidth={1.8} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile full-screen menu overlay ────────────────────────────────── */}
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

          {/* Nav items — large 56px tap targets */}
          <nav className="flex-1 overflow-y-auto flex flex-col px-4 py-2 gap-0.5">
            {MOBILE_NAV.map(item => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => nav(item.path)}
                  aria-current={active ? 'page' : undefined}
                  className={`
                    flex items-center gap-4
                    min-h-[56px] px-4 rounded-2xl
                    text-[17px] font-medium
                    transition-colors duration-200 touch-manipulation
                    ${active
                      ? 'text-white bg-white/[0.07]'
                      : 'text-[#A3A3A3] hover:text-white hover:bg-white/[0.04]'
                    }
                  `}
                >
                  <item.icon size={21} strokeWidth={active ? 2.2 : 1.7} className="shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Profile section at bottom */}
          <div className="px-4 pb-8 pt-3 border-t border-white/[0.06]">
            {!isLoading && (
              user ? (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => nav('/profile')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/[0.04] transition-colors touch-manipulation"
                  >
                    <Avatar
                      name={user.displayName}
                      email={user.email}
                      src={user.avatarUrl}
                      size={40}
                      className="shrink-0"
                    />
                    <div className="text-left min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {user.displayName || 'User'}
                      </p>
                      <p className="text-xs text-[#737373] truncate">{user.email}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 h-12 px-4 rounded-2xl text-sm text-[#737373] hover:text-white hover:bg-white/[0.04] transition-colors touch-manipulation"
                  >
                    <LogOut size={16} className="shrink-0" />
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => nav('/login')}
                  className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-medium text-white bg-white/[0.08] border border-white/[0.12] hover:bg-white/[0.12] transition-colors touch-manipulation"
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
