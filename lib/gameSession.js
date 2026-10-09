import 'server-only';

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { ROUND_COUNT } from './gameRules';
import { GameError } from './gameServer';

// A signed ticket proves that the game server selected these events.
// The server never accepts a client-supplied event list as authoritative.
function sessionSecret() {
  const secret = process.env.GAME_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new GameError('GAME_SESSION_SECRET must be set to a long, random secret on the server.');
  return secret;
}

function signature(payload) {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

export function createGameTicket(type, date, events) {
  const ticket = {
    version: 1,
    id: randomUUID(),
    type,
    date,
    eventIds: events.map(({ id }) => id),
    issuedAt: Date.now()
  };
  const encoded = Buffer.from(JSON.stringify(ticket)).toString('base64url');
  return `${encoded}.${signature(encoded)}`;
}

export function verifyGameTicket(token) {
  if (typeof token !== 'string' || token.length > 4000 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
    throw new GameError('Invalid game session. Please start a new game.', 400);
  }
  const [payload, received] = token.split('.');
  const expected = signature(payload);
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new GameError('Game session could not be verified.', 400);

  let ticket;
  try { ticket = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); }
  catch { throw new GameError('Invalid game session.', 400); }

  const validDate = typeof ticket?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(ticket.date) &&
    !Number.isNaN(Date.parse(`${ticket.date}T00:00:00Z`));
  const validIds = Array.isArray(ticket?.eventIds) && ticket.eventIds.length === ROUND_COUNT &&
    ticket.eventIds.every((id) => typeof id === 'string' && /^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id)) &&
    new Set(ticket.eventIds).size === ROUND_COUNT;
  if (ticket?.version !== 1 || !/^[0-9a-f-]{36}$/i.test(ticket?.id || '') ||
      !['daily', 'random'].includes(ticket?.type) || !validDate || !validIds ||
      !Number.isSafeInteger(ticket?.issuedAt) || ticket.issuedAt > Date.now() + 60000 ||
      ticket.issuedAt < Date.now() - 90 * 24 * 60 * 60 * 1000) {
    throw new GameError('This game session is invalid or expired. Please start another game.', 400);
  }
  return ticket;
}

export async function requireGameUser(request, database) {
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) throw new GameError('Log in to access your game history.', 401);
  const token = authorization.slice(7).trim();
  if (!token) throw new GameError('Log in to access your game history.', 401);
  const { data, error } = await database.auth.getUser(token);
  if (error || !data?.user) throw new GameError('Your login has expired. Please log in again.', 401);
  return data.user;
}
