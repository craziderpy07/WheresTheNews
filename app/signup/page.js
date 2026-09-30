'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setMessage('');

    if (form.username.trim().length < 3) {
      setMessage('Username must be at least 3 characters.');
      return;
    }
    if (form.password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: { data: { username: form.username.trim() } }
      });

      if (error) throw error;
      if (data.session) {
        router.push('/');
        router.refresh();
      } else {
        setMessage('Account created. Check your email if email confirmation is enabled in Supabase.');
      }
    } catch (error) {
      setMessage(error.message || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page page-shell">
      <div className="auth-panel">
        <div className="auth-heading">
          <span className="auth-icon">📍</span>
          <h1>Create Your Account</h1>
          <p>Save your scores, see your game history, and compete with players around the world.</p>
        </div>

        <form className="form-card prototype-card" onSubmit={submit}>
          <label>
            Email
            <input name="email" type="email" required value={form.email} onChange={update} placeholder="you@example.com" />
          </label>
          <label>
            Username
            <input name="username" required value={form.username} onChange={update} placeholder="Choose a username" />
          </label>
          <label>
            Password
            <input name="password" type="password" required value={form.password} onChange={update} placeholder="At least 6 characters" />
          </label>
          {message && <p className="form-message">{message}</p>}
          <button type="submit" className="button primary full" disabled={loading}>{loading ? 'Creating account...' : 'Create Account →'}</button>
          <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
        </form>

        <Link className="auth-guest-link" href="/play">Continue as guest →</Link>
      </div>
    </section>
  );
}
