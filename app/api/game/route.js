import { getChallengeDate } from '../../../lib/gameRules';
import { GameError, gameResponse, gameErrorResponse, readGameRequest, getGameDatabase, getDailyEvents, selectRandomEvents, toPublicEvent } from '../../../lib/gameServer';
import { createGameTicket } from '../../../lib/gameSession';

export async function POST(request) {
  try {
    const { type, date: requestedDate } = await readGameRequest(request);
    if (type !== 'daily' && type !== 'random') throw new GameError('Choose a daily or random game.', 400);
    if (requestedDate !== undefined && type !== 'daily') throw new GameError('A date can only be requested for daily challenges.', 400);

    const today = getChallengeDate();
    let date = today;
    if (requestedDate !== undefined) {
      if (typeof requestedDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ||
          Number.isNaN(Date.parse(`${requestedDate}T00:00:00Z`)) ||
          new Date(`${requestedDate}T00:00:00Z`).toISOString().slice(0, 10) !== requestedDate) {
        throw new GameError('Please select a valid challenge date.', 400);
      }
      if (requestedDate > today) throw new GameError('You cannot play a future challenge.', 400);
      date = requestedDate;
    }

    const database = getGameDatabase();
    const events = type === 'daily'
      ? await getDailyEvents(database, date, { createIfMissing: date === today })
      : await selectRandomEvents(database);
    const sessionToken = createGameTicket(type, date, events);
    return gameResponse({ type, date, events: events.map(toPublicEvent), sessionToken });
  } catch (error) {
    return gameErrorResponse(error);
  }
}
