import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const FEATURES = [
  { icon: '📖', title: 'WAEC & NECO Lessons', desc: '96 lessons covering SS1–SS3 across 15 subjects, aligned to the official syllabus.' },
  { icon: '🤖', title: 'AI Tutor — Dr. Femi', desc: 'Get instant help from your AI teaching assistant. Ask questions, get explanations.' },
  { icon: '🏆', title: 'Gamified Learning', desc: 'Earn XP, build streaks, unlock badges and artifacts as you progress.' },
  { icon: '📊', title: 'Track Progress', desc: 'Monitor your learning journey with detailed stats and leaderboard rankings.' },
];

export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-purple-700 to-violet-800 text-white px-8 py-20 md:py-28 mb-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzem0wIDM2YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzem0tMTgtMThjMS42NTcgMCAzLTEuMzQzIDMtM3MtMS4zNDMtMy0zLTMtMyAxLjM0My0zIDMgMS4zNDMgMyAzIDN6IE01NCAzNmMxLjY1NyAwIDMtMS4zNDMgMy0zcy0xLjM0My0zLTMtMy0zIDEuMzQzLTMgMyAxLjM0MyAzIDMgM3oiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm text-purple-200 mb-6 animate-fade-in">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            WAEC &amp; NECO Syllabus
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 animate-fade-in-up">
            Master Your <span className="text-yellow-300">Exams</span> with Confidence
          </h1>
          <p className="text-lg md:text-xl text-purple-200 mb-8 max-w-xl mx-auto animate-fade-in-up">
            Structured lessons, AI tutoring, and gamified learning — all aligned to the WAEC and NECO syllabus.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up">
            <Link
              href="/lessons"
              className="px-8 py-3.5 rounded-2xl text-base font-semibold bg-white text-purple-700 hover:bg-purple-50 shadow-xl hover:shadow-2xl transition-all"
            >
              Start Learning →
            </Link>
            {!user && (
              <Link
                href="/signup"
                className="px-8 py-3.5 rounded-2xl text-base font-semibold border-2 border-white/30 text-white hover:bg-white/10 transition-all"
              >
                Create Free Account
              </Link>
            )}
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-purple-400/10 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-violet-400/10 rounded-full blur-xl animate-float" style={{ animationDelay: '1.5s' }} />
      </section>

      {/* ── Features ── */}
      <section className="mb-20">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">
          Everything you need to ace your exams
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 card-hover shadow-sm">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
