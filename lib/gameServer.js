import 'server-only';

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from './supabaseAdmin';
import { ROUND_COUNT, isValidCoordinates } from './gameRules';

const PAGE_SIZE = 500;
const EVENT_COLUMNS = 'id,headline,summary,category,event_date';

export class GameError extends Error {
  constructor(message, status = 503) {
    super(message);
    this.status = status;
  }
}

export function gameResponse(body, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function gameErrorResponse(error) {
  if (error instanceof GameError) return gameResponse({ error: error.message }, error.status);

  console.error('game request failed on the server', error);
  return gameResponse({ error: 'something went wrong on the game server, just try again' }, 500);
}

export async function readGameRequest(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new GameError('couldnt read the request it needs to be a valid json object', 400);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new GameError('the request needs to be a json object not an array or other value', 400);
  return body;
}

export function getGameDatabase() {
  try {
    return getSupabaseAdmin();
  } catch (error) {
    console.error('supabase settings are missing or invalid check the env vars', error);
    let message = 'the game cant connect to supabase because its settings are missing or invalid';
    if (process.env.NODE_ENV === 'development') message = error.message;
    throw new GameError(message);
  }
}

function checkDatabaseError(error, message) {
  if (error) {
    console.error(message, error);
    throw new GameError(message);
  }
}

// loads rows in batches so we get everything even if theres a lot
async function readAllRows(database, table, columns, orderColumn, activeOnly = false) {
  const rows = new Map();
  for (let offset = 0; ; ) {
    let query = database.from(table).select(columns).order(orderColumn).range(offset, offset + PAGE_SIZE - 1);
    if (activeOnly) query = query.eq('is_active', true);

    const { data, error } = await query;
    checkDatabaseError(error, 'couldnt load the event data from the database try again');
    if (data.length === 0) return Array.from(rows.values());
    for (const row of data) rows.set(row[orderColumn], row);
    offset += data.length;
  }
}

// matches the events to their answers by id and only keeps ones with valid locations
function matchEligibleEvents(events, answers) {
  const answersById = new Map(answers.map((answer) => [answer.event_id, answer]));
  return events.filter((event) => {
    const answer = answersById.get(event.id);
    if (!answer) return false;
    return isValidCoordinates(answer.latitude, answer.longitude);
  });
}

export async function selectRandomEvents(database) {
  const [events, answers] = await Promise.all([readAllRows(database, 'game_events', EVENT_COLUMNS, 'id', true), readAllRows(database, 'event_answers', 'event_id,latitude,longitude', 'event_id')]);
  const eligible = matchEligibleEvents(events, answers);
  if (eligible.length < ROUND_COUNT) throw new GameError(`need at least ${ROUND_COUNT} active events with valid answer locations to start a game`);

  for (let index = eligible.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    const event = eligible[index];
    eligible[index] = eligible[other];
    eligible[other] = event;
  }
  return eligible.slice(0, ROUND_COUNT);
}

async function readDailyChallenge(database, date) {
  const { data, error } = await database.from('daily_challenges').select('event_ids').eq('challenge_date', date).maybeSingle();
  checkDatabaseError(error, 'couldnt load the saved daily challenge from the database');
  return data;
}

export async function getDailyEvents(database, date, { createIfMissing = true } = {}) {
  let challenge = await readDailyChallenge(database, date);
  if (!challenge) {
    if (!createIfMissing) throw new GameError('No daily challenge was saved for that date.', 404);
    const selected = await selectRandomEvents(database);
    // keeps the first set saved for the day so everyone gets the same events
    const { error } = await database.from('daily_challenges').upsert({ challenge_date: date, event_ids: selected.map((event) => event.id) }, { onConflict: 'challenge_date', ignoreDuplicates: true });
    checkDatabaseError(error, 'couldnt save the daily event selection to the database');
    challenge = await readDailyChallenge(database, date);
  }

  if (!challenge || challenge.event_ids.length !== ROUND_COUNT || new Set(challenge.event_ids).size !== ROUND_COUNT) throw new GameError(`the saved daily challenge is missing or doesnt have ${ROUND_COUNT} different events`);

  const ids = challenge.event_ids;
  const [eventsResponse, answersResponse] = await Promise.all([database.from('game_events').select(EVENT_COLUMNS).in('id', ids).eq('is_active', true), database.from('event_answers').select('event_id,latitude,longitude').in('event_id', ids)]);
  checkDatabaseError(eventsResponse.error, 'couldnt load the daily events from the database');
  checkDatabaseError(answersResponse.error, 'couldnt load the answer locations for the daily challenge');

  const events = matchEligibleEvents(eventsResponse.data, answersResponse.data);
  const eventsById = new Map(events.map((event) => [event.id, event]));
  if (ids.some((id) => !eventsById.has(id))) throw new GameError('one of the daily events is missing inactive or has no valid answer location');
  return ids.map((id) => eventsById.get(id));
}

export function toPublicEvent(event) {
  return { id: event.id, headline: event.headline, summary: event.summary, category: event.category, eventDate: event.event_date };
}

// Keep event sources private until the player has submitted a guess.
// source_urls can contain URL strings or objects with URL fields.
function firstArticleUrl(sourceUrls) {
  if (!Array.isArray(sourceUrls)) return null;
  for (const source of sourceUrls) {
    const value = typeof source === 'string' ? source : source && typeof source === 'object' ? (source.url ?? source.href ?? source.link) : null;
    if (typeof value !== 'string') continue;
    try {
      const url = new URL(value);
      if (url.protocol === 'https:' || url.protocol === 'http:') return url.href;
    } catch {
      // Skip malformed URLs.
    }
  }
  return null;
}

export async function getEventAnswer(database, eventId) {
  const [eventResponse, answerResponse] = await Promise.all([database.from('game_events').select('id').eq('id', eventId).eq('is_active', true).maybeSingle(), database.from('event_answers').select('location_name,latitude,longitude,source_urls').eq('event_id', eventId).maybeSingle()]);
  checkDatabaseError(eventResponse.error, 'couldnt load the event to score your guess try again');
  checkDatabaseError(answerResponse.error, 'couldnt load the answer location to score your guess try again');

  const answer = answerResponse.data;
  if (!eventResponse.data || !answer) throw new GameError('this event is missing inactive or doesnt have an answer', 404);
  if (!isValidCoordinates(answer.latitude, answer.longitude)) throw new GameError('the answer for this event has missing or invalid map coordinates');
  return { locationName: answer.location_name, latitude: answer.latitude, longitude: answer.longitude, articleUrl: firstArticleUrl(answer.source_urls) };
}
