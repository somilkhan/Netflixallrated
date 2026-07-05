import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { const res = await api.auth.register({ email, password, displayName }); login(res.token, res.user); nav('/'); }
    catch (err: any) { setError(err.message || 'Registration failed'); }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <h1 className="font-serif text-3xl font-semibold mb-6">Create account</h1>
        {error && <div className="p-3 bg-maroon/20 border border-maroon rounded-lg text-sm text-maroon-bright">{error}</div>}
        <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display name" className="w-full bg-surface border border-line rounded-lg px-4 py-3 text-sm focus:border-maroon outline-none" />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full bg-surface border border-line rounded-lg px-4 py-3 text-sm focus:border-maroon outline-none" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 6)" required minLength={6} className="w-full bg-surface border border-line rounded-lg px-4 py-3 text-sm focus:border-maroon outline-none" />
        <button type="submit" className="w-full bg-ink text-void font-semibold py-3 rounded-lg hover:bg-ink-dim transition-colors">Create Account</button>
        <p className="text-center text-sm text-ink-dim">Already have one? <button type="button" onClick={() => nav('/login')} className="text-maroon-bright hover:underline">Sign in</button></p>
      </form>
    </div>
  );
}
