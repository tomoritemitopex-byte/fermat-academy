import Link from 'next/link';
import { neon } from '@neondatabase/serverless';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

const DEPT_STYLES: Record<string, { icon: string; gradient: string; badge: string }> = {
  Commercial: { icon: '💰', gradient: 'from-emerald-500 to-emerald-600', badge: 'bg-emerald-50 text-emerald-700' },
  Science:    { icon: '🔬', gradient: 'from-blue-500 to-blue-600',       badge: 'bg-blue-50 text-blue-700' },
  Tech:       { icon: '⚙️', gradient: 'from-orange-500 to-orange-600',   badge: 'bg-orange-50 text-orange-700' },
  Arts:       { icon: '🎭', gradient: 'from-purple-500 to-purple-600',   badge: 'bg-purple-50 text-purple-700' },
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
  const userLevel = user?.class_level || '';
  const userDept = user?.department || '';

  const rows = await sql.query(
    userLevel && userDept
      ? 'SELECT id, title, description, class_level, department FROM lessons WHERE class_level = $1 AND department = $2 ORDER BY title'
      : 'SELECT id, title, description, class_level, department FROM lessons ORDER BY class_level, department, title',
    userLevel && userDept ? [userLevel, userDept] : []
  );
  const lessons = rows as Lesson[];

  // Group
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
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">📚 Lessons</h1>
        <p className="text-gray-500">WAEC &amp; NECO syllabus — SS1 through SS3</p>
        {userLevel && userDept ? (
          <div className="mt-3 inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-1.5 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-purple-500 rounded-full" />
            Showing <strong>{userLevel}</strong> · <strong>{userDept}</strong>
          </div>
        ) : (
          <p className="text-sm text-gray-400 mt-2">
            <Link href="/signup" className="text-purple-500 hover:underline font-medium">Sign up</Link> to see only your class and department
          </p>
        )}
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-gray-500 text-lg">No lessons yet for your selection.</p>
        </div>
      ) : (
        <div className="space-y-16">
          {classLevels.map((level) => {
            const depts = grouped[level];
            if (!depts) return null;
            const total = Object.values(depts).reduce((a, b) => a + b.length, 0);

            return (
              <section key={level}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-gray-900 text-white text-lg font-bold px-5 py-1.5 rounded-full">{level}</div>
                  <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
                  <span className="text-sm text-gray-400 font-medium">{total} lessons</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger">
                  {(['Commercial', 'Science', 'Tech', 'Arts'] as const).map((dept) => {
                    const deptLessons = depts[dept];
                    if (!deptLessons || deptLessons.length === 0) return null;
                    const s = DEPT_STYLES[dept];

                    return (
                      <div key={dept} className="bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover shadow-sm">
                        <div className={`bg-gradient-to-r ${s.gradient} text-white px-5 py-3 flex items-center gap-2`}>
                          <span>{s.icon}</span>
                          <span className="font-semibold">{dept}</span>
                          <span className="ml-auto text-white/70 text-sm">{deptLessons.length}</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {deptLessons.map((lesson) => {
                            const parts = lesson.title.split(' — ');
                            const subject = parts[0]?.replace(/^(SS[123])\s+/, '') || lesson.title;
                            const topic = parts[1] || '';
                            return (
                              <Link key={lesson.id} href={`/lessons/${lesson.id}`}
                                className="flex items-start justify-between gap-3 px-5 py-3.5 hover:bg-purple-50/50 transition group">
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900 text-sm group-hover:text-purple-600 transition-colors">{subject}</p>
                                  {topic && <p className="text-xs text-gray-400 mt-0.5 truncate">{topic}</p>}
                                </div>
                                <span className="text-gray-300 group-hover:text-purple-400 transition-colors shrink-0 mt-0.5">→</span>
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
