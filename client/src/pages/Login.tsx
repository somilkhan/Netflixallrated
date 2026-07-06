import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-[10px] text-maroon-bright tracking-[0.2em] uppercase mb-2">ALLRATED · AUTH</p>
          <h1 className="font-sans text-3xl font-bold text-ink">Welcome back</h1>
          <p className="text-ink-dim text-sm mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-sm text-red-400 font-mono">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="font-mono text-[10px] text-ink-faint tracking-widest uppercase block mb-1.5">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-surface border border-line rounded-md px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-maroon-bright focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] outline-none transition-all font-mono"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] text-ink-faint tracking-widest uppercase block mb-1.5">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-surface border border-line rounded-md px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-maroon-bright focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] outline-none transition-all font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-maroon-bright text-void font-bold py-3 rounded-md hover:opacity-90 transition-all disabled:opacity-50 shadow-cyan-md tracking-wide text-sm mt-2"
        >
          {loading ? 'SIGNING IN…' : 'SIGN IN'}
        </button>

        <p className="text-center text-sm text-ink-dim pt-2">
          No account?{' '}
          <button type="button" onClick={() => nav('/register')} className="text-maroon-bright hover:underline font-semibold">
            Create one
          </button>
        </p>
      </form>
    </div>
  );
}
