'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';

function GlobeMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.8 3 4 6 4 9s-1.2 6-4 9c-2.8-3-4-6-4-9s1.2-6 4-9Z" />
      </svg>
    </span>
  );
}

export default function NavBar() {
  const pathname = usePathname();
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

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Profile';

  if (pathname === '/play/game') return null;

  return (
    <header className="nav-wrap">
      <nav className="nav page-shell">
        <Link href="/" className="brand">
          <GlobeMark />
          <span>Where&apos;s the News?</span>
        </Link>
        <div className="nav-links">
          <Link href="/leaderboard" className="nav-link">Leaderboard</Link>
          {ready && user ? (
            <>
              <span className="nav-link signed-in">{username}</span>
              <button className="nav-outline-button" onClick={logout}>Sign Out</button>
              <Link href="/play" className="nav-play-button">Play</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-link">Sign In</Link>
              <Link href="/play" className="nav-play-button">Play</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
