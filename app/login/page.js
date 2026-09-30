'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

function GlobeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });
      if (error) throw error;

      router.push('/');
      router.refresh();
    } catch (error) {
      setMessage(error.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page page-shell">
      <div className="auth-panel prototype-card auth-card-prototype">
        <div className="auth-heading">
          <span className="auth-icon auth-svg-icon"><GlobeIcon /></span>
          <h1>Welcome back</h1>
          <p>Sign in to save scores and track your history</p>
        </div>

        {message && <div className="auth-error">{message}</div>}

        <form className="form-card auth-form-clean" onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          <button className="button primary full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-demo-note">
          Use your Supabase account credentials to sign in.
        </div>

        <div className="auth-divider"><span>or</span></div>
        <p className="auth-switch">New to Where&apos;s the News? <Link href="/signup">Create an account</Link></p>
        <Link className="auth-guest-link" href="/play">Continue as guest →</Link>
      </div>
    </section>
  );
}
