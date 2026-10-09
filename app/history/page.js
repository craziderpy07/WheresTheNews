'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';
import { getChallengeDate } from '../../lib/gameRules';
import './history.css';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function prettyDate(date) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

async function fetchWithAuth(path) {
  const { data, error } = await getSupabaseBrowserClient().auth.getSession();
  if (error) throw error;
  if (!data.session?.access_token) throw new Error('Please log in to view your game history.');
  const response = await fetch(path, { cache: 'no-store', headers: { Authorization: `Bearer ${data.session.access_token}` } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Unable to load your games.');
  return body;
}

export default function HistoryPage() {
  const [tab, setTab] = useState('history');
  const [auth, setAuth] = useState('checking');
  const [history, setHistory] = useState([]);
  const [nextOffset, setNextOffset] = useState(0);
  const [pageAfter, setPageAfter] = useState(null);
  const [month, setMonth] = useState(() => getChallengeDate().slice(0, 7));
  const [calendar, setCalendar] = useState({ available: [], completed: {} });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const today = getChallengeDate();

  useEffect(() => {
    let active = true;
    getSupabaseBrowserClient().auth.getUser().then(({ data }) => {
      if (active) setAuth(data?.user ? 'signed-in' : 'guest');
    }).catch(() => { if (active) setAuth('guest'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (auth !== 'signed-in' || tab !== 'history' || nextOffset === null) return;
    let active = true;
    setLoading(true);
    setError('');
    fetchWithAuth(`/api/game/history?offset=${nextOffset}`).then((data) => {
      if (!active) return;
      setHistory((existing) => nextOffset === 0 ? data.games : [...existing, ...data.games]);
      // Hold this value in the "more" button, rather than refetching automatically.
      setPageAfter(data.nextOffset);
    }).catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [auth, tab, nextOffset, reload]);

  useEffect(() => {
    if (auth !== 'signed-in' || tab !== 'calendar') return;
    let active = true;
    setLoading(true);
    setError('');
    setSelected(null);
    fetchWithAuth(`/api/game/calendar?month=${month}`).then((data) => {
      if (active) setCalendar(data);
    }).catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [auth, tab, month, reload]);

  const calendarDays = useMemo(() => {
    const [year, monthNumber] = month.split('-').map(Number);
    const firstDayOfWeek = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
    const last = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    return [...Array(firstDayOfWeek).fill(null), ...Array.from({ length: last }, (_, i) => {
      const day = i + 1;
      return `${month}-${String(day).padStart(2, '0')}`;
    })];
  }, [month]);

  function moveMonth(amount) {
    const [year, monthNumber] = month.split('-').map(Number);
    const updated = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
    setMonth(updated.toISOString().slice(0, 7));
  }

  const monthTitle = new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const available = new Set(calendar.available);
  const selectedResult = selected ? calendar.completed[selected] : null;

  return (
    <section className="page-shell history-page">
      <div className="section-heading">
        <span className="eyebrow">Your progress</span>
        <h1>Previous Games</h1>
        <p>Review your completed games or explore previous daily challenges.</p>
      </div>

      <div className="history-tabs" role="tablist" aria-label="Game history sections">
        <button type="button" role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'active' : ''} onClick={() => { setError(''); setTab('history'); setNextOffset(0); setPageAfter(null); setReload((v) => v + 1); }}>Game History</button>
        <button type="button" role="tab" aria-selected={tab === 'calendar'} className={tab === 'calendar' ? 'active' : ''} onClick={() => { setError(''); setTab('calendar'); }}>Daily Calendar</button>
      </div>

      {auth === 'checking' && <p className="muted">Checking your account...</p>}
      {auth === 'guest' && <div className="selection-banner"><strong>Log in to see your games.</strong><p>Your results are attached to your Supabase account, so you can view them on another device.</p><Link className="button primary" href="/login?next=%2Fhistory">Log in</Link></div>}
      {auth === 'signed-in' && <>
        {error && <div className="form-message" role="alert">{error} <button type="button" className="button ghost" onClick={() => setReload((v) => v + 1)}>Retry</button></div>}
        {tab === 'history' && <div className="history-list" role="tabpanel">
          {history.map((game) => <article className="history-game" key={game.id}>
            <div><strong>{game.game_type === 'daily' ? 'Daily Challenge' : 'Random Game'}</strong>
              <p>{game.challenge_date ? `${prettyDate(game.challenge_date)} challenge · ` : ''}{new Date(game.completed_at).toLocaleString()}</p>
            </div>
            <div className="history-points"><strong>{game.total_score.toLocaleString()}</strong><span>/ 5,000</span></div>
          </article>)}
          {!loading && !error && history.length === 0 && <p className="muted">You haven't completed any saved games yet. <Link href="/play">Play your first challenge</Link>.</p>}
          {loading && <p className="muted" role="status">Loading games...</p>}
          {!loading && pageAfter !== null && !error && <button className="button ghost" type="button" onClick={() => { if (!loading) setNextOffset(pageAfter); }}>Load More</button>}
        </div>}

        {tab === 'calendar' && <div className="history-calendar-wrap" role="tabpanel">
          <div className="history-calendar">
            <div className="history-calendar-header">
              <button type="button" className="button ghost" aria-label="Previous month" onClick={() => moveMonth(-1)}>‹</button>
              <h2>{monthTitle}</h2>
              <button type="button" className="button ghost" aria-label="Next month" disabled={month >= today.slice(0, 7)} onClick={() => moveMonth(1)}>›</button>
            </div>
            <div className="history-calendar-grid">
              {DAY_NAMES.map((day, i) => <span className="history-weekday" key={i}>{day}</span>)}
              {calendarDays.map((date, i) => {
                if (!date) return <span key={`blank-${i}`} />;
                const done = calendar.completed[date];
                const selectable = available.has(date);
                return <button type="button" key={date} className={`history-day ${done ? 'finished' : ''} ${selected === date ? 'chosen' : ''}`} disabled={!selectable} aria-label={`${prettyDate(date)}${done ? ', completed' : ''}${!selectable ? ', unavailable' : ''}`} onClick={() => setSelected(date)}>
                  <span>{Number(date.slice(-2))}</span><small>{done ? '✓' : selectable ? '•' : ''}</small>
                </button>;
              })}
            </div>
            <p className="history-legend">✓ Completed &nbsp; • Available &nbsp; Dimmed: no challenge saved</p>
          </div>
          <div className="history-selection">
            {loading && <p className="muted" role="status">Loading calendar...</p>}
            {!loading && selected && <>
              <h2>{prettyDate(selected)}</h2>
              {selectedResult ? <p>Completed {selectedResult.attempts} {selectedResult.attempts === 1 ? 'time' : 'times'} · Best: <strong>{selectedResult.best.toLocaleString()} / 5,000</strong></p> : <p>You haven't completed this challenge yet.</p>}
              <Link className="button primary" href={`/play?date=${selected}${selectedResult ? '&replay=1' : ''}`}>{selectedResult ? 'Replay This Day' : 'Play This Day'}</Link>
            </>}
            {!loading && !selected && <p className="muted">Select an available date to play or replay a previous daily challenge.</p>}
            <Link href="/play" className="button ghost">Today's Challenge</Link>
          </div>
        </div>}
      </>}
      <div className="button-row history-footer"><Link className="button ghost" href="/">Back to Home</Link></div>
    </section>
  );
}
