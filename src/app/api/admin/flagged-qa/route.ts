import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getSessionUser } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await sql.query(
    `SELECT fq.id, fq.user_id, fq.lesson_id, fq.question, fq.answer, fq.resolved
     FROM flagged_qa fq WHERE fq.resolved = false ORDER BY fq.created_at DESC LIMIT 20`
  );

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();
  await sql.query('UPDATE flagged_qa SET resolved = true WHERE id = $1', [id]);

  return NextResponse.json({ success: true });
}
