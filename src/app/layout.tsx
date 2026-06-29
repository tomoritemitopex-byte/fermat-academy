import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';
import { getSessionUser } from '@/lib/auth';
import { migrate } from '@/lib/migrate';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Fermat Academy',
  description: 'Master mathematics and science with structured lessons',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure database tables exist on startup
  await migrate();

  const user = await getSessionUser();

  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script src="https://cdn.tailwindcss.com" />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50">
        <Nav user={user} />
        <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
          {children}
        </main>
        <footer className="bg-white border-t mt-12 py-6 text-center text-gray-500 text-sm">
          &copy; 2026 Fermat Academy. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
