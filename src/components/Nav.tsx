'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/lib/types';

export default function Nav({ user }: { user: User | null }) {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-purple-600">
              Fermat Academy
            </Link>
            <Link
              href="/lessons"
              className={`${pathname.startsWith('/lessons') ? 'text-purple-600' : 'text-gray-600'} hover:text-purple-600`}
            >
              Lessons
            </Link>
            <Link
              href="/leaderboard"
              className={`${pathname === '/leaderboard' ? 'text-purple-600' : 'text-gray-600'} hover:text-purple-600`}
            >
              Leaderboard
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className={`${pathname.startsWith('/admin') ? 'text-purple-800' : 'text-purple-600'} hover:text-purple-800 font-medium`}
                  >
                    Admin
                  </Link>
                )}
                <Link href="/profile" className="text-gray-600 hover:text-purple-600">
                  {user.name}
                  {user.xp > 0 && (
                    <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {user.xp} XP
                    </span>
                  )}
                </Link>
                <Link
                  href="/logout"
                  className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-100"
                >
                  Logout
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-purple-600">
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
