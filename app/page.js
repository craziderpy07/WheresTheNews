import Link from 'next/link';

const modes = [
  {
    icon: '🏛️',
    title: 'Historical',
    subtitle: 'Ancient to Modern',
    description: 'Test your knowledge of pivotal moments in world history — from ancient civilizations to major modern turning points.',
    className: 'mode-historical'
  },
  {
    icon: '📰',
    title: 'Current Events',
    subtitle: 'Recent Headlines',
    description: 'Pin the locations behind the stories shaping today\'s world, from natural disasters to major global events.',
    className: 'mode-current'
  },
  {
    icon: '🌍',
    title: 'Mixed',
    subtitle: 'Best of Both',
    description: 'A curated blend of historical and current events from around the world for the ultimate geography challenge.',
    className: 'mode-mixed'
  }
];

const demoLeaders = [
  { rank: 1, initials: 'AP', username: 'AtlasPlayer', mode: 'Mixed mode', score: '4,820' },
  { rank: 2, initials: 'NW', username: 'NewsWatcher', mode: 'Current mode', score: '4,560' },
  { rank: 3, initials: 'HG', username: 'HistoryGuru', mode: 'Historical mode', score: '4,310' },
  { rank: 4, initials: 'GM', username: 'GlobeMapper', mode: 'Mixed mode', score: '4,060' },
  { rank: 5, initials: 'WW', username: 'WorldWise', mode: 'Current mode', score: '3,940' }
];

export default function HomePage() {
  return (
    <main className="site-main">
      <section className="home-hero">
        <div className="hero-pattern" aria-hidden="true" />
        <div className="page-shell hero-inner">
          <div className="hero-copy prototype-copy">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Geography meets current events
            </div>
            <h1>Where&apos;s the News?</h1>
            <p className="lead">
              Read about real-world events — historical and current — then place your pin where you think it happened. Compete for accuracy across 5 rounds, each scored up to 1,000 points.
            </p>
            <div className="button-row hero-actions">
              <Link className="button primary" href="/play">Start Playing →</Link>
              <Link className="button secondary" href="/login">Sign In to Save Scores</Link>
            </div>
            <p className="hero-note">No account needed to play · Guests can view the leaderboard</p>
          </div>
        </div>
      </section>

      <section className="page-shell section-block">
        <h2 className="display-heading">How It Works</h2>
        <div className="feature-grid prototype-grid">
          <article className="feature-card prototype-card">
            <div className="feature-layout">
              <span className="feature-number">01</span>
              <div>
                <div className="feature-icon">📰</div>
                <h3>Read the Event</h3>
                <p>Each round presents a real news or historical event. Read carefully for geographic clues without the location being given away.</p>
              </div>
            </div>
          </article>
          <article className="feature-card prototype-card">
            <div className="feature-layout">
              <span className="feature-number">02</span>
              <div>
                <div className="feature-icon">📍</div>
                <h3>Place Your Pin</h3>
                <p>Use the interactive world map to choose where you think the event happened. Move your pin until you are ready to submit.</p>
              </div>
            </div>
          </article>
          <article className="feature-card prototype-card">
            <div className="feature-layout">
              <span className="feature-number">03</span>
              <div>
                <div className="feature-icon">🏆</div>
                <h3>Score &amp; Repeat</h3>
                <p>The closer your guess, the higher your score. Complete all 5 rounds and compare your total with other players.</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="page-shell section-block mode-section">
        <h2 className="display-heading">Choose Your Mode</h2>
        <div className="mode-preview-grid">
          {modes.map((mode) => (
            <Link key={mode.title} href="/play" className={`home-mode-card ${mode.className}`}>
              <div className="home-mode-icon">{mode.icon}</div>
              <h3>{mode.title}</h3>
              <div className="mode-subtitle">{mode.subtitle}</div>
              <p>{mode.description}</p>
              <span className="mode-link">Play {mode.title} →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-shell section-block leaderboard-preview-section">
        <div className="section-title-row">
          <h2 className="display-heading">Top Scorers</h2>
          <Link className="prototype-link" href="/leaderboard">View full leaderboard →</Link>
        </div>
        <div className="leaderboard-preview prototype-card">
          {demoLeaders.map((entry, index) => (
            <div className="leaderboard-row" key={entry.rank}>
              <span className={`rank-badge rank-${entry.rank}`}>{entry.rank}</span>
              <span className="avatar-badge">{entry.initials}</span>
              <div className="leaderboard-player">
                <strong>{entry.username}</strong>
                <small>{entry.mode}</small>
              </div>
              <strong className="leaderboard-score">{entry.score}</strong>
              {index < demoLeaders.length - 1 && <span className="sr-only">Next entry</span>}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
