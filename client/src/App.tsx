import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';
import GlassLoader from './components/GlassLoader';

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
const AnimeDetailPage = lazy(() => import('./pages/AnimeDetailPage'));
const Categories = lazy(() => import('./pages/Categories'));
const StudioDetail = lazy(() => import('./pages/DiscoveryPages').then(m => ({ default: m.StudioDetail })));
const LanguageDetail = lazy(() => import('./pages/DiscoveryPages').then(m => ({ default: m.LanguageDetail })));
const GenreDetail = lazy(() => import('./pages/DiscoveryPages').then(m => ({ default: m.GenreDetail })));
const TypeDetail = lazy(() => import('./pages/DiscoveryPages').then(m => ({ default: m.TypeDetail })));
const BrandShowcase = lazy(() => import('./pages/BrandShowcase'));

function Wrap({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-void text-ink pb-24 overflow-x-hidden max-w-full">
        <Navbar />
        <Suspense fallback={<GlassLoader visible label="Loading your experience…" />}>
          <Routes>
            <Route path="/" element={<Wrap><Home /></Wrap>} />
            <Route path="/title/:id" element={<Wrap><TitleDetail /></Wrap>} />
            <Route path="/search" element={<Wrap><SearchResults /></Wrap>} />
            <Route path="/watchlist" element={<Wrap><Watchlist /></Wrap>} />
            <Route path="/login" element={<Wrap><Login /></Wrap>} />
            <Route path="/register" element={<Wrap><Register /></Wrap>} />
            <Route path="/admin" element={<Wrap><Admin /></Wrap>} />
            <Route path="/tv" element={<Wrap><TV /></Wrap>} />
            <Route path="/anime" element={<Wrap><Anime /></Wrap>} />
            <Route path="/anime/view/:anilistId" element={<Wrap><AnimeDetailPage /></Wrap>} />
            <Route path="/anime/genres" element={<Wrap><AnimeGenres /></Wrap>} />
            <Route path="/categories" element={<Wrap><Categories /></Wrap>} />
            <Route path="/studio/:slug" element={<Wrap><StudioDetail /></Wrap>} />
            <Route path="/language/:slug" element={<Wrap><LanguageDetail /></Wrap>} />
            <Route path="/browse/genre/:slug" element={<Wrap><GenreDetail /></Wrap>} />
            <Route path="/browse/type/:slug" element={<Wrap><TypeDetail /></Wrap>} />
            <Route path="/brand" element={<Wrap><BrandShowcase /></Wrap>} />
          </Routes>
        </Suspense>
        <BottomNav />
      </div>
    </AuthProvider>
  );
}
