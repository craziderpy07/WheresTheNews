import { GameError, gameResponse, gameErrorResponse, getGameDatabase } from '../../../../lib/gameServer';
import { requireGameUser } from '../../../../lib/gameSession';
import { getChallengeDate } from '../../../../lib/gameRules';

export async function GET(request) {
  try {
    const month = new URL(request.url).searchParams.get('month');
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || '')) throw new GameError('Provide a valid month, such as 2026-10.', 400);
    const [year, index] = month.split('-').map(Number);
    const nextMonth = new Date(Date.UTC(year, index, 1)).toISOString().slice(0, 10);
    const first = `${month}-01`;
    const today = getChallengeDate();
    if (first > today) return gameResponse({ available: [], completed: {} });

    const database = getGameDatabase();
    const user = await requireGameUser(request, database);
    const [availableResponse, completedResponse] = await Promise.all([
      database.from('daily_challenges').select('challenge_date').gte('challenge_date', first).lt('challenge_date', nextMonth).lte('challenge_date', today),
      database.from('completed_games').select('challenge_date,total_score').eq('user_id', user.id).eq('game_type', 'daily').gte('challenge_date', first).lt('challenge_date', nextMonth)
    ]);
    if (availableResponse.error) throw availableResponse.error;
    if (completedResponse.error) throw completedResponse.error;
    const completed = {};
    for (const game of completedResponse.data) {
      const prev = completed[game.challenge_date];
      completed[game.challenge_date] = { best: Math.max(prev?.best || 0, game.total_score), attempts: (prev?.attempts || 0) + 1 };
    }
    return gameResponse({ available: availableResponse.data.map((row) => row.challenge_date), completed });
  } catch (error) {
    return gameErrorResponse(error);
  }
}
