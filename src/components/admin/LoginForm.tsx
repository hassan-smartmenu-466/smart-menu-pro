'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        setError('Invalid username or password');
        setBusy(false);
      }
    } catch {
      setError('Connection error, try again');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4">
      <div>
        <label className="label" htmlFor="u">Username</label>
        <input id="u" className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
      </div>
      <div>
        <label className="label" htmlFor="p">Password</label>
        <input id="p" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </div>
      {error && <p className="text-sm text-ember-400">{error}</p>}
      <button className="btn-gold w-full" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
    </form>
  );
}
