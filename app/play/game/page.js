'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import GameMap from '../../../components/GameMap';

const eventsByMode = {
  historical: {
    category: 'History', date: '1989',
    title: 'A divided European city opens crossings through its famous concrete barrier',
    description: 'Crowds gathered after officials announced relaxed travel rules, creating scenes that became a symbol of the end of a major political era.',
    hint: 'This capital city sits in northeastern Germany.',
    colorClass: 'category-history'
  },
  current: {
    category: 'Environment', date: '2024',
    title: 'A volcanic eruption forces evacuations near a coastal town on a North Atlantic island',
    description: 'Residents were moved away from an active volcanic zone as lava approached roads and infrastructure near a fishing community.',
    hint: 'This island nation lies between Greenland and mainland Europe.',
    colorClass: 'category-environment'
  },
  default: {
    category: 'World News', date: 'Today',
    title: 'A major global event puts geography knowledge to the test',
    description: 'Use the clues in the story, study the world map, and place your pin where you think the event happened.',
    hint: 'Look for geographic, political, and cultural clues in the story.',
    colorClass: 'category-world'
  }
};

export default function ActiveGamePage() {
  const [mode, setMode] = useState('default');
  const [guess, setGuess] = useState(null);

  useEffect(() => {
    const stored = window.sessionStorage.getItem('wtn-game-mode');
    if (stored && eventsByMode[stored]) setMode(stored);
  }, []);

  const event = eventsByMode[mode];

  return (
    <section className="active-game-page">
      <div className="game-topbar">
        <div className="game-topbar-inner">
          <div className="stage-status">
            <div className="stage-bars" aria-hidden="true">
              <span className="current" /><span /><span /><span /><span />
            </div>
            <strong>Stage 1 of 5</strong>
          </div>
          <div className="game-total-score">
            <span>Total Score</span>
            <strong>0</strong>
            <small>/ 5,000</small>
          </div>
        </div>
      </div>

      <div className="active-game-layout">
        <aside className="event-panel">
          <div className="event-meta">
            <span className={`category-pill ${event.colorClass}`}>{event.category}</span>
            <span>{event.date}</span>
          </div>
          <h1>{event.title}</h1>
          <p className="event-description">{event.description}</p>

          <div className="hint-card">
            <span>💡</span>
            <div>
              <strong>Geographic Hint</strong>
              <p>{event.hint}</p>
            </div>
          </div>

          <div className="round-card">
            <strong>This Round</strong>
            <div><span>Max score available</span><b>1,000 pts</b></div>
            {guess && <div><span>Pin placed at</span><b>{guess.lat.toFixed(1)}°, {guess.lng.toFixed(1)}°</b></div>}
          </div>

          <button type="button" className="button primary full submit-guess" disabled={!guess}>
            {guess ? 'Submit Guess →' : 'Place a Pin First'}
          </button>
          <Link href="/" className="quit-game-link">Quit Game</Link>
        </aside>

        <div className="game-map-area">
          <GameMap onGuess={setGuess} guess={guess} />
        </div>
      </div>
    </section>
  );
}
