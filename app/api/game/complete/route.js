import { calculateDistanceKm, calculatePoints, getChallengeDate, isValidCoordinates, ROUND_COUNT } from '../../../../lib/gameRules';
import { GameError, gameResponse, gameErrorResponse, readGameRequest, getGameDatabase, getEventAnswer } from '../../../../lib/gameServer';
import { requireGameUser, verifyGameTicket } from '../../../../lib/gameSession';

export async function POST(request) {
  try {
    const database = getGameDatabase();
    const user = await requireGameUser(request, database);
    const { sessionToken, guesses } = await readGameRequest(request);
    const ticket = verifyGameTicket(sessionToken);
    if (ticket.date > getChallengeDate()) throw new GameError('A future challenge cannot be completed.', 400);
    if (!Array.isArray(guesses) || guesses.length !== ROUND_COUNT ||
        !guesses.every((guess) => guess && isValidCoordinates(guess.latitude, guess.longitude))) {
      throw new GameError('Submit exactly five valid guesses.', 400);
    }

    // A daily result must be scored against the authoritative challenge in Supabase.
    if (ticket.type === 'daily') {
      const { data, error } = await database.from('daily_challenges').select('event_ids').eq('challenge_date', ticket.date).maybeSingle();
      if (error) throw error;
      if (!data || JSON.stringify(data.event_ids) !== JSON.stringify(ticket.eventIds)) {
        throw new GameError('The daily event selection has changed. This run cannot be recorded.', 409);
      }
    }

    // Never trust the points sent by the browser. Recalculate against database answers.
    const answers = await Promise.all(ticket.eventIds.map((id) => getEventAnswer(database, id)));
    const totalScore = answers.reduce((sum, answer, index) =>
      sum + calculatePoints(calculateDistanceKm(guesses[index], answer)), 0);

    const entry = {
      session_id: ticket.id,
      user_id: user.id,
      game_type: ticket.type,
      challenge_date: ticket.type === 'daily' ? ticket.date : null,
      total_score: totalScore
    };
    const fields = 'id,game_type,challenge_date,total_score,completed_at';
    const { data: inserted, error } = await database.from('completed_games').insert(entry).select(fields).single();
    if (!error) return gameResponse({ saved: true, game: inserted });

    // Unique session ID makes retries idempotent; refreshing can't add the same run twice.
    if (error.code === '23505') {
      const { data: previous, error: readError } = await database.from('completed_games')
        .select(fields).eq('session_id', ticket.id).eq('user_id', user.id).maybeSingle();
      if (readError) throw readError;
      if (previous) return gameResponse({ saved: true, game: previous });
      throw new GameError('This run was already saved to a different account.', 409);
    }
    console.error('Failed to store completed game', error);
    throw new GameError('Could not save your completed game. Please retry.');
  } catch (error) {
    return gameErrorResponse(error);
  }
}
