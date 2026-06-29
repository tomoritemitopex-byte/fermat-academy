import { neon } from '@neondatabase/serverless';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

export default async function LeaderboardPage() {
  const user = await getSessionUser();

  const rows = await sql.query(
    `SELECT name, xp FROM users
     WHERE role = 'student' AND xp > 0
     ORDER BY xp DESC LIMIT 100`
  );

  interface Entry {
    rank: number;
    name: string;
    xp: number;
    artifact_types: string[];
  }

  const entries: Entry[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as any;
    const artifactRows = await sql.query(
      "SELECT artifact_type FROM user_artifacts WHERE user_id = (SELECT id FROM users WHERE name = $1) AND active = true",
      [row.name]
    );
    entries.push({
      rank: i + 1,
      name: row.name,
      xp: row.xp,
      artifact_types: artifactRows.map((a: any) => a.artifact_type),
    });
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Leaderboard</h1>
      {entries.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Rank</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Student</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">XP</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Artifacts</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((entry) => (
                <tr
                  key={entry.rank}
                  className={`hover:bg-gray-50 ${
                    user?.name === entry.name ? 'bg-purple-50' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className="text-lg font-bold text-gray-900">
                      {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {entry.name}
                    {user?.name === entry.name && (
                      <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-purple-600 font-semibold">{entry.xp} XP</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-1">
                      {entry.artifact_types.map((a) => (
                        <span
                          key={a}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                        >
                          {a}
                        </span>
                      ))}
                      {entry.artifact_types.length === 0 && (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border">
          <p className="text-lg">No students on the leaderboard yet. Start learning to earn XP!</p>
        </div>
      )}
    </div>
  );
}
