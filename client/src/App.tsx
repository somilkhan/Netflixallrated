import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import TitleDetail from './pages/TitleDetail';
import SearchResults from './pages/SearchResults';
import Watchlist from './pages/Watchlist';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import TV from './pages/TV';
import Anime from './pages/Anime';
import Categories from './pages/Categories';
import { StudioDetail, LanguageDetail, GenreDetail, TypeDetail } from './pages/DiscoveryPages';

function Wrap({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-void text-ink pb-24 overflow-x-hidden max-w-full">
        <Navbar />
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
          <Route path="/categories" element={<Wrap><Categories /></Wrap>} />
          <Route path="/studio/:slug" element={<Wrap><StudioDetail /></Wrap>} />
          <Route path="/language/:slug" element={<Wrap><LanguageDetail /></Wrap>} />
          <Route path="/browse/genre/:slug" element={<Wrap><GenreDetail /></Wrap>} />
          <Route path="/browse/type/:slug" element={<Wrap><TypeDetail /></Wrap>} />
        </Routes>
        <BottomNav />
      </div>
    </AuthProvider>
  );
}
