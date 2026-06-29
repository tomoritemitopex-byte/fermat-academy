import Link from 'next/link';
import { neon } from '@neondatabase/serverless';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

const DEPT_ICONS: Record<string, string> = {
  Commercial: '💰',
  Science: '🔬',
  Tech: '⚙️',
  Arts: '🎭',
};

const DEPT_COLORS: Record<string, string> = {
  Commercial: 'from-emerald-500 to-emerald-600',
  Science: 'from-blue-500 to-blue-600',
  Tech: 'from-orange-500 to-orange-600',
  Arts: 'from-purple-500 to-purple-600',
};

const DEPT_LIGHT: Record<string, string> = {
  Commercial: 'bg-emerald-50 border-emerald-200 hover:border-emerald-300',
  Science: 'bg-blue-50 border-blue-200 hover:border-blue-300',
  Tech: 'bg-orange-50 border-orange-200 hover:border-orange-300',
  Arts: 'bg-purple-50 border-purple-200 hover:border-purple-300',
};

interface Lesson {
  id: number;
  title: string;
  description: string;
  class_level: string;
  department: string;
}

export default async function LessonsPage() {
  const user = await getSessionUser();

  const rows = await sql.query(
    'SELECT id, title, description, class_level, department FROM lessons ORDER BY class_level, department, title'
  );
  const lessons = rows as Lesson[];

  // Group: class_level → department → lessons[]
  const grouped: Record<string, Record<string, Lesson[]>> = {};
  for (const l of lessons) {
    if (!grouped[l.class_level]) grouped[l.class_level] = {};
    if (!grouped[l.class_level][l.department]) grouped[l.class_level][l.department] = [];
    grouped[l.class_level][l.department].push(l);
  }

  const classLevels = ['SS1', 'SS2', 'SS3'];

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">📚 Lessons</h1>
        <p className="text-gray-500">
          WAEC &amp; NECO syllabus — SS1 through SS3
        </p>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No lessons yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-16">
          {classLevels.map((level) => {
            const depts = grouped[level];
            if (!depts) return null;

            return (
              <section key={level}>
                {/* Class header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-gray-900 text-white text-lg font-bold px-5 py-1.5 rounded-full">
                    {level}
                  </div>
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-sm text-gray-400">
                    {(Object.values(depts).reduce((a, b) => a + b.length, 0))} lessons
                  </span>
                </div>

                {/* Department columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(['Commercial', 'Science', 'Tech', 'Arts'] as const).map((dept) => {
                    const deptLessons = depts[dept];
                    if (!deptLessons || deptLessons.length === 0) return null;

                    return (
                      <div
                        key={dept}
                        className={`rounded-xl border-2 ${DEPT_LIGHT[dept]} transition overflow-hidden`}
                      >
                        {/* Department header */}
                        <div className={`bg-gradient-to-r ${DEPT_COLORS[dept]} text-white px-5 py-3 flex items-center gap-2`}>
                          <span className="text-lg">{DEPT_ICONS[dept]}</span>
                          <span className="font-semibold">{dept}</span>
                          <span className="ml-auto text-white/70 text-sm">{deptLessons.length}</span>
                        </div>

                        {/* Lesson list */}
                        <div className="divide-y divide-gray-100">
                          {deptLessons.map((lesson) => {
                            // Extract subject and topic from title like "SS1 Commerce — Introduction to Commerce"
                            const parts = lesson.title.split(' — ');
                            const subject = parts[0]?.replace(/^(SS[123])\s+/, '') || lesson.title;
                            const topic = parts[1] || '';

                            return (
                              <Link
                                key={lesson.id}
                                href={`/lessons/${lesson.id}`}
                                className="block px-5 py-3.5 hover:bg-white/80 transition group"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-900 text-sm group-hover:text-gray-600 transition-colors">
                                      {subject}
                                    </p>
                                    {topic && (
                                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                                        {topic}
                                      </p>
                                    )}
                                  </div>
                                  <span className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 mt-0.5">
                                    →
                                  </span>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
