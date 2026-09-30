'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const leaderboard = [
  { id: 1, username: 'GeographyNerd42', mode: 'historical', score: 4890, date: 'Sep 28', avatar: 'G' },
  { id: 2, username: 'NewsHound', mode: 'current', score: 4720, date: 'Sep 28', avatar: 'N' },
  { id: 3, username: 'WorldWatcher', mode: 'default', score: 4595, date: 'Sep 27', avatar: 'W' },
  { id: 4, username: 'MapMaster', mode: 'historical', score: 4380, date: 'Sep 27', avatar: 'M' },
  { id: 5, username: 'GlobalGuru', mode: 'current', score: 4215, date: 'Sep 26', avatar: 'G' },
  { id: 6, username: 'AtlasAddict', mode: 'default', score: 4070, date: 'Sep 26', avatar: 'A' },
  { id: 7, username: 'TerraExplorer', mode: 'historical', score: 3925, date: 'Sep 25', avatar: 'T' },
  { id: 8, username: 'LatLngLore', mode: 'current', score: 3810, date: 'Sep 25', avatar: 'L' },
  { id: 9, username: 'Cartographer', mode: 'default', score: 3650, date: 'Sep 24', avatar: 'C' },
  { id: 10, username: 'HemisphereHero', mode: 'historical', score: 3515, date: 'Sep 24', avatar: 'H' }
];

const filters = ['all', 'historical', 'current', 'default'];

function modeLabel(mode) {
  if (mode === 'default') return 'Mixed';
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

export default function LeaderboardPage() {
  const [filter, setFilter] = useState('all');
  const sorted = useMemo(() => {
    const entries = filter === 'all' ? leaderboard : leaderboard.filter((entry) => entry.mode === filter);
    return [...entries].sort((a, b) => b.score - a.score);
  }, [filter]);

  return (
    <section className="leaderboard-page page-shell">
      <div className="leaderboard-title-row">
        <div>
          <h1>Leaderboard</h1>
          <p>Top scores from players around the world</p>
        </div>
        <Link href="/signup" className="button primary leaderboard-join">Join to Compete</Link>
      </div>

      <div className="leaderboard-filters" aria-label="Leaderboard filters">
        {filters.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => setFilter(item)}
            className={filter === item ? 'filter-chip active' : 'filter-chip'}
          >
            {item === 'all' ? 'All Modes' : modeLabel(item)}
          </button>
        ))}
      </div>

      {filter === 'all' && sorted.length >= 3 && (
        <div className="podium-grid">
          {[sorted[1], sorted[0], sorted[2]].map((entry, index) => {
            const rank = index === 0 ? 2 : index === 1 ? 1 : 3;
            return (
              <article key={entry.id} className={`podium-entry podium-rank-${rank}`}>
                <div className={`podium-avatar medal-${rank}`}>{entry.avatar}</div>
                <strong>{entry.username}</strong>
                <span className="podium-score">{entry.score.toLocaleString()}</span>
                <span className="podium-mode">{modeLabel(entry.mode)}</span>
                <div className={`podium-base medal-${rank}`}>#{rank}</div>
              </article>
            );
          })}
        </div>
      )}

      <div className="leaderboard-table prototype-card">
        <div className="leaderboard-table-head leaderboard-table-grid">
          <span>#</span>
          <span>Player</span>
          <span>Mode</span>
          <span className="align-right">Score</span>
          <span className="align-right">Date</span>
        </div>

        <div>
          {sorted.map((entry, index) => (
            <div className="leaderboard-table-row leaderboard-table-grid" key={entry.id}>
              <span className="table-rank">{index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}</span>
              <div className="table-player">
                <span className="avatar-badge">{entry.avatar}</span>
                <strong>{entry.username}</strong>
              </div>
              <div><span className={`mode-pill mode-pill-${entry.mode}`}>{modeLabel(entry.mode)}</span></div>
              <strong className="leaderboard-score align-right">{entry.score.toLocaleString()}</strong>
              <span className="table-date align-right">{entry.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="leaderboard-cta">
        <Link href="/play" className="button primary">Play to Compete →</Link>
      </div>
    </section>
  );
}
