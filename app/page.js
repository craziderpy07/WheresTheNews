'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    let subscription;

    try {
      const supabase = getSupabaseBrowserClient();
      supabase.auth.getUser().then(({ data }) => {
        if (!active) return;
        setUser(data.user ?? null);
        setReady(true);
      }).catch(() => {
        if (active) setReady(true);
      });

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return;
        setUser(session?.user ?? null);
        setReady(true);
      });
      subscription = data.subscription;
    } catch {
      if (active) setReady(true);
    }

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <div className="home-page">
      <section className="hero pixel-landing" aria-labelledby="home-title">
        <div className="pixel-hero-scene" aria-hidden="true" />
        <div className="pixel-scanlines" aria-hidden="true" />

        <div className="hero-copy page-shell">
          <span className="hero-kicker">~ A DAILY GEOGRAPHY ADVENTURE ~</span>
          <h1 id="home-title" className="pixel-title">
            <span>WHERE&apos;S</span>
            <span>THE NEWS?</span>
          </h1>
          <p className="hero-subtitle">READ THE HEADLINE. FIND THE PLACE.</p>
          <p className="lead hero-description">
            <span className="desktop-description">
              Five headlines from around the world. Five chances to pinpoint the story
              on the globe. Get closer to the right location to score more points.
            </span>
            <span className="mobile-description">
              Read five headlines. Drop pins on the globe. Score up to 5,000 points.
            </span>
          </p>
          <div className="button-row hero-actions">
            <Link className="button primary" href="/play">&#9658; START GAME</Link>
            {ready && (user ? (
              <Link className="button secondary" href="/history">GAME HISTORY</Link>
            ) : (
              <>
                <Link className="button secondary" href="/signup">CREATE ACCOUNT</Link>
                <Link className="button ghost" href="/login">LOG IN</Link>
              </>
            ))}
          </div>
          <p className="hero-stats">
            <span className="desktop-hero-stats">
              5 HEADLINES <span aria-hidden="true">·</span> 1,000 POINTS EACH <span aria-hidden="true">·</span> NEW DAILY CHALLENGE
            </span>
            <span className="mobile-hero-stats">5 ROUNDS <span aria-hidden="true">·</span> 5,000 MAX POINTS</span>
          </p>
        </div>

        <a className="scroll-cue" href="#how-to-play">▼ HOW TO PLAY</a>
      </section>

      <section id="how-to-play" className="page-shell feature-section">
        <div className="section-heading compact-heading">
          <span className="eyebrow">// YOUR NEXT MISSION</span>
          <h2>FIVE HEADLINES. FIVE GUESSES.</h2>
          <p>Read the news clue, explore the globe, and guess where the event happened.</p>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <span className="feature-number">LEVEL 01</span>
            <div className="feature-icon" aria-hidden="true">▤</div>
            <h3>READ THE NEWS</h3>
            <p>Explore five news headlines selected from different parts of the world.</p>
          </article>
          <article className="feature-card">
            <span className="feature-number">LEVEL 02</span>
            <div className="feature-icon" aria-hidden="true">⌖</div>
            <h3>DROP YOUR PIN</h3>
            <p>Spin and zoom the globe, then choose where you think each story took place.</p>
          </article>
          <article className="feature-card">
            <span className="feature-number">LEVEL 03</span>
            <div className="feature-icon" aria-hidden="true">★</div>
            <h3>SCORE POINTS</h3>
            <p>Each headline awards up to 1,000 points. Closer guesses earn higher scores.</p>
          </article>
        </div>

        <div className="score-strip" aria-label="Game scoring">
          <span><strong>05</strong><small>HEADLINES</small></span>
          <span><strong>1,000</strong><small>POINTS PER HEADLINE</small></span>
          <span><strong>5,000</strong><small>MAX DAILY SCORE</small></span>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <span className="feature-number">MODE 01</span>
            <div className="feature-icon" aria-hidden="true">◷</div>
            <h3>HISTORICAL</h3>
            <p>News from the past time periods.</p>
          </article>
          <article className="feature-card">
            <span className="feature-number">MODE 02</span>
            <div className="feature-icon" aria-hidden="true">●</div>
            <h3>CURRENT</h3>
            <p>Daily challenge and random news rounds.</p>
          </article>
          <article className="feature-card">
            <span className="feature-number">MODE 03</span>
            <div className="feature-icon" aria-hidden="true">◎</div>
            <h3>MIXED</h3>
            <p>News from all time periods.</p>
          </article>
        </div>
      </section>

      {/* Compact mobile guide replaces the long homepage feature grids on phones.
          The original desktop content above remains untouched. */}
      <section className="mobile-home-guide page-shell" aria-labelledby="mobile-guide-title">
        <div className="mobile-guide-heading">
          <h2 id="mobile-guide-title">HOW TO PLAY</h2>
          <span>3 QUICK STEPS</span>
        </div>

        <ol className="mobile-steps">
          <li className="mobile-step">
            <span className="mobile-step-icon" aria-hidden="true">▤</span>
            <strong>READ</strong>
            <small>A headline</small>
          </li>
          <li className="mobile-step">
            <span className="mobile-step-icon" aria-hidden="true">⌖</span>
            <strong>PIN</strong>
            <small>On the globe</small>
          </li>
          <li className="mobile-step">
            <span className="mobile-step-icon" aria-hidden="true">★</span>
            <strong>SCORE</strong>
            <small>Earn points</small>
          </li>
        </ol>

        <details className="mobile-more-details">
          <summary>GAME MODES &amp; SCORING <span aria-hidden="true">+</span></summary>
          <div className="mobile-details-content">
            <p>Guess the locations of five headlines. Each round is worth up to 1,000 points, for a maximum daily score of 5,000.</p>
            <ul>
              <li><strong>Historical:</strong> News from the past.</li>
              <li><strong>Current:</strong> Daily and random news rounds.</li>
              <li><strong>Mixed:</strong> Headlines from all time periods.</li>
            </ul>
          </div>
        </details>
      </section>
    </div>
  );
}
