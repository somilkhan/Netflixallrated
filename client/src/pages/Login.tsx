import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { signIn } = useAuth();
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      nav('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-1 text-white tracking-tight">Welcome back</h1>
        <p className="text-sm text-white/40 mb-8">Sign in to your account</p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-white/[0.10] bg-white/[0.04] text-sm text-white/70">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            required
            className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-4 py-3 text-sm text-white focus:border-white/[0.28] focus:bg-white/[0.06] outline-none placeholder:text-white/25 transition-[border-color,background-color] duration-200"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            required
            className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-4 py-3 text-sm text-white focus:border-white/[0.28] focus:bg-white/[0.06] outline-none placeholder:text-white/25 transition-[border-color,background-color] duration-200"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        <p className="mt-5 text-center text-sm text-white/35">
          No account?{' '}
          <button
            type="button"
            onClick={() => nav('/register')}
            className="text-white/70 hover:text-white transition-colors"
          >
            Create one
          </button>
        </p>
      </form>
    </div>
  );
}
