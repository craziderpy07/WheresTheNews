import { GameError, gameResponse, gameErrorResponse, getGameDatabase } from '../../../../lib/gameServer';
import { requireGameUser } from '../../../../lib/gameSession';

const PAGE_SIZE = 30;
export async function GET(request) {
  try {
    const database = getGameDatabase();
    const user = await requireGameUser(request, database);
    const value = new URL(request.url).searchParams.get('offset') || '0';
    if (!/^\d{1,7}$/.test(value)) throw new GameError('Invalid history offset.', 400);
    const offset = Number(value);
    const { data, error } = await database.from('completed_games')
      .select('id,game_type,challenge_date,total_score,completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + PAGE_SIZE);
    if (error) throw error;
    return gameResponse({ games: data.slice(0, PAGE_SIZE), nextOffset: data.length > PAGE_SIZE ? offset + PAGE_SIZE : null });
  } catch (error) {
    return gameErrorResponse(error);
  }
}
