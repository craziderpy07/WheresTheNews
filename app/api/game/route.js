import { getChallengeDate } from '../../../lib/gameRules';
import { GameError, gameResponse, gameErrorResponse, readGameRequest, getGameDatabase, getDailyEvents, selectRandomEvents, toPublicEvent } from '../../../lib/gameServer';

export async function POST(request) {
  try {
    const { type } = await readGameRequest(request);
    if (type !== 'daily' && type !== 'random') throw new GameError('Choose a daily or random game.', 400);

    const database = getGameDatabase();
    const date = getChallengeDate();
    let events;
    if (type === 'daily') {
      events = await getDailyEvents(database, date);
    } else {
      events = await selectRandomEvents(database);
    }
    return gameResponse({ type, date, events: events.map(toPublicEvent) });
  } catch (error) {
    return gameErrorResponse(error);
  }
}
