import { useState, useEffect, useRef } from 'react';
import { Search, Shield, LogOut, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const placeholders = ['Search movies...', 'Search anime...', 'Search series...', 'Search reviews...'];

export default function Navbar() {
  const { user, signOut, isLoading } = useAuth();
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [phIdx, setPhIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

  useEffect(() => {
    const iv = setInterval(() => setPhIdx(i => (i + 1) % placeholders.length), 2400);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus(); }
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
    <nav className="sticky top-0 z-50 flex items-center gap-4 px-5 py-3 bg-void/95 backdrop-blur-md border-b border-line">
      {/* Logo — hex-frame mark */}
      <button
        onClick={() => nav('/')}
        className="w-[34px] h-[34px] rounded-md bg-surface border border-line-bright flex items-center justify-center font-mono font-bold text-[15px] text-maroon-bright shrink-0 hover:border-maroon-bright hover:shadow-cyan-sm transition-all"
        style={{ letterSpacing: '-0.02em' }}
      >
        AR
        <span className="absolute bottom-1 right-1 w-[4px] h-[4px] rounded-full bg-maroon-bright shadow-[0_0_6px_rgba(0,212,255,0.9)]" />
      </button>

      {/* Search */}
      <form onSubmit={submit} className="flex-1 max-w-[400px] relative">
        <div className={`flex items-center gap-2 bg-surface border rounded-md px-3.5 py-2 transition-all ${focused ? 'border-maroon-bright shadow-[0_0_0_2px_rgba(0,212,255,0.12)]' : 'border-line hover:border-line-bright'}`}>
          <Search size={13} className={focused ? 'text-maroon-bright' : 'text-ink-faint'} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="bg-transparent border-none outline-none text-ink text-[13px] flex-1 min-w-0 font-mono"
            aria-label="Search"
          />
          <span className="font-mono text-[10px] text-ink-faint border border-line rounded px-1.5 py-0.5 shrink-0 tracking-widest">⌘K</span>
        </div>
        {!focused && !query && (
          <span className="absolute left-[37px] top-1/2 -translate-y-1/2 text-[13px] text-ink-faint pointer-events-none font-mono">
            {placeholders[phIdx]}
          </span>
        )}
      </form>

      {/* Profile / Auth */}
      <div className="ml-auto relative" ref={menuRef}>
        {!isLoading && (
          user ? (
            <>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="w-[34px] h-[34px] rounded-md bg-surface border border-maroon-bright flex items-center justify-center font-mono font-bold text-[13px] text-maroon-bright shrink-0 hover:bg-maroon-bright hover:text-void transition-all shadow-cyan-sm"
                title={user.displayName || user.email}
              >
                {initial}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-surface border border-line rounded-lg shadow-2xl overflow-hidden z-50 animate-fadeUp">
                  <div className="px-3 py-2.5 border-b border-line grid-overlay">
                    <p className="text-xs font-semibold text-ink truncate">{user.displayName || 'User'}</p>
                    <p className="text-[10px] text-ink-dim truncate font-mono">{user.email}</p>
                    {user.role === 'ADMIN' && (
                      <span className="text-[9px] font-mono text-maroon-bright bg-maroon/30 border border-maroon-bright/30 rounded px-1.5 py-0.5 mt-1 inline-block tracking-widest">ADMIN</span>
                    )}
                  </div>
                  {user.role === 'ADMIN' && (
                    <button
                      onClick={() => { setMenuOpen(false); nav('/admin'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink hover:bg-surface-2 transition-colors text-left"
                    >
                      <Shield size={14} className="text-maroon-bright" /> Admin Panel
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink-dim hover:bg-surface-2 hover:text-ink transition-colors text-left border-t border-line"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => nav('/login')}
              className="flex items-center gap-1.5 text-[11px] font-mono text-ink-dim border border-line rounded-md px-3 py-2 hover:text-maroon-bright hover:border-maroon-bright transition-all tracking-wide"
            >
              <LogIn size={12} /> SIGN IN
            </button>
          )
        )}
      </div>
    </nav>
  );
}
