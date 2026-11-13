import { gameResponse, gameErrorResponse, getGameDatabase } from '../../../../lib/gameServer';
import { requireGameUser } from '../../../../lib/gameSession';

export async function GET(request) {
  try {
    const database = getGameDatabase();

    // Get and verify user
    let user;
    try {
      user = await requireGameUser(request, database);
    } catch (authError) {
      console.error('Auth failed:', authError.message);
      return gameErrorResponse(authError.message || 'Authentication failed', authError.statusCode || 401);
    }

    if (!user || !user.id) {
      return gameErrorResponse('User not found', 401);
    }

    // Leaderboards are daily only. Random games do not have a challenge date.
    const url = new URL(request.url);
    const challengeDate = url.searchParams.get('date');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(challengeDate || '')) {
      return gameResponse({ topPlayers: [], userBestScore: null, userRank: null, totalPlayers: 0, histogram: [] });
    }

    // Fetch every attempt for this challenge date, then keep each player's best score.
    const { data: completedGames, error: gamesError } = await database
      .from('completed_games')
      .select('user_id, total_score, completed_at')
      .eq('challenge_date', challengeDate)
      .order('completed_at', { ascending: true });
    if (gamesError) throw gamesError;

    // Existing replay rows are collapsed to the first saved result for each player.
    const firstScoreByUser = new Map();
    for (const game of completedGames || []) {
      const score = Number(game.total_score);
      if (!firstScoreByUser.has(game.user_id)) firstScoreByUser.set(game.user_id, score);
    }

    const playerScores = [...firstScoreByUser.entries()]
      .map(([userId, score]) => ({ userId, score }))
      .sort((a, b) => b.score - a.score || a.userId.localeCompare(b.userId));
    const userBestScore = firstScoreByUser.get(user.id) ?? null;
    const totalPlayers = playerScores.length;
    const userRank = userBestScore === null
      ? null
      : playerScores.findIndex((player) => player.score <= userBestScore) + 1;

    const topPlayerIds = playerScores.slice(0, 5).map((player) => player.userId);
    const userMap = Object.fromEntries(topPlayerIds.map((userId) => [userId, `User ${userId.slice(0, 8)}`]));
    if (topPlayerIds.length > 0) {
      const { data: profiles, error: profilesError } = await database
        .from('profiles')
        .select('id, username, email')
        .in('id', topPlayerIds);

      if (profilesError) throw profilesError;
      for (const profile of profiles || []) {
        userMap[profile.id] = profile.username || profile.email?.split('@')[0] || userMap[profile.id];
      }
    }

    const enrichedTopPlayers = playerScores.slice(0, 5).map((player) => ({
      userId: player.userId,
      userName: userMap[player.userId] || `User ${player.userId.slice(0, 8)}`,
      score: player.score,
      isCurrentUser: player.userId === user.id
    }));

    // Generate histogram data (10 buckets: 0-500, 500-1000, ..., 4500-5000)
    const bucketCount = 10;
    const bucketSize = 5000 / bucketCount;
    const histogramData = Array.from({ length: bucketCount }, (_, i) => ({
        bucket: i,
        min: Math.round(i * bucketSize),
        max: Math.round((i + 1) * bucketSize),
        count: playerScores.filter(({ score }) => score >= i * bucketSize && (score < (i + 1) * bucketSize || (i === bucketCount - 1 && score <= (i + 1) * bucketSize))).length
      }));

    const participantCount = playerScores.length || 1;

    return gameResponse({
      topPlayers: enrichedTopPlayers,
      userBestScore,
      userRank,
      totalPlayers,
      histogram: histogramData.map(b => ({
        ...b,
        percentHeight: (b.count / participantCount) * 100
      }))
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return gameErrorResponse(error.message || 'Unable to load leaderboard', 500);
  }
}
