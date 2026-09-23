'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: '',
    username: '',
    password: ''
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  function update(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
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
        options: {
          data: {
            username: form.username.trim()
          }
        }
      });

      if (error) {
        throw error;
      }

      console.log('Signup result:', data);

      if (data.session) {
        router.push('/');
        router.refresh();
      } else {
        setMessage(
          'Account created. Check your email if email confirmation is enabled in Supabase.'
        );
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-shell form-page">
      <form className="form-card" onSubmit={submit}>
        <span className="eyebrow">Functional Requirement 2</span>

        <h1>Create Account</h1>

        <label>
          Email
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={update}
          />
        </label>

        <label>
          Username
          <input
            name="username"
            required
            value={form.username}
            onChange={update}
          />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            required
            value={form.password}
            onChange={update}
          />
        </label>

        {message && <p className="form-message">{message}</p>}

        <button
          type="submit"
          className="button primary full"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Account'}
        </button>

        <p className="muted">
          Already registered? <Link href="/login">Log in</Link>.
        </p>
      </form>
    </section>
  );
}