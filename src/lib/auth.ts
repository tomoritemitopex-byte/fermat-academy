import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';
import { User } from './types';

const sql = neon(process.env.DATABASE_URL!);

export function generateToken(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

export async function setSession(userId: number): Promise<string> {
  const token = generateToken();
  const expires = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

  await sql.query(
    'INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)',
    [token, userId, expires.toISOString()]
  );

  const cookieStore = await cookies();
  cookieStore.set('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires,
    path: '/',
  });

  return token;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (token) {
    await sql.query('DELETE FROM sessions WHERE token = $1', [token]);
  }

  cookieStore.set('session_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });
}

export async function getSessionUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    if (!token) return null;

    const rows = await sql.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.role,
              u.class_level, u.department,
              u.xp, u.streak, u.last_active_at, u.created_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );

    if (rows.length === 0) return null;

    const row = rows[0] as any;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      password_hash: row.password_hash,
      role: row.role,
      class_level: row.class_level || '',
      department: row.department || '',
      xp: row.xp,
      streak: row.streak,
      last_active_at: row.last_active_at?.toString() || '',
      created_at: row.created_at?.toString() || '',
    };
  } catch (err) {
    console.error('getSessionUser error:', err);
    return null;
  }
}

export function getLevel(xp: number): number {
  const levels = [0, 500, 1500, 3500, 7000, 15000, 31000, 63000];
  for (let i = 0; i < levels.length; i++) {
    if (xp < levels[i]) return i;
  }
  return levels.length;
}
