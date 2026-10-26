'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';

export default function NavBar() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let subscription;
    try {
      const supabase = getSupabaseBrowserClient();
      supabase.auth.getUser().then(({ data }) => {
        setUser(data.user ?? null);
        setReady(true);
      });
      const result = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      subscription = result.data.subscription;
    } catch {
      setReady(true);
    }
    return () => subscription?.unsubscribe();
  }, []);

  async function logout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <header className="nav-wrap">
      <nav className="nav page-shell" aria-label="Main navigation">
        <Link href="/" className="brand">
          <span className="brand-icon" aria-hidden="true">▤</span>
          <span>WHERE&apos;S THE NEWS?</span>
        </Link>
        <div className="nav-links">
          <Link href="/play">PLAY</Link>
          {ready && user && <Link href="/history">HISTORY</Link>}
          {ready && user ? (
            <>
              <span className="signed-in">● ONLINE</span>
              <button type="button" className="link-button" onClick={logout}>LOG OUT</button>
            </>
          ) : (
            <>
              <Link href="/login">LOG IN</Link>
              <Link href="/signup">SIGN UP</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
