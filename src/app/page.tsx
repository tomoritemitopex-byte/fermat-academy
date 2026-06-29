import Link from 'next/link';
import { neon } from '@neondatabase/serverless';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

export default async function HomePage() {
  const user = await getSessionUser();

  const lessons = await sql.query(
    'SELECT id, title, description, created_at FROM lessons ORDER BY created_at DESC LIMIT 6'
  );

  return (
    <>
      <div className="text-center py-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to Fermat Academy
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Master mathematics and science with structured lessons, interactive
          artifacts, and AI-powered tutoring.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href="/lessons"
            className="bg-purple-600 text-white px-8 py-3 rounded-xl text-lg font-medium hover:bg-purple-700 transition"
          >
            Start Learning
          </Link>
          {!user && (
            <Link
              href="/signup"
              className="bg-white text-purple-600 border-2 border-purple-600 px-8 py-3 rounded-xl text-lg font-medium hover:bg-purple-50 transition"
            >
              Create Account
            </Link>
          )}
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Latest Lessons</h2>
        {lessons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(lessons as any[]).map((lesson: any) => (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                className="block bg-white rounded-xl shadow-sm border hover:shadow-md transition p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {lesson.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {lesson.description}
                </p>
                <span className="text-xs text-gray-400">
                  {new Date(lesson.created_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No lessons yet. Check back soon!</p>
          </div>
        )}
      </div>
    </>
  );
}
