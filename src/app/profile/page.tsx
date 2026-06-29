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
    'SELECT artifact_type, unlocked, active FROM user_artifacts WHERE user_id = $1',
    [user.id]
  );

  const artifactMap = new Map<string, { unlocked: boolean; active: boolean }>();
  artifactRows.forEach((a: any) => {
    artifactMap.set(a.artifact_type, { unlocked: a.unlocked, active: a.active });
  });

  const getArtifact = (type: string) =>
    artifactMap.get(type) || { unlocked: false, active: false };

  const pairs = [
    {
      pairName: 'Study Tools',
      items: [
        { type: 'highlighters', name: 'Auto Highlighter', icon: '🖌️', ...getArtifact('highlighters') },
        { type: 'flashcards', name: 'Flashcards', icon: '🃏', ...getArtifact('flashcards') },
      ],
    },
    {
      pairName: 'Learning Materials',
      items: [
        { type: 'textbook', name: 'Textbook PDF', icon: '📖', ...getArtifact('textbook') },
        { type: 'audio', name: 'Audio Lesson', icon: '🎧', ...getArtifact('audio') },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-purple-600">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
          {user.role === 'admin' && (
            <span className="inline-block mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              Admin
            </span>
          )}
        </div>
        <div className="mt-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Level</span>
            <span className="font-semibold text-gray-900">{getLevel(user.xp)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">XP</span>
            <span className="font-semibold text-purple-600">{user.xp}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Streak</span>
            <span className="font-semibold text-orange-600">{user.streak} days</span>
          </div>
        </div>
      </div>

      {/* Badges & Artifacts */}
      <div className="lg:col-span-2 space-y-8">
        {/* Badges */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Badges</h2>
          <div className="grid grid-cols-4 gap-4">
            {badgeList.map((badge) => (
              <div
                key={badge.type}
                className={`text-center p-3 rounded-lg ${
                  badge.earned ? 'bg-purple-50' : 'bg-gray-50 opacity-40'
                }`}
              >
                <div className="text-2xl mb-1">{badge.icon}</div>
                <div className="text-xs font-medium text-gray-600">{badge.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Artifacts */}
        <ProfileClient pairs={pairs} userId={user.id} />
      </div>
    </div>
  );
}
