import { getChallengeDate } from '../../../lib/gameRules';
import { GameError, gameResponse, gameErrorResponse, readGameRequest, getGameDatabase, getDailyEvents, selectRandomEvents, toPublicEvent } from '../../../lib/gameServer';
import { createGameTicket } from '../../../lib/gameSession';

export async function POST(request) {
  try {
    const { type, date: requestedDate, mode = 'current' } = await readGameRequest(request);
    if (!['default', 'current', 'historical'].includes(mode)) throw new GameError('choose a valid game mode.', 400);
    if (type === 'daily' && mode !== 'current') throw new GameError('daily challenges use current events mode.', 400);
    if (type !== 'daily' && type !== 'random') throw new GameError('choose a daily or random game.', 400);
    if (requestedDate !== undefined && type !== 'daily') throw new GameError('a date can only be requested for daily challenges.', 400);

    const today = getChallengeDate();
    let date = today;
    if (requestedDate !== undefined) {
      if (typeof requestedDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ||
          Number.isNaN(Date.parse(`${requestedDate}T00:00:00Z`)) ||
          new Date(`${requestedDate}T00:00:00Z`).toISOString().slice(0, 10) !== requestedDate) {
        throw new GameError('please select a valid challenge date.', 400);
      }
      if (requestedDate > today) throw new GameError('you cannot play a future challenge.', 400);
      date = requestedDate;
    }

    const database = getGameDatabase();
    const events = type === 'daily'
      ? await getDailyEvents(database, date, { createIfMissing: date === today })
      : await selectRandomEvents(database, mode);
    const sessionToken = createGameTicket(type, date, events);
    return gameResponse({ type, mode, date, events: events.map(toPublicEvent), sessionToken });
  } catch (error) {
    return gameErrorResponse(error);
  }
}
