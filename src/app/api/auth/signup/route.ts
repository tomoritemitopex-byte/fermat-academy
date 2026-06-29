import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { setSession } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, class_level, department } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields required' },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(password, 10);

    try {
      const rows = await sql.query(
        'INSERT INTO users (name, email, password_hash, role, class_level, department) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [name, email, hash, 'student', class_level || '', department || '']
      );

      const userId = (rows[0] as any).id;
      await setSession(userId);

      return NextResponse.json({ success: true });
    } catch (err: any) {
      if (err.message?.includes('duplicate') || err.code === '23505') {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (err) {
    console.error('Signup error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
