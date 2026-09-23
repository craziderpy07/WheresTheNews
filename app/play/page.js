'use client';

import { useEffect, useState } from 'react';
import CesiumPreview from '../../components/CesiumPreview';

const dailyStages = [
  'Headline 1',
  'Headline 2',
  'Headline 3',
  'Headline 4',
  'Headline 5'
];

export default function PlayPage() {
  const [modes, setModes] = useState([]);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    fetch('/api/modes').then((r) => r.json()).then((body) => setModes(body.modes || []));
  }, []);

  return (
    <section className="page-shell play-page">
      <div className="section-heading">
        <span className="eyebrow">Functional Requirements 5-7</span>
        <h1>Choose a Game Mode</h1>
        <p>Historical and Current modes are implemented for this 35% milestone.</p>
      </div>

      <div className="mode-grid">
        {modes.map((mode) => (
          <button
            key={mode.id}
            disabled={!mode.enabled}
            onClick={() => setSelected(mode.id)}
            className={`mode-card ${selected === mode.id ? 'selected' : ''}`}
          >
            <span className="mode-icon">{mode.id === 'historical' ? '◷' : mode.id === 'current' ? '●' : '◎'}</span>
            <strong>{mode.name}</strong>
            <span>{mode.id === 'historical' ? 'Historical news and events' : mode.id === 'current' ? 'Recent news and events' : 'Historical + current events'}</span>
            {!mode.enabled && <small>{mode.note}</small>}
          </button>
        ))}
      </div>

      {selected && (
        <div className="selection-banner">
          <strong>{selected === 'historical' ? 'Historical' : 'Current'} mode selected.</strong>
          <span>The five-headline daily challenge is previewed below. Guess submission and scoring are intentionally reserved for the next milestone.</span>
        </div>
      )}

      <section className="daily-preview">
        <div className="daily-preview-header">
          <div>
            <span className="eyebrow">Gameplay scaffold</span>
            <h2>Daily News Challenge</h2>
            <p>Five headlines from around the globe. Each round will be worth 0-1,000 points based on distance from the correct location.</p>
          </div>
          <div className="daily-max-score">
            <strong>5,000</strong>
            <span>maximum daily score</span>
          </div>
        </div>

        <div className="stage-row" aria-label="five daily headline stages">
          {dailyStages.map((stage, index) => (
            <div className={`stage-pill ${index === 0 ? 'active' : ''}`} key={stage}>
              <span>{index + 1}</span>
              <small>{stage}</small>
            </div>
          ))}
        </div>

        <div className="headline-preview-card">
          <div>
            <span className="chip">Preview only</span>
            <h3>AI-processed headline clue will appear here</h3>
            <p>The Python ingestion script will collect the source headline, and the AI processing step will summarize it in English while removing direct location giveaways.</p>
          </div>
          <div className="points-preview">
            <span>Round score</span>
            <strong>0-1000</strong>
            <small>Closer guess = more points</small>
          </div>
        </div>
      </section>

      <CesiumPreview />
    </section>
  );
}
