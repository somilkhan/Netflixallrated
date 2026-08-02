/**
 * MobileBottomNav — fixed 64px bottom navigation bar, mobile only.
 * Home | Search | My List | More
 * Search navigates to the dedicated TMDB-powered search page; secondary
 * destinations remain available from the More tray.
 */
import { memo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Bookmark, MoreHorizontal, Film, Tv, Download, User, X } from 'lucide-react';

const MobileBottomNav = memo(function MobileBottomNav() {
  const nav = useNavigate();
  const loc = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path: string) =>
    path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(path);

  const NAV_ITEMS = [
    { icon: Home,     label: 'Home',      path: '/',         action: () => nav('/') },
    {
      icon: Search,
      label: 'Search',
      path: '/search',
      // Use the dedicated page on mobile so the tap never gets swallowed by
      // an overlay or immediately focuses an input underneath the nav.
      action: () => nav('/search'),
    },
    { icon: Bookmark, label: 'My List',   path: '/my-list',   action: () => nav('/my-list') },
    { icon: MoreHorizontal, label: 'More', path: '/more', action: () => setMoreOpen(open => !open) },
  ];

  return (
    <>
      {moreOpen && (
        <div
          className="md:hidden fixed inset-x-3 bottom-[calc(72px+env(safe-area-inset-bottom))] z-[51] rounded-[12px] border border-white/[0.10] bg-[#151515] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.65)]"
          role="dialog"
          aria-label="More navigation"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">More</span>
            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              aria-label="Close more navigation"
              className="rounded-full p-1 text-white/45 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
          {[
            { icon: Film, label: 'Browse', path: '/browse' },
            { icon: Tv, label: 'TV Shows', path: '/tv' },
            { icon: Film, label: 'Anime', path: '/anime' },
            { icon: Download, label: 'Downloads', path: '/downloads' },
            { icon: User, label: 'Profile', path: '/profile' },
          ].map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              type="button"
              onClick={() => { setMoreOpen(false); nav(path); }}
              className="flex w-full items-center gap-3 rounded-[8px] px-3 py-3 text-left text-[14px] text-white/75 hover:bg-white/[0.06] hover:text-white"
            >
              <Icon size={17} className="text-white/45" />
              {label}
            </button>
          ))}
        </div>
      )}

      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-[50] flex items-start"
        style={{
          height: 'calc(64px + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: '#000000',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
        aria-label="Mobile navigation"
      >
        {NAV_ITEMS.map(({ icon: Icon, label, path, action }) => {
          const active = label === 'More' ? moreOpen : isActive(path);
          return (
            <button
              key={path}
              type="button"
              onClick={action}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              aria-expanded={label === 'More' ? moreOpen : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-1 touch-manipulation"
              style={{
                minHeight: 56,
                color: active ? '#FFFFFF' : '#666666',
                transition: 'color 0.2s ease',
              }}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.2 : 1.7}
                style={{ display: 'block' }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: active ? 600 : 400,
                  lineHeight: 1,
                  letterSpacing: '0.01em',
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
});

export default MobileBottomNav;
