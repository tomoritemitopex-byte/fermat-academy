import { redirect } from 'next/navigation';
import Link from 'next/link';
import { neon } from '@neondatabase/serverless';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

export default async function AdminDashboard() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') redirect('/login');

  const lessons = await sql.query(
    'SELECT id, title, description, created_at FROM lessons ORDER BY created_at DESC'
  );

  const flaggedResult = await sql.query(
    "SELECT COUNT(*) as count FROM flagged_qa WHERE resolved = false"
  );
  const studentCountResult = await sql.query(
    "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
  );
  const lessonCountResult = await sql.query(
    'SELECT COUNT(*) as count FROM lessons'
  );

  const flaggedCount = (flaggedResult[0] as any).count;
  const totalStudents = (studentCountResult[0] as any).count;
  const totalLessons = (lessonCountResult[0] as any).count;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <Link
          href="/admin/lessons/new"
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
        >
          + New Lesson
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-500 mb-1">Total Students</p>
          <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-500 mb-1">Total Lessons</p>
          <p className="text-3xl font-bold text-gray-900">{totalLessons}</p>
        </div>
        <Link href="/admin/flagged-qa" className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition">
          <p className="text-sm text-gray-500 mb-1">Flagged Q&A</p>
          <p className={`text-3xl font-bold ${flaggedCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {flaggedCount}
          </p>
        </Link>
      </div>

      {/* Lessons List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Manage Lessons</h2>
        </div>
        {lessons.length > 0 ? (
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Title</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Created</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(lessons as any[]).map((lesson: any) => (
                <tr key={lesson.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{lesson.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(lesson.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link
                      href={`/admin/lessons/${lesson.id}`}
                      className="text-sm text-purple-600 hover:text-purple-800"
                    >
                      Edit
                    </Link>
                    <form method="POST" action={`/admin/delete?id=${lesson.id}`} className="inline">
                      <button
                        type="submit"
                        className="text-sm text-red-600 hover:text-red-800"
                        onClick={(e) => {
                          if (!confirm('Delete this lesson?')) e.preventDefault();
                        }}
                      >
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No lessons created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
