import { calculateDistanceKm, calculatePoints, isValidCoordinates } from '../../../../lib/gameRules';
import { GameError, gameResponse, gameErrorResponse, readGameRequest, getGameDatabase, getEventAnswer } from '../../../../lib/gameServer';

// checks the event id is in the right format before we look it up
function isValidEventId(eventId) {
  if (typeof eventId !== 'string') return false;
  const groups = eventId.split('-');
  const groupLengths = [8, 4, 4, 4, 12];
  if (groups.length !== groupLengths.length) return false;
  if (!groups.every((group, index) => group.length === groupLengths[index])) return false;
  return [...groups.join('').toLowerCase()].every((character) => '0123456789abcdef'.includes(character));
}

export async function POST(request) {
  try {
    const { eventId, latitude, longitude } = await readGameRequest(request);
    if (!isValidEventId(eventId)) throw new GameError('Choose a valid news event.', 400);
    if (!isValidCoordinates(latitude, longitude)) throw new GameError('Choose a valid latitude and longitude on the globe.', 400);

    // gets the answer from supabase then uses the distance from your pin to work out points
    const answer = await getEventAnswer(getGameDatabase(), eventId);
    const distanceKm = calculateDistanceKm({ latitude, longitude }, answer);
    return gameResponse({ eventId, distanceKm, points: calculatePoints(distanceKm), answer });
  } catch (error) {
    return gameErrorResponse(error);
  }
}
