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
      <nav className="nav page-shell">
        <Link href="/" className="brand">Where&apos;s the News?</Link>
        <div className="nav-links">
          <Link href="/play">Play</Link>
          {ready && user ? (
            <>
              <span className="signed-in">Signed in</span>
              <button className="link-button" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/signup">Sign Up</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
