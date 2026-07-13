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
          <h1 className="font-sans text-3xl font-bold text-white">Check your email</h1>
          <p className="text-[#888] text-sm">
            We sent a confirmation link to <strong className="text-white">{email}</strong>.
            Click it to activate your account, then come back and sign in.
          </p>
          <button
            onClick={() => nav('/login')}
            className="text-white hover:underline text-sm"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <h1 className="font-sans text-3xl font-bold mb-6 text-white">Create account</h1>
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-xl text-sm text-red-400">
            {error}
          </div>
        )}
        <input
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="Display name"
          autoComplete="name"
          className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white focus:border-white/40 outline-none placeholder:text-[#555]"
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          required
          className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white focus:border-white/40 outline-none placeholder:text-[#555]"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password (min 6 characters)"
          autoComplete="new-password"
          required
          minLength={6}
          className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white focus:border-white/40 outline-none placeholder:text-[#555]"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
        <p className="text-center text-sm text-[#888]">
          Already have one?{' '}
          <button type="button" onClick={() => nav('/login')} className="text-white hover:underline">
            Sign in
          </button>
        </p>
      </form>
    </div>
  );
}
