import { notFound } from 'next/navigation';
import { neon } from '@neondatabase/serverless';
import { getSessionUser } from '@/lib/auth';
import LessonClient from './LessonClient';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const lessonId = parseInt(id);
  if (isNaN(lessonId)) notFound();

  const lessons = await sql.query(
    'SELECT id, title, description, content, class_level, department, youtube_url, pdf_url, created_at, updated_at FROM lessons WHERE id = $1',
    [lessonId]
  );
  if (lessons.length === 0) notFound();
  const lesson = (lessons as any[])[0];

  // Track progress
  if (user) {
    await sql.query('INSERT INTO lesson_progress (user_id, lesson_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [user.id, lessonId]);
    if (user.xp > 0) {
      await sql.query('UPDATE users SET xp = xp + 1 WHERE id = $1', [user.id]);
    }
  }

  let artifacts: any[] = [];
  if (user) {
    artifacts = await sql.query(
      "SELECT artifact_type, unlocked, active FROM user_artifacts WHERE user_id = $1 AND unlocked = true AND active = true", [user.id]
    );
  }

  const subject = (lesson.title as string).split(' — ')[0]?.replace(/^(SS[123])\s+/, '') || lesson.title;
  const topic = (lesson.title as string).split(' — ')[1] || '';

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <a href="/lessons" className="hover:text-purple-600 transition">Lessons</a>
        <span>→</span>
        <span className="text-gray-600">{lesson.class_level} · {lesson.department}</span>
      </div>

      {/* Lesson header */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">{lesson.class_level}</span>
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{lesson.department}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{subject}</h1>
        {topic && <p className="text-lg text-gray-500 mb-4">{topic}</p>}
        <p className="text-gray-600">{lesson.description}</p>

        {lesson.youtube_url && (
          <div className="aspect-video mt-6 rounded-2xl overflow-hidden shadow-lg">
            <iframe src={lesson.youtube_url.replace('watch?v=', 'embed/')} className="w-full h-full" allowFullScreen />
          </div>
        )}

        <div className="prose max-w-none mt-8 text-gray-700 leading-relaxed space-y-4"
          dangerouslySetInnerHTML={{ __html: lesson.content }} />

        {lesson.pdf_url && (
          <a href={lesson.pdf_url} target="_blank"
            className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-700 hover:to-violet-600 shadow-md hover:shadow-lg transition-all">
            <span>📄</span> Download PDF
          </a>
        )}
      </div>

      {/* Active artifacts */}
      {artifacts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">✨ Active Artifacts</h3>
          <div className="flex flex-wrap gap-2">
            {artifacts.map((a) => (
              <span key={a.artifact_type} className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-sm px-3 py-1.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                {a.artifact_type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Dr. Femi bubble (rendered by LessonClient) */}
      <LessonClient lessonId={lessonId} artifacts={artifacts} />
    </div>
  );
}
