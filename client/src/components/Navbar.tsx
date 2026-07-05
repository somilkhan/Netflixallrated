import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const placeholders = ['Search movies...', 'Search anime...', 'Search series...', 'Search reviews...'];

export default function Navbar() {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [phIdx, setPhIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  useEffect(() => { const iv = setInterval(() => setPhIdx(i => (i + 1) % placeholders.length), 2400); return () => clearInterval(iv); }, []);
  useEffect(() => { const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus(); } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, []);
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (query.trim()) nav(`/search?q=${encodeURIComponent(query.trim())}`); };

  return (
    <nav className="sticky top-0 z-50 flex items-center gap-4 px-5 py-3.5 bg-void/90 backdrop-blur-md border-b border-line">
      <div className="w-[34px] h-[34px] rounded-[9px] bg-gradient-to-br from-surface-2 to-surface border border-line-bright flex items-center justify-center font-serif font-bold text-[17px] text-ink relative shrink-0">
        A
        <span className="absolute bottom-1 right-1 w-[5px] h-[5px] rounded-full bg-maroon-bright shadow-[0_0_6px_rgba(194,67,79,0.8)]" />
      </div>
      <form onSubmit={submit} className="flex-1 max-w-[400px] relative">
        <div className={`flex items-center gap-2 bg-surface border rounded-full px-3.5 py-2 transition-all ${focused ? 'border-maroon shadow-[0_0_0_3px_rgba(122,37,48,0.18)] bg-surface-2' : 'border-line hover:border-line-bright'}`}>
          <Search size={14} className={focused ? 'text-maroon-bright' : 'text-ink-faint'} />
          <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} className="bg-transparent border-none outline-none text-ink text-[13px] flex-1 min-w-0" aria-label="Search" />
          <span className="font-mono text-[10.5px] text-ink-faint border border-line rounded px-1.5 py-0.5 shrink-0">⌘K</span>
        </div>
        {!focused && !query && <span className="absolute left-[37px] top-1/2 -translate-y-1/2 text-[13px] text-ink-faint pointer-events-none transition-opacity duration-300">{placeholders[phIdx]}</span>}
      </form>
      <div className="w-[30px] h-[30px] rounded-[7px] bg-gradient-to-br from-line-bright to-surface-2 border border-line ml-auto shrink-0" />
    </nav>
  );
}
