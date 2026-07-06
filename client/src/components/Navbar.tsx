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

  // Close dropdown when clicking outside
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
    <nav className="sticky top-0 z-50 flex items-center gap-4 px-5 py-3.5 bg-void/90 backdrop-blur-md border-b border-line">
      {/* Logo */}
      <button onClick={() => nav('/')} className="w-[34px] h-[34px] rounded-[9px] bg-gradient-to-br from-surface-2 to-surface border border-line-bright flex items-center justify-center font-serif font-bold text-[17px] text-ink relative shrink-0 hover:border-maroon transition-colors">
        A
        <span className="absolute bottom-1 right-1 w-[5px] h-[5px] rounded-full bg-maroon-bright shadow-[0_0_6px_rgba(194,67,79,0.8)]" />
      </button>

      {/* Search */}
      <form onSubmit={submit} className="flex-1 max-w-[400px] relative">
        <div className={`flex items-center gap-2 bg-surface border rounded-full px-3.5 py-2 transition-all ${focused ? 'border-maroon shadow-[0_0_0_3px_rgba(122,37,48,0.18)] bg-surface-2' : 'border-line hover:border-line-bright'}`}>
          <Search size={14} className={focused ? 'text-maroon-bright' : 'text-ink-faint'} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="bg-transparent border-none outline-none text-ink text-[13px] flex-1 min-w-0"
            aria-label="Search"
          />
          <span className="font-mono text-[10.5px] text-ink-faint border border-line rounded px-1.5 py-0.5 shrink-0">⌘K</span>
        </div>
        {!focused && !query && (
          <span className="absolute left-[37px] top-1/2 -translate-y-1/2 text-[13px] text-ink-faint pointer-events-none">
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
                className="w-[34px] h-[34px] rounded-[9px] bg-gradient-to-br from-maroon to-maroon-bright border border-maroon-bright flex items-center justify-center font-bold text-[14px] text-white shrink-0 hover:opacity-90 transition-opacity"
                title={user.displayName || user.email}
              >
                {initial}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-48 bg-surface border border-line rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeUp">
                  <div className="px-3 py-2.5 border-b border-line">
                    <p className="text-xs font-semibold text-ink truncate">{user.displayName || 'User'}</p>
                    <p className="text-[10px] text-ink-faint truncate">{user.email}</p>
                    {user.role === 'ADMIN' && (
                      <span className="text-[9px] font-mono text-maroon-bright bg-maroon/20 border border-maroon/30 rounded px-1.5 py-0.5 mt-1 inline-block">ADMIN</span>
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
              className="flex items-center gap-1.5 text-xs font-mono text-ink-dim border border-line rounded-lg px-3 py-2 hover:text-ink hover:border-line-bright transition-colors"
            >
              <LogIn size={13} /> Sign in
            </button>
          )
        )}
      </div>
    </nav>
  );
}
