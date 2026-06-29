import { redirect } from 'next/navigation';
import { neon } from '@neondatabase/serverless';
import { getSessionUser, getLevel } from '@/lib/auth';

export const dynamic = 'force-dynamic';
import ProfileClient from './ProfileClient';

const sql = neon(process.env.DATABASE_URL!);

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const badgeRows = await sql.query('SELECT type FROM badges WHERE user_id = $1', [user.id]);
  const earnedBadges = new Set(badgeRows.map((b: any) => b.type));

  const badgeList = [
    { name: 'Rookie', icon: '🎓', type: 'rookie', earned: earnedBadges.has('rookie') },
    { name: 'Veteran', icon: '🥇', type: 'veteran', earned: earnedBadges.has('veteran') },
    { name: 'Bookworm', icon: '📚', type: 'bookworm', earned: earnedBadges.has('bookworm') },
    { name: 'Scholar', icon: '🏆', type: 'scholar', earned: earnedBadges.has('scholar') },
    { name: 'On Fire', icon: '🔥', type: 'onfire', earned: earnedBadges.has('onfire') },
    { name: 'Dedicated', icon: '💪', type: 'dedicated', earned: earnedBadges.has('dedicated') },
    { name: 'Curious', icon: '🧠', type: 'curious', earned: earnedBadges.has('curious') },
    { name: 'Legend', icon: '🎖️', type: 'legend', earned: earnedBadges.has('legend') },
  ];

  const artifactRows = await sql.query(
    'SELECT artifact_type, unlocked, active FROM user_artifacts WHERE user_id = $1', [user.id]
  );
  const artifactMap = new Map<string, { unlocked: boolean; active: boolean }>();
  artifactRows.forEach((a: any) => artifactMap.set(a.artifact_type, { unlocked: a.unlocked, active: a.active }));
  const getArtifact = (type: string) => artifactMap.get(type) || { unlocked: false, active: false };

  const pairs = [
    { pairName: 'Study Tools', items: [
      { type: 'highlighters', name: 'Auto Highlighter', icon: '🖌️', ...getArtifact('highlighters') },
      { type: 'flashcards', name: 'Flashcards', icon: '🃏', ...getArtifact('flashcards') },
    ]},
    { pairName: 'Learning Materials', items: [
      { type: 'textbook', name: 'Textbook PDF', icon: '📖', ...getArtifact('textbook') },
      { type: 'audio', name: 'Audio Lesson', icon: '🎧', ...getArtifact('audio') },
    ]},
  ];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Profile header */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-violet-400 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-500 text-sm">{user.email}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
              {user.class_level && <span className="bg-purple-50 text-purple-700 text-xs font-medium px-3 py-1 rounded-full">{user.class_level}</span>}
              {user.department && <span className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">{user.department}</span>}
              {user.role === 'admin' && <span className="bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1 rounded-full">Admin</span>}
            </div>
          </div>
          <div className="flex gap-6 md:gap-10 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{getLevel(user.xp)}</p>
              <p className="text-xs text-gray-500">Level</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{user.xp}</p>
              <p className="text-xs text-gray-500">XP</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{user.streak}</p>
              <p className="text-xs text-gray-500">Day streak</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Badges */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 card-hover shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">🏅 Badges</h2>
            <div className="grid grid-cols-4 gap-4">
              {badgeList.map((badge) => (
                <div key={badge.type}
                  className={`text-center p-4 rounded-xl transition ${
                    badge.earned ? 'bg-purple-50 shadow-sm' : 'bg-gray-50 opacity-40'
                  }`}>
                  <div className="text-3xl mb-1">{badge.icon}</div>
                  <div className="text-xs font-medium text-gray-600">{badge.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Artifacts */}
          <ProfileClient pairs={pairs} userId={user.id} />
        </div>

        {/* XP sidebar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 card-hover shadow-sm h-fit">
          <h3 className="font-semibold text-gray-900 mb-4">📈 Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Level {getLevel(user.xp)}</span>
                <span className="text-gray-400 text-xs">{user.xp} XP</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full transition-all"
                  style={{ width: `${Math.min((user.xp % 500) / 5, 100)}%` }} />
              </div>
            </div>
            <div className="text-sm text-gray-500 space-y-2">
              <div className="flex justify-between"><span>Lessons viewed</span><span className="font-medium text-gray-900">—</span></div>
              <div className="flex justify-between"><span>Streak</span><span className="font-medium text-gray-900">{user.streak} days</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
