import { neon } from '@neondatabase/serverless';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

const MEDAL = ['🥇', '🥈', '🥉'];
const RANK_COLORS = ['from-yellow-400 to-yellow-500', 'from-gray-300 to-gray-400', 'from-amber-600 to-amber-700'];
const RANK_BG = ['bg-yellow-50 border-yellow-200', 'bg-gray-50 border-gray-200', 'bg-amber-50 border-amber-200'];

export default async function LeaderboardPage() {
  const user = await getSessionUser();

  // Single query with artifacts, avoiding N+1
  const rows = await sql.query(`
    SELECT u.name, u.xp, COALESCE(
      (SELECT json_agg(ua.artifact_type) FROM user_artifacts ua WHERE ua.user_id = u.id AND ua.active = true),
      '[]'::json
    ) as artifact_types
    FROM users u
    WHERE u.role = 'student'
    ORDER BY u.xp DESC
    LIMIT 100
  `);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🏆 Leaderboard</h1>
        <p className="text-gray-500">Top students by experience points</p>
      </div>

      {rows.length > 0 ? (
        <div className="space-y-3 stagger">
          {rows.map((row: any, i: number) => {
            const rank = i + 1;
            const isTop3 = rank <= 3;
            const isMe = user?.name === row.name;
            const artifacts: string[] = Array.isArray(row.artifact_types) ? row.artifact_types : [];

            return (
              <div
                key={i}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition ${
                  isTop3
                    ? `${RANK_BG[i]} shadow-sm`
                    : 'bg-white border-gray-100 hover:border-purple-200'
                } ${isMe ? 'ring-2 ring-purple-400' : ''} card-hover`}
              >
                {/* Rank */}
                <div className="w-10 text-center shrink-0">
                  {isTop3 ? (
                    <span className="text-2xl">{MEDAL[i]}</span>
                  ) : (
                    <span className="text-sm font-bold text-gray-400">#{rank}</span>
                  )}
                </div>

                {/* Avatar + Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                    isTop3
                      ? `bg-gradient-to-br ${RANK_COLORS[i]}`
                      : 'bg-gradient-to-br from-purple-400 to-violet-400'
                  }`}>
                    {row.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {row.name}
                      {isMe && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">You</span>}
                    </p>
                    <p className="text-xs text-gray-400">{rank === 1 ? '🥇 Top student' : rank === 2 ? '🥈 Almost there' : rank === 3 ? '🥉 Podium' : `${rank}th place`}</p>
                  </div>
                </div>

                {/* Artifacts */}
                <div className="hidden sm:flex items-center gap-1">
                  {artifacts.slice(0, 3).map((a: string) => (
                    <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">{a}</span>
                  ))}
                </div>

                {/* XP */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-purple-600">{row.xp}</p>
                  <p className="text-xs text-gray-400">XP</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-5xl mb-4">🏁</p>
          <p className="text-gray-500 text-lg">No students on the leaderboard yet.</p>
          <p className="text-gray-400 text-sm mt-1">Start learning to earn XP!</p>
        </div>
      )}
    </div>
  );
}
