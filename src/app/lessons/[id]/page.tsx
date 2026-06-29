import { notFound } from 'next/navigation';
import { neon } from '@neondatabase/serverless';
import { getSessionUser } from '@/lib/auth';
import LessonClient from './LessonClient';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  const lessonId = parseInt(id);

  if (isNaN(lessonId)) notFound();

  const lessons = await sql.query(
    'SELECT id, title, description, content, youtube_url, pdf_url, created_at, updated_at FROM lessons WHERE id = $1',
    [lessonId]
  );

  if (lessons.length === 0) notFound();

  const lesson = (lessons as any[])[0];

  // Track progress and award XP
  if (user) {
    await sql.query(
      'INSERT INTO lesson_progress (user_id, lesson_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user.id, lessonId]
    );
    if (user.xp > 0) {
      await sql.query('UPDATE users SET xp = xp + 1 WHERE id = $1', [user.id]);
    }
  }

  let artifacts: any[] = [];
  if (user) {
    artifacts = await sql.query(
      "SELECT artifact_type, unlocked, active FROM user_artifacts WHERE user_id = $1 AND unlocked = true AND active = true",
      [user.id]
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{lesson.title}</h1>
        <p className="text-gray-600 mb-6">{lesson.description}</p>

        {lesson.youtube_url && (
          <div className="aspect-video mb-6 rounded-lg overflow-hidden">
            <iframe
              src={lesson.youtube_url.replace('watch?v=', 'embed/')}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        )}

        <div className="prose max-w-none mb-6">
          <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
        </div>

        {lesson.pdf_url && (
          <a
            href={lesson.pdf_url}
            target="_blank"
            className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium"
          >
            <span className="mr-2">📄</span> Download PDF
          </a>
        )}
      </div>

      <LessonClient lessonId={lessonId} userXP={user?.xp || 0} artifacts={artifacts} user={user} />
    </div>
  );
}
