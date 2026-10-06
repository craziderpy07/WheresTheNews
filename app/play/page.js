'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import GameMap from '../../components/GameMap';
import { GAME_MODES, ROUND_COUNT, getChallengeDate, isValidCoordinates } from '../../lib/gameRules';

const ACTIVE_GAME_KEY = 'wtn-active-game';

// gives each days results its own browser storage key
function completionKey(date) {
  return `wtn-daily-${date}`;
}

// loads saved progress from this browser and ignores broken data. in vscode press alt+z so the long lines wrap
function readSavedGame(key) {
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return null;
    const game = JSON.parse(stored);
    if ((game.type !== 'daily' && game.type !== 'random') || !/^\d{4}-\d{2}-\d{2}$/.test(game.date) || !Number.isFinite(Date.parse(`${game.date}T00:00:00Z`)) || game.events.length !== ROUND_COUNT || game.results.length > ROUND_COUNT) return null;

    const validEvents = game.events.every((event) => typeof event.id === 'string' && typeof event.headline === 'string' && typeof event.summary === 'string' && Number.isFinite(Date.parse(`${event.eventDate}T00:00:00Z`)) && (event.category === null || typeof event.category === 'string'));
    const validResults = game.results.every((result, index) => result.eventId === game.events[index].id && Number.isInteger(result.points) && result.points >= 0 && result.points <= 1000 && Number.isFinite(result.distanceKm) && result.distanceKm >= 0 && typeof result.answer.locationName === 'string' && isValidCoordinates(result.answer.latitude, result.answer.longitude) && isValidCoordinates(result.guess.latitude, result.guess.longitude));
    if (!validEvents || !validResults) return null;
    return game;
  } catch {
    return null;
  }
}

function readDailyCompletion(date) {
  const saved = readSavedGame(completionKey(date));
  if (saved && saved.type === 'daily' && saved.date === date && saved.results.length === ROUND_COUNT) return saved;
  return null;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}

function formatDistance(distanceKm) {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000).toLocaleString()} m`;
  return `${distanceKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
}

// sends requests to the game api and throws an error message if something fails
async function postGameRequest(path, body, signal) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store', signal });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('The game could not be reached. Please try again.');
  }
  if (!response.ok) throw new Error(data.error || 'The game request failed. Please try again.');
  return data;
}

export default function PlayPage() {
  const [phase, setPhase] = useState('ready');
  const [initialized, setInitialized] = useState(false);
  const [game, setGame] = useState(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [guess, setGuess] = useState(null);
  const [results, setResults] = useState([]);
  const [roundResult, setRoundResult] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const busyRef = useRef(false);
  const requestRef = useRef(null);
  const dailyCompletionRef = useRef(null);

  // resumes the next unfinished round or brings back the finished results
  useEffect(() => {
    const date = getChallengeDate();
    let saved = readSavedGame(ACTIVE_GAME_KEY);
    if (saved && saved.type === 'daily') saved = readDailyCompletion(saved.date) || saved;
    if (saved && (saved.results.length < ROUND_COUNT || saved.date === date)) {
      restoreGame(saved);
    } else {
      const completed = readDailyCompletion(date);
      if (completed) restoreGame(completed);
    }
    setInitialized(true);

    return () => {
      if (requestRef.current) requestRef.current.abort();
    };
  }, []);

  // the number of saved guesses tells us which round to show next
  function restoreGame(saved) {
    setGame(saved);
    setResults(saved.results);
    setRoundIndex(saved.results.length);
    setGuess(null);
    setRoundResult(null);
    busyRef.current = false;
    if (saved.results.length === ROUND_COUNT) {
      if (saved.type === 'daily') dailyCompletionRef.current = saved;
      setPhase('complete');
    } else {
      setPhase('guessing');
    }
  }

  function saveGameProgress(saved) {
    try {
      const stored = JSON.stringify(saved);
      if (saved.type === 'daily' && saved.results.length === ROUND_COUNT) window.localStorage.setItem(completionKey(saved.date), stored);
      // stores the events and confirmed guesses in localstorage so refreshing keeps your progress
      window.localStorage.setItem(ACTIVE_GAME_KEY, stored);
    } catch {
      setNotice('Progress could not be saved in this browser. It remains available while this page is open.');
    }
  }

  function findDailyCompletion(date) {
    const completed = dailyCompletionRef.current;
    if (completed && completed.date === date) return completed;
    return readDailyCompletion(date);
  }

  // gets the events and starts a daily or random game
  async function startGame(type) {
    if (busyRef.current) return;
    busyRef.current = true;
    const controller = new AbortController();
    requestRef.current = controller;
    const previousPhase = phase;
    setPhase('loading');
    setError('');
    setNotice('');

    try {
      let nextGame = await postGameRequest('/api/game', { type }, controller.signal);
      // makes you finish the new daily challenge before playing more random games
      if (nextGame.type === 'random' && !findDailyCompletion(nextGame.date)) {
        nextGame = await postGameRequest('/api/game', { type: 'daily' }, controller.signal);
        setNotice('A new daily challenge is available. Complete it to unlock more random games.');
      }
      if (controller.signal.aborted) return;

      if (nextGame.type === 'daily') {
        const saved = findDailyCompletion(nextGame.date) || readSavedGame(ACTIVE_GAME_KEY);
        if (saved && saved.type === 'daily' && saved.date === nextGame.date) {
          restoreGame(saved);
          return;
        }
      }

      const started = { ...nextGame, results: [] };
      restoreGame(started);
      saveGameProgress(started);
    } catch (loadError) {
      if (controller.signal.aborted) return;
      setError(loadError.message);
      setPhase(previousPhase);
    } finally {
      busyRef.current = false;
      requestRef.current = null;
    }
  }

  const placeGuess = useCallback((coordinates) => {
    if (busyRef.current) return;
    setGuess(coordinates);
  }, []);

  // locks the pin and asks the server for the distance points and correct location
  async function confirmGuess() {
    if (busyRef.current || phase !== 'guessing' || !guess) return;
    busyRef.current = true;
    const controller = new AbortController();
    requestRef.current = controller;
    const event = game.events[roundIndex];
    setPhase('submitting');
    setError('');

    try {
      const result = await postGameRequest('/api/game/guess', { eventId: event.id, latitude: guess.latitude, longitude: guess.longitude }, controller.signal);
      if (controller.signal.aborted) return;
      if (result.eventId !== event.id) throw new Error('Your guess could not be scored. Please try again.');

      const nextResults = [...results, { ...result, guess }];
      setResults(nextResults);
      setRoundResult(result);
      setPhase('result');

      // saves after each confirmed guess so two finished rounds bring you back to round three
      const progress = { ...game, results: nextResults };
      if (nextResults.length === ROUND_COUNT && game.type === 'daily') dailyCompletionRef.current = progress;
      saveGameProgress(progress);
    } catch (submitError) {
      if (controller.signal.aborted) return;
      busyRef.current = false;
      setError(submitError.message);
      setPhase('guessing');
    } finally {
      requestRef.current = null;
    }
  }

  // clears the old guess for the next round or opens the final results after round five
  function nextRound() {
    if (phase !== 'result' || !busyRef.current) return;
    busyRef.current = false;
    if (results.length === ROUND_COUNT) {
      setPhase('complete');
      return;
    }
    setRoundIndex((index) => index + 1);
    setGuess(null);
    setRoundResult(null);
    setError('');
    setNotice('');
    setPhase('guessing');
  }

  // adds up the completed rounds so each score is counted once
  const total = results.reduce((sum, result) => sum + result.points, 0);

  if (!initialized || phase === 'loading') {
    return (
      <section className="page-shell play-page">
        <div className="selection-banner" role="status"><strong>Loading your challenge...</strong></div>
      </section>
    );
  }

  if (phase === 'ready') {
    return (
      <section className="page-shell play-page">
        <div className="section-heading">
          <span className="eyebrow">Current Events</span>
          <h1>Play the Daily Challenge</h1>
          <p>The standard mode.</p>
        </div>
        <div className="mode-grid">
          {GAME_MODES.map((mode) => {
            let className = 'mode-card';
            if (mode.enabled) className += ' selected';
            return (
              <button type="button" className={className} disabled={!mode.enabled} key={mode.id} onClick={() => startGame('daily')}>
                <span className="mode-icon">{mode.icon}</span>
                <strong>{mode.name}</strong>
                <span>{mode.description}</span>
                {mode.note && <small>{mode.note}</small>}
              </button>
            );
          })}
        </div>
        <div className="selection-banner">
          <strong>Five rounds. Up to 5,000 points.</strong>
          <span>Read the clue, explore the globe, place your pin, and confirm your guess. Guesses within 100 km earn the full 1,000 points.</span>
        </div>
        {error && <p className="form-message" role="alert">{error}</p>}
        <div className="button-row">
          <button type="button" className="button primary" onClick={() => startGame('daily')}>Play Today's Challenge</button>
          <Link className="button ghost" href="/">Back to Home</Link>
        </div>
      </section>
    );
  }

  let gameTitle = 'Daily News Challenge';
  if (game.type === 'random') gameTitle = 'Random News Challenge';

  // shows the five round breakdown and lets you play another random game
  if (phase === 'complete') {
    return (
      <section className="page-shell play-page">
        <div className="section-heading">
          <span className="eyebrow">{gameTitle} · {formatDate(game.date)}</span>
          <h1>Challenge Complete</h1>
          <p>WOW! Here's how you did</p>
        </div>
        <div className="daily-max-score"><strong>{total.toLocaleString()}</strong><span>out of 5,000 points</span></div>
        <ol className="game-results-list">
          {results.map((result, index) => (
            <li className="headline-preview-card" key={result.eventId}>
              <div>
                <span className="eyebrow">Round {index + 1}</span>
                <h2>{game.events[index].headline}</h2>
                <p>{result.answer.locationName} · {formatDistance(result.distanceKm)} away</p>
              </div>
              <div className="points-preview"><strong>{result.points.toLocaleString()}</strong><small> / 1,000 points</small></div>
            </li>
          ))}
        </ol>
        <p className="muted">storing results in the browser for now, later we should prompt to user to login to save under their account history</p>
        {notice && <p className="muted" role="status">{notice}</p>}
        {error && <p className="form-message" role="alert">{error}</p>}
        <div className="button-row">
          <button type="button" className="button primary" onClick={() => startGame('random')}>Play Random Game</button>
          <Link className="button ghost" href="/">Back to Home</Link>
        </div>
      </section>
    );
  }

  const event = game.events[roundIndex];
  const answer = roundResult && roundResult.answer;
  let confirmLabel = 'Confirm Guess';
  if (!guess) confirmLabel = 'Place a Pin First';
  if (phase === 'submitting') confirmLabel = 'Scoring Your Guess...';
  let nextLabel = 'Next Round';
  if (results.length === ROUND_COUNT) nextLabel = 'View Results';

  return (
    <section className="page-shell play-page">
      <div className="daily-preview-header">
        <div className="section-heading">
          <span className="eyebrow">{gameTitle} · {formatDate(game.date)}</span>
          <h1>Round {roundIndex + 1} of {ROUND_COUNT}</h1>
        </div>
        <div className="daily-max-score"><strong>{total.toLocaleString()}</strong><span>total / 5,000 points</span></div>
      </div>
      <div className="stage-row" aria-label="round progress">
        {game.events.map((stage, index) => {
          let className = 'stage-pill';
          if (index === roundIndex) className += ' active';
          if (index < results.length) className += ' completed';
          let label = 'Upcoming';
          if (index === roundIndex) label = 'Current';
          if (index < results.length) label = `${results[index].points} pts`;
          return <div className={className} key={stage.id}><span>{index + 1}</span><small>{label}</small></div>;
        })}
      </div>
      {notice && <p className="muted" role="status">{notice}</p>}
      <div className="game-layout">
        <article className="feature-card">
          <div className="game-event-meta"><span className="chip">{event.category || 'Current Events'}</span><span>{formatDate(event.eventDate)}</span></div>
          <h2>{event.headline}</h2>
          <p>{event.summary}</p>
          {error && <div className="form-message" role="alert">{error}</div>}
          {!roundResult && (
            <div className="button-row">
              <button type="button" className="button primary full" disabled={!guess || phase !== 'guessing'} onClick={confirmGuess}>{confirmLabel}</button>
            </div>
          )}
          {roundResult && (
            <div className="selection-banner" aria-live="polite">
              <span className="eyebrow">Correct location</span>
              <h3>{roundResult.answer.locationName}</h3>
              <p>{formatDistance(roundResult.distanceKm)} from your guess</p>
              <strong>{roundResult.points.toLocaleString()} / 1,000 points</strong>
              <button type="button" className="button primary full" onClick={nextRound}>{nextLabel}</button>
            </div>
          )}
        </article>
        {/* connects the globe to the current guess and keeps the pin locked after confirming */}
        <GameMap guess={guess} answer={answer} locked={phase !== 'guessing'} roundKey={event.id} onGuess={placeGuess} />
      </div>
    </section>
  );
}
