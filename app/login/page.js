'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      let email = identifier.trim().toLowerCase();
      if (!email.includes('@')) {
        const response = await fetch('/api/auth/resolve-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: identifier.trim() })
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Unable to find username.');
        email = body.email;
      }

      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      router.push('/');
      router.refresh();
    } catch (error) {
      setMessage(error.message || 'Incorrect email/username or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-shell form-page">
      <form className="form-card" onSubmit={submit}>
        <span className="eyebrow">Functional Requirements 3-4</span>
        <h1>Login</h1>
        <label>Email or Username<input required value={identifier} onChange={(e) => setIdentifier(e.target.value)} /></label>
        <label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {message && <p className="form-message">{message}</p>}
        <button className="button primary full" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        <p className="muted">Need an account? <Link href="/signup">Create one</Link>.</p>
      </form>
    </section>
  );
}
