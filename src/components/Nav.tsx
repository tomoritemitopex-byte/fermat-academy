'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/lib/types';

export default function Nav({ user }: { user: User | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const linkClass = (path: string) =>
    `px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
      pathname.startsWith(path)
        ? 'bg-purple-100 text-purple-700 shadow-sm'
        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/50'
    }`;

  return (
    <nav className="sticky top-0 z-40 glass border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-violet-500 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-md group-hover:shadow-lg transition-shadow">
              FA
            </div>
            <span className="text-lg font-bold gradient-text hidden sm:block">
              Fermat Academy
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/lessons" className={linkClass('/lessons')}>
              📚 Lessons
            </Link>
            <Link href="/leaderboard" className={linkClass('/leaderboard')}>
              🏆 Leaderboard
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin" className={linkClass('/admin')}>
                ⚙️ Admin
              </Link>
            )}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-purple-50 transition"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-violet-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline">{user.name}</span>
                  {user.xp > 0 && (
                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {user.xp} XP
                    </span>
                  )}
                </Link>
                <Link
                  href="/logout"
                  className="px-3 py-1.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
                >
                  Logout
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-700 hover:to-violet-600 shadow-md hover:shadow-lg transition-all"
                >
                  Sign up free
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-purple-50 transition"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass border-t border-white/20 px-4 py-4 space-y-2 animate-slide-in-right">
          <MobileLink href="/lessons" icon="📚" label="Lessons" onClick={() => setOpen(false)} />
          <MobileLink href="/leaderboard" icon="🏆" label="Leaderboard" onClick={() => setOpen(false)} />
          {user?.role === 'admin' && (
            <MobileLink href="/admin" icon="⚙️" label="Admin" onClick={() => setOpen(false)} />
          )}
          <hr className="border-gray-200 my-2" />
          {user ? (
            <>
              <MobileLink href="/profile" icon="👤" label={user.name} onClick={() => setOpen(false)} />
              <MobileLink href="/logout" icon="🚪" label="Logout" onClick={() => setOpen(false)} />
            </>
          ) : (
            <>
              <MobileLink href="/login" icon="🔑" label="Log in" onClick={() => setOpen(false)} />
              <MobileLink href="/signup" icon="✨" label="Sign up free" onClick={() => setOpen(false)} highlight />
            </>
          )}
        </div>
      )}
    </nav>
  );
}

function MobileLink({
  href,
  icon,
  label,
  highlight,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  highlight?: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
        highlight
          ? 'bg-gradient-to-r from-purple-600 to-violet-500 text-white shadow-md'
          : 'text-gray-700 hover:bg-purple-50'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
