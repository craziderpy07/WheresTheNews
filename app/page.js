import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <section className="hero page-shell">
        <div className="hero-copy">
          <span className="eyebrow">35% implementation milestone</span>
          <h1>Where&apos;s the News?</h1>
          <p className="lead">
            A browser-based geography game inspired by Wordle and GeoGuessr. Each daily challenge uses five news headlines from around the world. Read the clue, pinpoint the location on the globe, and earn up to 1,000 points per headline based on how close your guess is to the correct location.
          </p>
          <div className="button-row">
            <Link className="button primary" href="/play">Play</Link>
            <Link className="button secondary" href="/signup">Create Account</Link>
            <Link className="button ghost" href="/login">Login</Link>
          </div>
          <div className="status-card">
            <strong>Current milestone:</strong> Functional Requirements 1-7 are implemented.
            The daily five-headline game, map submission, distance calculation, scoring, history, and leaderboard are represented in the interface/data model but remain part of the next implementation milestone.
          </div>
        </div>
        <div className="globe-art" aria-hidden="true">
          <div className="globe-grid" />
          <div className="pin pin-a" />
          <div className="pin pin-b" />
          <div className="pin pin-c" />
        </div>
      </section>

      <section className="page-shell feature-section">
        <div className="section-heading compact-heading">
          <span className="eyebrow">Daily game concept</span>
          <h2>Five headlines. Five guesses. One world.</h2>
          <p>These elements are included in the 35% project as the product design and implementation scaffold for the remaining gameplay requirements.</p>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <span className="feature-number">01</span>
            <h3>Daily Challenge</h3>
            <p>Each day is designed around five current news headlines selected from different parts of the world.</p>
          </article>
          <article className="feature-card">
            <span className="feature-number">02</span>
            <h3>Pinpoint the Story</h3>
            <p>Players will use CesiumJS to place a guess directly on an interactive world map.</p>
          </article>
          <article className="feature-card">
            <span className="feature-number">03</span>
            <h3>0-1000 Points</h3>
            <p>Each headline will award between 0 and 1,000 points. A closer geographic guess earns more points.</p>
          </article>
        </div>
        <div className="score-strip" aria-label="planned game scoring">
          <span><strong>5</strong><small>headlines</small></span>
          <span><strong>1,000</strong><small>max points / headline</small></span>
          <span><strong>5,000</strong><small>max daily score</small></span>
        </div>
      </section>
    </main>
  );
}
