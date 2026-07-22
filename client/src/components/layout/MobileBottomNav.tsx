/**
 * MobileBottomNav — fixed 64px bottom navigation bar, mobile only.
 * Home | Search | Downloads | Profile
 * Search tab triggers the global search overlay instead of navigating.
 */
import { memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Download, User } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenSearch?: () => void;
}

const MobileBottomNav = memo(function MobileBottomNav({ onOpenSearch }: MobileBottomNavProps) {
  const nav = useNavigate();
  const loc = useLocation();

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
    { icon: Download, label: 'Downloads', path: '/downloads', action: () => nav('/downloads') },
    { icon: User,     label: 'Profile',   path: '/profile',  action: () => nav('/profile') },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-[50] flex items-start"
      style={{
        height: 'calc(64px + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: '#0A0A0A',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}
      aria-label="Mobile navigation"
    >
      {NAV_ITEMS.map(({ icon: Icon, label, path, action }) => {
        const active = path === '/search'
          ? false  // search is an overlay — never "active" as a route
          : isActive(path);
        return (
          <button
            key={path}
            type="button"
            onClick={action}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
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
  );
});

export default MobileBottomNav;
