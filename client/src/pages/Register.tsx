import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signUp(email, password, displayName);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-5">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full border border-maroon-bright flex items-center justify-center mx-auto mb-4 shadow-cyan-md">
            <span className="text-maroon-bright text-xl">✓</span>
          </div>
          <h1 className="font-sans text-2xl font-bold text-ink">Check your email</h1>
          <p className="text-ink-dim text-sm">
            Confirmation link sent to <strong className="text-ink font-mono">{email}</strong>.
            Click it to activate your account.
          </p>
          <button
            onClick={() => nav('/login')}
            className="text-maroon-bright hover:underline text-sm font-mono tracking-wide"
          >
            ← BACK TO SIGN IN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-[10px] text-maroon-bright tracking-[0.2em] uppercase mb-2">ALLRATED · AUTH</p>
          <h1 className="font-sans text-3xl font-bold text-ink">Create account</h1>
          <p className="text-ink-dim text-sm mt-1">Join the community</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-sm text-red-400 font-mono">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="font-mono text-[10px] text-ink-faint tracking-widest uppercase block mb-1.5">DISPLAY NAME</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-surface border border-line rounded-md px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-maroon-bright focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] outline-none transition-all"
            />
          </div>
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
              placeholder="Min. 6 characters"
              required
              minLength={6}
              className="w-full bg-surface border border-line rounded-md px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-maroon-bright focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] outline-none transition-all font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-maroon-bright text-void font-bold py-3 rounded-md hover:opacity-90 transition-all disabled:opacity-50 shadow-cyan-md tracking-wide text-sm mt-2"
        >
          {loading ? 'CREATING…' : 'CREATE ACCOUNT'}
        </button>

        <p className="text-center text-sm text-ink-dim pt-2">
          Already have one?{' '}
          <button type="button" onClick={() => nav('/login')} className="text-maroon-bright hover:underline font-semibold">
            Sign in
          </button>
        </p>
      </form>
    </div>
  );
}
