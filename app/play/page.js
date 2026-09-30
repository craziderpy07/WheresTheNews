'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const modes = [
  {
    id: 'historical', name: 'Historical', icon: '🏛️', subtitle: 'Pre-2000 Events',
    description: "Journey through time. From ancient Rome to the Cold War, test how well you know the locations of history's most defining moments.",
    examples: ['Fall of the Berlin Wall', 'D-Day Landings', 'Hiroshima', 'Battle of Waterloo', 'First Airplane Flight']
  },
  {
    id: 'current', name: 'Current Events', icon: '📰', subtitle: '2011 – Present',
    description: 'Can you keep up with the news? Pin the locations behind the headlines that have shaped our recent world.',
    examples: ['Iceland Volcano (2024)', 'Turkey Earthquake (2023)', 'Suez Canal Blockage', 'Amazon Flooding', 'Ukraine Crisis']
  },
  {
    id: 'default', name: 'Mixed', icon: '🌍', subtitle: 'All Eras',
    description: 'The complete challenge. Any event, any era, any corner of the world. Best for the geographically adventurous.',
    examples: ['Eclectic mix', 'All categories', 'All time periods', 'Global locations', 'Surprise every time']
  }
];

export default function PlayPage() {
  const router = useRouter();
  const [selected, setSelected] = useState('');

  function startGame() {
    if (!selected) return;
    window.sessionStorage.setItem('wtn-game-mode', selected);
    router.push('/play/game');
  }

  return (
    <section className="page-shell play-page prototype-play-page">
      <div className="play-heading">
        <h1>Choose Your Mode</h1>
        <p>Select a category, then place your pins across 5 events. Maximum score: 5,000 points.</p>
        <p className="guest-note">Playing as guest. <Link href="/login">Sign in</Link> to save your scores.</p>
      </div>

      <div className="prototype-mode-grid">
        {modes.map((mode) => {
          const isSelected = selected === mode.id;
          return (
            <button
              type="button"
              key={mode.id}
              onClick={() => setSelected(mode.id)}
              className={`prototype-mode-card ${isSelected ? 'selected' : ''}`}
            >
              <div className="mode-card-icon">{mode.icon}</div>
              <h3>{mode.name}</h3>
              <div className="mode-card-subtitle">{mode.subtitle}</div>
              <p>{mode.description}</p>
              <div className="sample-events-title">Sample events</div>
              <div className="sample-events-list">
                {mode.examples.map((example) => <span key={example}>• {example}</span>)}
              </div>
              {isSelected && <div className="selected-label">✓ Selected</div>}
            </button>
          );
        })}
      </div>

      <div className="scoring-card prototype-card">
        <h3>How scoring works</h3>
        <div className="scoring-grid">
          <div><span>&lt; 50 km</span><strong>1,000 pts</strong></div>
          <div><span>&lt; 500 km</span><strong>700+ pts</strong></div>
          <div><span>&lt; 2,000 km</span><strong>250+ pts</strong></div>
          <div><span>5,000+ km</span><strong>&lt; 50 pts</strong></div>
        </div>
      </div>

      <div className="play-actions">
        <button type="button" onClick={startGame} className="button primary start-game-button" disabled={!selected}>Start Game →</button>
        <Link href="/" className="back-link">← Back to Home</Link>
      </div>
    </section>
  );
}
