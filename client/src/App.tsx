import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { LazyMotion, domAnimation } from 'framer-motion';
import { AuthProvider } from './lib/auth';
import { PlayerProvider } from './lib/playerContext';
import TopNav from './components/layout/TopNav';
import BottomPlayer from './components/layout/BottomPlayer';
import MobileBottomNav from './components/layout/MobileBottomNav';
import SearchOverlay from './components/SearchOverlay';
import ErrorBoundary from './components/ErrorBoundary';
import GlassLoader from './components/GlassLoader';
import NotFound from './pages/NotFound';
import OfflinePage from './components/OfflinePage';
import { analytics } from './lib/analytics';
import { setPageMeta } from './lib/seo';

// Route-level code splitting — each page loads on demand
const Home            = lazy(() => import('./pages/Home'));
const TitleDetail     = lazy(() => import('./pages/TitleDetail'));
const SearchResults   = lazy(() => import('./pages/SearchResults'));
const Watchlist       = lazy(() => import('./pages/Watchlist'));
const MyList          = lazy(() => import('./pages/MyList'));
const Downloads       = lazy(() => import('./pages/Downloads'));
const Login           = lazy(() => import('./pages/Login'));
const Register        = lazy(() => import('./pages/Register'));
const Admin           = lazy(() => import('./pages/Admin'));
const TV              = lazy(() => import('./pages/TV'));
const Anime           = lazy(() => import('./pages/Anime'));
const AnimeGenres     = lazy(() => import('./pages/AnimeGenres'));
const AnimeSectionPage = lazy(() => import('./pages/AnimeSectionPage'));
const Categories      = lazy(() => import('./pages/Categories'));
const Browse          = lazy(() => import('./pages/Browse'));
const Profile         = lazy(() => import('./pages/Profile'));
const StudioDetail    = lazy(() => import('./pages/DiscoveryPages').then(m => ({ default: m.StudioDetail })));
const LanguageDetail  = lazy(() => import('./pages/DiscoveryPages').then(m => ({ default: m.LanguageDetail })));
const GenreDetail     = lazy(() => import('./pages/DiscoveryPages').then(m => ({ default: m.GenreDetail })));
const TypeDetail      = lazy(() => import('./pages/DiscoveryPages').then(m => ({ default: m.TypeDetail })));
const BrandShowcase   = lazy(() => import('./pages/BrandShowcase'));
const WatchHistory    = lazy(() => import('./pages/WatchHistory'));
const Sports          = lazy(() => import('./pages/Sports'));

function Wrap({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

function AnimatedRoutes() {
  const location = useLocation();
  useEffect(() => {
    analytics.pageView(`${location.pathname}${location.search}`);
    setPageMeta(location.pathname);
  }, [location.pathname, location.search]);
  return (
    <LazyMotion features={domAnimation} strict>
      <div key={location.pathname} className="page-enter">
        <Routes location={location}>
          <Route path="/"                    element={<Wrap><Home /></Wrap>} />
          <Route path="/title/:id"           element={<Wrap><TitleDetail /></Wrap>} />
          <Route path="/search"              element={<Wrap><SearchResults /></Wrap>} />
          <Route path="/watchlist"           element={<Wrap><Watchlist /></Wrap>} />
          <Route path="/my-list"             element={<Wrap><MyList /></Wrap>} />
          <Route path="/downloads"           element={<Wrap><Downloads /></Wrap>} />
          <Route path="/login"               element={<Wrap><Login /></Wrap>} />
          <Route path="/register"            element={<Wrap><Register /></Wrap>} />
          <Route path="/admin"               element={<Wrap><Admin /></Wrap>} />
          <Route path="/tv"                  element={<Wrap><TV /></Wrap>} />
          <Route path="/anime"               element={<Wrap><Anime /></Wrap>} />
          <Route path="/anime/genres"        element={<Wrap><AnimeGenres /></Wrap>} />
          <Route path="/anime/section"       element={<Wrap><AnimeSectionPage /></Wrap>} />
          <Route path="/categories"          element={<Wrap><Categories /></Wrap>} />
          <Route path="/browse"              element={<Wrap><Browse /></Wrap>} />
          <Route path="/profile"             element={<Wrap><Profile /></Wrap>} />
          <Route path="/studio/:slug"        element={<Wrap><StudioDetail /></Wrap>} />
          <Route path="/language/:slug"      element={<Wrap><LanguageDetail /></Wrap>} />
          <Route path="/browse/genre/:slug"  element={<Wrap><GenreDetail /></Wrap>} />
          <Route path="/browse/type/:slug"   element={<Wrap><TypeDetail /></Wrap>} />
          <Route path="/brand"               element={<Wrap><BrandShowcase /></Wrap>} />
          <Route path="/history"             element={<Wrap><WatchHistory /></Wrap>} />
          <Route path="/sports"              element={<Wrap><Sports /></Wrap>} />
           <Route path="/offline"             element={<Wrap><OfflinePage /></Wrap>} />
          <Route path="*"                    element={<Wrap><NotFound /></Wrap>} />
        </Routes>
      </div>
    </LazyMotion>
  );
}

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [installEvent, setInstallEvent] = useState<any>(null);
  const openSearch  = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // Global Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onInstallable = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('beforeinstallprompt', onInstallable);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('beforeinstallprompt', onInstallable);
    };
  }, []);

  return (
    <AuthProvider>
      <PlayerProvider>
        <div
          className="min-h-screen overflow-x-hidden max-w-full"
          style={{ background: '#0A0A0A', color: '#FFFFFF' }}
        >
           <TopNav onOpenSearch={openSearch} />
          <SearchOverlay open={searchOpen} onClose={closeSearch} />
           {!online && <OfflinePage />}
           {online && installEvent && (
             <div className="fixed bottom-20 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-3 rounded-xl border border-white/10 bg-[#171717] px-4 py-3 text-xs text-white shadow-2xl">
               <span>Install Allrated for a faster experience.</span>
               <button type="button" onClick={async () => { await installEvent.prompt(); setInstallEvent(null); }} className="rounded-lg bg-white px-3 py-1.5 font-semibold text-black">Install</button>
               <button type="button" onClick={() => setInstallEvent(null)} className="text-white/45">Not now</button>
             </div>
           )}

           <main aria-hidden={!online}>
            <Suspense fallback={<GlassLoader visible label="Loading…" />}>
              <AnimatedRoutes />
            </Suspense>
          </main>

          {/* Persistent bottom player — sits above mobile bottom nav */}
          <BottomPlayer />

          <MobileBottomNav />
        </div>
      </PlayerProvider>
    </AuthProvider>
  );
}
