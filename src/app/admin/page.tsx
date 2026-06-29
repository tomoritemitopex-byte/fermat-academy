import { redirect } from 'next/navigation';
import Link from 'next/link';
import { neon } from '@neondatabase/serverless';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

export default async function AdminDashboard() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') redirect('/login');

  const [lessons, flaggedResult, studentCountResult, lessonCountResult] = await Promise.all([
    sql.query('SELECT id, title, description, created_at FROM lessons ORDER BY created_at DESC'),
    sql.query("SELECT COUNT(*) as count FROM flagged_qa WHERE resolved = false"),
    sql.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'"),
    sql.query('SELECT COUNT(*) as count FROM lessons'),
  ]);

  const flaggedCount = Number((flaggedResult[0] as any).count);
  const totalStudents = Number((studentCountResult[0] as any).count);
  const totalLessons = Number((lessonCountResult[0] as any).count);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">⚙️ Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage lessons, review flagged content, and monitor activity</p>
        </div>
        <Link href="/admin/lessons/new"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-700 hover:to-violet-600 shadow-md hover:shadow-lg transition-all">
          + New Lesson
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 stagger">
        <StatCard title="Total Students" value={totalStudents} icon="👨‍🎓" gradient="from-blue-500 to-blue-600" />
        <StatCard title="Total Lessons" value={totalLessons} icon="📚" gradient="from-purple-500 to-purple-600" />
        <Link href="/admin/flagged-qa" className="block card-hover">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center text-white text-lg shadow-sm">🚩</div>
              <div>
                <p className="text-sm text-gray-500">Flagged Q&amp;A</p>
                <p className={`text-2xl font-bold ${flaggedCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{flaggedCount}</p>
              </div>
            </div>
            {flaggedCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-red-500">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Needs review
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Lessons table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="font-semibold text-gray-900">📋 All Lessons</h2>
        </div>
        {lessons.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Created</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(lessons as any[]).map((lesson: any) => (
                  <tr key={lesson.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 text-sm truncate max-w-md">{lesson.title}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 hidden md:table-cell">
                      {new Date(lesson.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link href={`/admin/lessons/${lesson.id}`}
                        className="inline-flex px-3 py-1.5 rounded-lg text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 transition">
                        Edit
                      </Link>
                      <form method="POST" action={`/admin/delete?id=${lesson.id}`} className="inline">
                        <button type="submit" onClick={(e) => { if (!confirm('Delete this lesson?')) e.preventDefault(); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No lessons created yet.</p>
            <Link href="/admin/lessons/new" className="text-purple-600 text-sm hover:underline mt-1 inline-block">
              Create your first lesson
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, gradient }: { title: string; value: number; icon: string; gradient: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm card-hover">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white text-lg shadow-sm`}>
          {icon}
        </div>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
