/**
 * Navbar — mobile top bar. Solid background (no backdrop-blur on mobile).
 */
import { useState, useEffect, useRef, memo } from 'react';
import { Search, Shield, LogOut, LogIn, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { NavbarLogo } from '../brand';

const placeholders = ['Movies, shows, anime…', 'Search the catalog…', 'Find something to watch…'];

const Navbar = memo(function Navbar({ onOpenSearch }: { onOpenSearch?: () => void }) {
  const { user, signOut, isLoading } = useAuth();
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [phIdx, setPhIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  void onOpenSearch;

  useEffect(() => {
    const iv = setInterval(() => setPhIdx(i => (i + 1) % placeholders.length), 3000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) nav(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    nav('/');
  };

  const initial = user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  return (
    <nav
      className="md:hidden sticky top-0 z-50 flex items-center gap-3 px-4 py-2.5"
      style={{
        /* Solid bg — no backdrop-blur avoids GPU compositing on mobile */
        background: '#0f1014',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <button
        onClick={() => nav('/')}
        className="shrink-0 rounded-[9px] active:opacity-60 transition-opacity"
        aria-label="Allrated home"
      >
        <NavbarLogo size={32} />
      </button>

      {/* Search */}
      <form onSubmit={submit} className="flex-1 max-w-[380px] relative">
        <div className={`
          flex items-center gap-2 border rounded-full px-3.5 py-2
          transition-[background-color,border-color] duration-150
          ${focused
            ? 'bg-white/[0.07] border-white/[0.20]'
            : 'bg-white/[0.04] border-white/[0.08]'
          }
        `}>
          <Search
            size={13}
            className={`shrink-0 transition-colors duration-150 ${focused ? 'text-white/65' : 'text-white/30'}`}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="bg-transparent border-none outline-none text-ink text-[13px] flex-1 min-w-0 font-sans"
            aria-label="Search"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="shrink-0 text-white/35 transition-colors duration-150"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          ) : (
            <span className="font-mono text-[9px] text-white/22 border border-white/[0.08] rounded px-1.5 py-0.5 shrink-0 hidden sm:inline tracking-wide">
              ⌘K
            </span>
          )}
        </div>
        {!focused && !query && (
          <span className="absolute left-[36px] top-1/2 -translate-y-1/2 text-[13px] text-white/28 pointer-events-none select-none">
            {placeholders[phIdx]}
          </span>
        )}
      </form>

      {/* Profile / Auth */}
      <div className="ml-auto relative shrink-0" ref={menuRef}>
        {!isLoading && (
          user ? (
            <>
              <button
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Account menu"
                aria-expanded={menuOpen}
                className="
                  w-[32px] h-[32px] rounded-full
                  bg-white/[0.08] border border-white/[0.14]
                  flex items-center justify-center
                  font-sans font-semibold text-[13px] text-white shrink-0
                  active:opacity-75 transition-opacity
                "
                title={user.displayName || user.email}
              >
                {initial}
              </button>

              {menuOpen && (
                <div className="
                  absolute right-0 top-[calc(100%+8px)] w-48
                  bg-[#18191d] border border-white/[0.08] rounded-2xl
                  shadow-overlay overflow-hidden z-50
                  animate-fadeUp
                ">
                  <div className="px-3.5 py-3 border-b border-white/[0.07]">
                    <p className="font-sans text-[12.5px] font-semibold text-white truncate">
                      {user.displayName || 'User'}
                    </p>
                    <p className="font-mono text-[10px] text-white/35 truncate">{user.email}</p>
                    {user.role === 'ADMIN' && (
                      <span className="
                        mt-1.5 inline-block
                        font-mono text-[8.5px] text-white/60
                        bg-white/[0.08] border border-white/[0.14]
                        rounded px-1.5 py-0.5 uppercase tracking-wide
                      ">
                        ADMIN
                      </span>
                    )}
                  </div>
                  {user.role === 'ADMIN' && (
                    <button
                      onClick={() => { setMenuOpen(false); nav('/admin'); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 font-sans text-[13px] text-white active:bg-white/[0.05] text-left"
                    >
                      <Shield size={13} className="text-white/50" /> Admin Panel
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 font-sans text-[13px] text-white/50 active:bg-white/[0.05] text-left border-t border-white/[0.07]"
                  >
                    <LogOut size={13} /> Sign out
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => nav('/login')}
              className="
                flex items-center gap-1.5
                font-sans text-[12px] text-white/45
                border border-white/[0.10] rounded-full px-3.5 py-1.5
                active:opacity-70 transition-opacity
              "
            >
              <LogIn size={12} /> Sign in
            </button>
          )
        )}
      </div>
    </nav>
  );
});

export default Navbar;
