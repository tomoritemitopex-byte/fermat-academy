import Link from 'next/link';
import { neon } from '@neondatabase/serverless';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

const CLASS_LEVELS = ['SS1', 'SS2', 'SS3'];
const DEPARTMENTS = ['Commercial', 'Science', 'Tech', 'Arts'];

const DEPARTMENT_COLORS: Record<string, string> = {
  Commercial: 'border-l-emerald-500',
  Science: 'border-l-blue-500',
  Tech: 'border-l-orange-500',
  Arts: 'border-l-purple-500',
};

const DEPARTMENT_BG: Record<string, string> = {
  Commercial: 'bg-emerald-50 text-emerald-700',
  Science: 'bg-blue-50 text-blue-700',
  Tech: 'bg-orange-50 text-orange-700',
  Arts: 'bg-purple-50 text-purple-700',
};

export default async function LessonsPage() {
  const user = await getSessionUser();

  const lessons = await sql.query(
    'SELECT id, title, description, class_level, department, created_at FROM lessons ORDER BY class_level, department, title'
  );

  // Group lessons by class_level and department
  const grouped: Record<string, Record<string, any[]>> = {};
  for (const level of CLASS_LEVELS) {
    grouped[level] = {};
    for (const dept of DEPARTMENTS) {
      grouped[level][dept] = (lessons as any[]).filter(
        (l: any) => l.class_level === level && l.department === dept
      );
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">All Lessons</h1>
      <p className="text-gray-500 mb-8">
        Browse lessons by class and department
      </p>

      {/* Class tabs */}
      <div className="space-y-12">
        {CLASS_LEVELS.map((level) => {
          const hasLessons = DEPARTMENTS.some(
            (dept) => grouped[level][dept].length > 0
          );
          if (!hasLessons) return null;

          return (
            <section key={level}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="bg-gray-900 text-white text-sm font-bold px-3 py-1 rounded-full mr-3">
                  {level}
                </span>
                Senior Secondary
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {DEPARTMENTS.map((dept) => {
                  const deptLessons = grouped[level][dept];
                  if (deptLessons.length === 0) return null;

                  return (
                    <div
                      key={`${level}-${dept}`}
                      className={`bg-white rounded-xl shadow-sm border border-l-4 ${DEPARTMENT_COLORS[dept]} overflow-hidden`}
                    >
                      <div className={`px-4 py-2 font-semibold text-sm ${DEPARTMENT_BG[dept]}`}>
                        {dept} Department
                      </div>
                      <div className="divide-y">
                        {deptLessons.map((lesson: any) => (
                          <Link
                            key={lesson.id}
                            href={`/lessons/${lesson.id}`}
                            className="block px-4 py-3 hover:bg-gray-50 transition"
                          >
                            <h3 className="font-medium text-gray-900 text-sm">
                              {lesson.title}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                              {lesson.description}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {lessons.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No lessons yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
