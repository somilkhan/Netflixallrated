import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
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

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-void text-ink pb-24">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/title/:id" element={<TitleDetail />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/tv" element={<TV />} />
          <Route path="/anime" element={<Anime />} />
          <Route path="/categories" element={<Categories />} />
        </Routes>
        <BottomNav />
      </div>
    </AuthProvider>
  );
}
