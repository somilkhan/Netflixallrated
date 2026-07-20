import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);
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
          <div className="w-12 h-12 rounded-full border border-white/[0.15] bg-white/[0.05] flex items-center justify-center mx-auto mb-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Check your email</h1>
          <p className="text-white/40 text-sm leading-relaxed">
            We sent a confirmation link to{' '}
            <strong className="text-white/70">{email}</strong>.{' '}
            Click it to activate your account, then come back and sign in.
          </p>
          <button
            onClick={() => nav('/login')}
            className="text-white/50 hover:text-white text-sm transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-1 text-white tracking-tight">Create account</h1>
        <p className="text-sm text-white/40 mb-8">Join to rate and track what you watch</p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-white/[0.10] bg-white/[0.04] text-sm text-white/70">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Display name"
            autoComplete="name"
            className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-4 py-3 text-sm text-white focus:border-white/[0.28] focus:bg-white/[0.06] outline-none placeholder:text-white/25 transition-[border-color,background-color] duration-200"
          />
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
            placeholder="Password (min 6 characters)"
            autoComplete="new-password"
            required
            minLength={6}
            className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-4 py-3 text-sm text-white focus:border-white/[0.28] focus:bg-white/[0.06] outline-none placeholder:text-white/25 transition-[border-color,background-color] duration-200"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>

        <p className="mt-5 text-center text-sm text-white/35">
          Already have one?{' '}
          <button
            type="button"
            onClick={() => nav('/login')}
            className="text-white/70 hover:text-white transition-colors"
          >
            Sign in
          </button>
        </p>
      </form>
    </div>
  );
}
