import Link from 'next/link';
import { neon } from '@neondatabase/serverless';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

export default async function LessonsPage() {
  const user = await getSessionUser();

  const lessons = await sql.query(
    'SELECT id, title, description, created_at FROM lessons ORDER BY created_at DESC'
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">All Lessons</h1>
      {lessons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(lessons as any[]).map((lesson: any) => (
            <Link
              key={lesson.id}
              href={`/lessons/${lesson.id}`}
              className="block bg-white rounded-xl shadow-sm border hover:shadow-md transition p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {lesson.title}
              </h2>
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
  );
}
