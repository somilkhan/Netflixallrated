/**
 * RegionSwitcher — compact flag + country-code button with searchable dropdown.
 * Persists selection to localStorage (via geo.ts) and optionally syncs to
 * the backend (PATCH /api/auth/me) when the user is logged in.
 * On change it reloads the page so Home.tsx re-fetches with the new region.
 */
import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import {
  ALL_REGIONS,
  countryCodeToFlag,
  getCachedRegion,
  setRegion,
  DEFAULT_REGION,
  type RegionInfo,
} from '../lib/geo';

// ── Helpers ───────────────────────────────────────────────────────────────

/** Read the active region synchronously from cache; fall back to default. */
function getActiveRegion(): RegionInfo {
  return getCachedRegion() ?? DEFAULT_REGION;
}

// ── Component ─────────────────────────────────────────────────────────────

const RegionSwitcher = memo(function RegionSwitcher() {
  const { user, token } = useAuth();
  const [current, setCurrent] = useState<RegionInfo>(getActiveRegion);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef    = useRef<HTMLInputElement>(null);

  useClickOutside(containerRef, useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []), open);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 60);
  }, [open]);

  const filtered = query.trim()
    ? ALL_REGIONS.filter(r =>
        r.countryName.toLowerCase().includes(query.toLowerCase()) ||
        r.countryCode.toLowerCase().includes(query.toLowerCase()),
      )
    : ALL_REGIONS;

  const handleSelect = useCallback(async (region: RegionInfo) => {
    if (saving) return;
    setOpen(false);
    setQuery('');
    setSaving(true);

    // Persist locally
    setRegion(region);
    setCurrent(region);

    // Sync to backend if logged in
    if (user && token) {
      try {
        await api.auth.updateMe({ region: region.countryCode, language: region.language });
      } catch {
        // Non-fatal — local pref is still saved
      }
    }

    // Reload so Home.tsx re-fetches region-specific content
    window.location.reload();
  }, [saving, user, token]);

  const flag = countryCodeToFlag(current.countryCode);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-label={`Current region: ${current.countryName}. Click to change.`}
        aria-expanded={open}
        className="
          flex items-center gap-1.5 h-9 px-2.5 rounded-lg
          text-[13px] font-medium text-[#A3A3A3] hover:text-white
          hover:bg-white/[0.06] transition-all duration-200
          touch-manipulation select-none
        "
      >
        <span className="text-base leading-none" aria-hidden="true">{flag}</span>
        <span className="hidden sm:inline tracking-wide">{current.countryCode}</span>
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute top-full right-0 mt-2 z-[200]
            w-64 rounded-xl overflow-hidden
            bg-[#141414] border border-white/[0.09]
            shadow-[0_8px_32px_rgba(0,0,0,0.6)]
          "
          role="dialog"
          aria-label="Select region"
        >
          {/* Search */}
          <div className="p-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 h-8 px-2.5 rounded-lg bg-white/[0.06]">
              <Search size={12} className="shrink-0 text-white/40" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search country…"
                className="
                  flex-1 min-w-0 bg-transparent border-none outline-none
                  text-[12px] text-white placeholder:text-white/30
                "
              />
            </div>
          </div>

          {/* Region list */}
          <ul
            className="max-h-64 overflow-y-auto py-1 scrollbar-hide"
            role="listbox"
            aria-label="Regions"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-[12px] text-[#737373] text-center">
                No results
              </li>
            ) : (
              filtered.map(region => {
                const isActive = region.countryCode === current.countryCode;
                return (
                  <li key={region.countryCode} role="option" aria-selected={isActive}>
                    <button
                      type="button"
                      onClick={() => handleSelect(region)}
                      className={`
                        w-full flex items-center gap-2.5 px-3 py-2
                        text-left text-[13px] transition-colors duration-150
                        ${isActive
                          ? 'text-white bg-white/[0.06]'
                          : 'text-[#A3A3A3] hover:text-white hover:bg-white/[0.04]'
                        }
                      `}
                    >
                      <span className="text-base leading-none w-6 shrink-0">
                        {countryCodeToFlag(region.countryCode)}
                      </span>
                      <span className="flex-1 truncate">{region.countryName}</span>
                      <span className="text-[11px] text-[#737373] shrink-0">
                        {region.countryCode}
                      </span>
                      {isActive && (
                        <Check size={12} className="shrink-0 text-white/60" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
});

export default RegionSwitcher;
