import { useState, useEffect, useRef, memo } from 'react';
import { Search, Shield, LogOut, LogIn, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { NavbarLogo } from '../brand';

const placeholders = ['Movies, shows, anime…', 'Search the catalog…', 'Find something to watch…'];

const Navbar = memo(function Navbar() {
  const { user, signOut, isLoading } = useAuth();
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [phIdx, setPhIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

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
    <nav className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3 bg-void/88 backdrop-blur-xl border-b border-line/60">
      {/* Logo */}
      <button
        onClick={() => nav('/')}
        className="shrink-0 rounded-[9px] transition-opacity hover:opacity-80"
        aria-label="NetflixAllrated home"
      >
        <NavbarLogo size={32} />
      </button>

      {/* Search */}
      <form onSubmit={submit} className="flex-1 max-w-[380px] relative">
        <div className={`
          flex items-center gap-2 border rounded-full px-3.5 py-2
          transition-all duration-200
          ${focused
            ? 'bg-surface-2 border-maroon/60 shadow-[0_0_0_3px_rgba(122,37,48,0.12)]'
            : 'bg-surface/80 border-line hover:border-line-bright'
          }
        `}>
          <Search
            size={13}
            className={`shrink-0 transition-colors ${focused ? 'text-maroon-bright' : 'text-ink-faint'}`}
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
              className="shrink-0 text-ink-faint hover:text-ink transition-colors"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          ) : (
            <span className="font-mono text-[9.5px] text-ink-faint/60 border border-line/60 rounded px-1.5 py-0.5 shrink-0 hidden sm:inline">
              ⌘K
            </span>
          )}
        </div>
        {!focused && !query && (
          <span className="absolute left-[36px] top-1/2 -translate-y-1/2 text-[13px] text-ink-faint pointer-events-none select-none">
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
                  bg-gradient-to-br from-maroon to-maroon-bright
                  border border-maroon-bright/50
                  flex items-center justify-center
                  font-sans font-bold text-[13px] text-white shrink-0
                  hover:opacity-85 transition-opacity
                "
                title={user.displayName || user.email}
              >
                {initial}
              </button>

              {menuOpen && (
                <div className="
                  absolute right-0 top-[calc(100%+8px)] w-48
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
                      <span className="
                        mt-1.5 inline-block
                        font-mono text-[8.5px] text-maroon-bright
                        bg-maroon/20 border border-maroon/30
                        rounded px-1.5 py-0.5
                      ">
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
              className="
                flex items-center gap-1.5
                font-sans text-[12px] text-ink-dim
                border border-line rounded-full px-3.5 py-1.5
                hover:text-ink hover:border-line-bright transition-colors duration-150
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
