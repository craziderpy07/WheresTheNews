'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';

export default function Leaderboard({ challengeDate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();

    async function fetchLeaderboard() {
      try {
        // Try to get session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        if (!session) {
          console.warn('No session available yet');
          // If no session, try waiting a bit for auth to load
          await new Promise(resolve => setTimeout(resolve, 500));

          const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();
          if (retryError || !retrySession) {
            console.warn('Still no session after retry');
            setError('Please log in to view the leaderboard.');
            setLoading(false);
            return;
          }
          return fetchWithSession(retrySession);
        }

        return fetchWithSession(session);
      } catch (err) {
        if (active) {
          console.error('Auth error:', err);
          setError(err.message || 'Authentication failed');
          setLoading(false);
        }
      }
    }

    async function fetchWithSession(session) {
      if (!session?.access_token) {
        console.warn('Session exists but no access token:', session);
        setError('Your session expired. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const url = new URL('/api/game/leaderboard', window.location.origin);
        if (challengeDate) {
          url.searchParams.append('date', challengeDate);
        }

        const response = await fetch(url, {
          cache: 'no-store',
          headers: { 
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        const body = await response.json();

        if (!response.ok) {
          console.error('API Error Response:', {
            status: response.status,
            error: body.error
          });
          throw new Error(body.error || `Failed to load leaderboard (${response.status})`);
        }

        if (active) {
          console.log('Leaderboard loaded successfully');
          setData(body);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          console.error('Leaderboard fetch error:', err);
          setError(err.message);
          setLoading(false);
        }
      }
    }

    fetchLeaderboard();
    return () => { active = false; };
  }, [challengeDate]);

  if (loading) return <p className="muted">Loading leaderboard...</p>;
  if (error) return <p className="form-message" role="alert">{error}</p>;
  if (!data) return null;

  const { histogram, userBestScore, userRank, totalPlayers, topPlayers } = data;

  if (!histogram || histogram.length === 0) {
    return <p className="muted">No leaderboard data available yet</p>;
  }

  if (totalPlayers === 0) {
    return <p className="muted">No players have completed this challenge yet.</p>;
  }

  const userBucket = userBestScore === null
    ? null
    : histogram.find((bucket, index) => userBestScore >= bucket.min && (userBestScore < bucket.max || (index === histogram.length - 1 && userBestScore <= bucket.max)));
  const chartData = histogram.map((bucket) => ({
    ...bucket,
    label: bucket.min.toLocaleString()
  }));

  return (
    <div className="leaderboard-content">
      {/* User has not played yet */}
      {userBestScore === null && (
        <p className="muted" style={{ marginBottom: '16px' }}>
          Play a game to appear on the leaderboard!
        </p>
      )}

      {/* Histogram */}
      <div className="histogram-section">
        <h3>Score Distribution</h3>
        <div className="leaderboard-chart" aria-label="Score distribution from 0 to 5,000 points">
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={chartData} margin={{ top: 12, right: 8, left: -20, bottom: 4 }}>
              <CartesianGrid stroke="#24415d" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#8eb4d6', fontSize: 11 }} axisLine={{ stroke: '#40617e' }} tickLine={false} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: '#8eb4d6', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value) => [`${value}% of players`, 'Distribution']} />
              {userBucket && <ReferenceLine x={userBucket.min.toLocaleString()} stroke="#ffcf5c" strokeWidth={2} label={{ value: 'You', fill: '#ffcf5c', position: 'top', fontSize: 11 }} />}
              <Bar dataKey="percentHeight" name="Distribution" radius={[4, 4, 0, 0]}>
                {chartData.map((bucket) => (
                  <Cell key={bucket.bucket} fill={userBucket?.bucket === bucket.bucket ? '#27d499' : '#3b7fc9'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Position */}
      {userBestScore !== null && (
        <div className="user-position-section">
          <div className="user-stats">
            <div className="stat-item">
              <span className="stat-label">Your Best Score</span>
              <strong className="stat-value">{userBestScore.toLocaleString()} / 5,000</strong>
            </div>
            <div className="stat-item">
              <span className="stat-label">Your Rank</span>
              <strong className="stat-value">
                #{userRank} of {totalPlayers}
              </strong>
            </div>
            <div className="stat-item">
              <span className="stat-label">Percentile</span>
              <strong className="stat-value">
                {totalPlayers > 0 ? Math.round(((totalPlayers - userRank + 1) / totalPlayers) * 100) : 0}%
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* top 5 players */}
      <div className="top-players-section">
        <h3>Top Players</h3>
        {topPlayers && topPlayers.length > 0 ? (
          <ol className="top-players-list">
            {topPlayers.map((player, index) => (
              <li key={player.userId} className={player.isCurrentUser ? 'current-user' : ''}>
                <div className="player-rank">
                  <span className="rank-number">#{index + 1}</span>
                </div>
                <div className="player-info">
                  <strong>{player.userName}</strong>
                  <span className="player-score">{player.score.toLocaleString()} pts</span>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">No scores yet</p>
        )}
      </div>
    </div>
  );
}
