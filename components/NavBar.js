'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';

export default function NavBar() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

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

  // Close the mobile menu after navigation, or when Escape is pressed.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    function onKeyDown(event) {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  async function logout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <header className="nav-wrap">
      <nav className="nav page-shell" aria-label="Main navigation">
        <Link href="/" className="brand" aria-label="Where's the News? Home" onClick={() => setMobileMenuOpen(false)}>
          <span className="brand-icon" aria-hidden="true">▤</span>
          <span className="brand-title-full">WHERE&apos;S THE NEWS?</span>
          <span className="brand-title-short">WTN?</span>
        </Link>

        {/* Only appears on narrow phones; desktop links stay exactly as before. */}
        <div className="mobile-nav-actions">
          <Link href="/play" className="mobile-play-link" onClick={() => setMobileMenuOpen(false)}>
            &#9658; PLAY
          </Link>
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-controls="primary-nav-links"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        <div id="primary-nav-links" className={`nav-links${mobileMenuOpen ? ' mobile-nav-open' : ''}`}>
          <Link href="/play" onClick={() => setMobileMenuOpen(false)}>PLAY</Link>
          {ready && user && <Link href="/history" onClick={() => setMobileMenuOpen(false)}>HISTORY</Link>}
          {ready && user ? (
            <>
              <span className="signed-in">● ONLINE</span>
              <button type="button" className="link-button" onClick={logout}>LOG OUT</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>LOG IN</Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>SIGN UP</Link>
            </>
          )}
        </div>
      </nav>
      {mobileMenuOpen && (
        <button
          type="button"
          className="mobile-menu-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </header>
  );
}
