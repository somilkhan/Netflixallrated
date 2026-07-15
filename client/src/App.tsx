import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { AuthProvider } from './lib/auth';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import SideRail from './components/SideRail';
import SearchOverlay from './components/SearchOverlay';
import ErrorBoundary from './components/ErrorBoundary';
import GlassLoader from './components/GlassLoader';
import NotFound from './pages/NotFound';

// Route-level code splitting — each page loads on demand, with the shared
// GlassLoader shown via Suspense while its chunk downloads.
const Home = lazy(() => import('./pages/Home'));
const TitleDetail = lazy(() => import('./pages/TitleDetail'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Admin = lazy(() => import('./pages/Admin'));
const TV = lazy(() => import('./pages/TV'));
const Anime = lazy(() => import('./pages/Anime'));
const AnimeGenres = lazy(() => import('./pages/AnimeGenres'));
const AnimeSectionPage = lazy(() => import('./pages/AnimeSectionPage'));
const Categories = lazy(() => import('./pages/Categories'));
const StudioDetail = lazy(() => import('./pages/DiscoveryPages').then(m => ({ default: m.StudioDetail })));
const LanguageDetail = lazy(() => import('./pages/DiscoveryPages').then(m => ({ default: m.LanguageDetail })));
const GenreDetail = lazy(() => import('./pages/DiscoveryPages').then(m => ({ default: m.GenreDetail })));
const TypeDetail = lazy(() => import('./pages/DiscoveryPages').then(m => ({ default: m.TypeDetail })));
const BrandShowcase = lazy(() => import('./pages/BrandShowcase'));
const WatchHistory = lazy(() => import('./pages/WatchHistory'));

function Wrap({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
          <Routes location={location}>
            <Route path="/" element={<Wrap><Home /></Wrap>} />
            <Route path="/title/:id" element={<Wrap><TitleDetail /></Wrap>} />
            <Route path="/search" element={<Wrap><SearchResults /></Wrap>} />
            <Route path="/watchlist" element={<Wrap><Watchlist /></Wrap>} />
            <Route path="/login" element={<Wrap><Login /></Wrap>} />
            <Route path="/register" element={<Wrap><Register /></Wrap>} />
            <Route path="/admin" element={<Wrap><Admin /></Wrap>} />
            <Route path="/tv" element={<Wrap><TV /></Wrap>} />
            <Route path="/anime" element={<Wrap><Anime /></Wrap>} />
            <Route path="/anime/genres" element={<Wrap><AnimeGenres /></Wrap>} />
            <Route path="/anime/section" element={<Wrap><AnimeSectionPage /></Wrap>} />
            <Route path="/categories" element={<Wrap><Categories /></Wrap>} />
            <Route path="/studio/:slug" element={<Wrap><StudioDetail /></Wrap>} />
            <Route path="/language/:slug" element={<Wrap><LanguageDetail /></Wrap>} />
            <Route path="/browse/genre/:slug" element={<Wrap><GenreDetail /></Wrap>} />
            <Route path="/browse/type/:slug" element={<Wrap><TypeDetail /></Wrap>} />
            <Route path="/brand" element={<Wrap><BrandShowcase /></Wrap>} />
            <Route path="/history" element={<Wrap><WatchHistory /></Wrap>} />
            <Route path="*" element={<Wrap><NotFound /></Wrap>} />
          </Routes>
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  );
}

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // Global ⌘K / Ctrl+K opens the search overlay from anywhere in the app.
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

  return (
    <AuthProvider>
      <div className="min-h-screen bg-void text-ink pb-24 overflow-x-hidden max-w-full">
        <SideRail onOpenSearch={openSearch} />
        <Navbar onOpenSearch={openSearch} />
        <SearchOverlay open={searchOpen} onClose={closeSearch} />
        <div className="rail-offset">
          <Suspense fallback={<GlassLoader visible label="Loading your experience…" />}>
            <AnimatedRoutes />
          </Suspense>
        </div>
        <BottomNav />
      </div>
    </AuthProvider>
  );
}
