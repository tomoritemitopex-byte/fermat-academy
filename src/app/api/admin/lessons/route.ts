import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getSessionUser } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL!);

// GET - fetch a single lesson
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const rows = await sql.query(
    'SELECT id, title, description, content, youtube_url, pdf_url FROM lessons WHERE id = $1',
    [parseInt(id)]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json((rows as any[])[0]);
}

// POST - create a new lesson
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, description, content, youtube_url, pdf_url } = await req.json();

  if (!title) {
    return NextResponse.json({ error: 'Title required' }, { status: 400 });
  }

  await sql.query(
    'INSERT INTO lessons (title, description, content, youtube_url, pdf_url, admin_id) VALUES ($1, $2, $3, $4, $5, $6)',
    [title, description || '', content || '', youtube_url || '', pdf_url || '', user.id]
  );

  return NextResponse.json({ success: true });
}

// PUT - update a lesson
export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, title, description, content, youtube_url, pdf_url } = await req.json();

  if (!id || !title) {
    return NextResponse.json({ error: 'ID and title required' }, { status: 400 });
  }

  await sql.query(
    'UPDATE lessons SET title=$1, description=$2, content=$3, youtube_url=$4, pdf_url=$5 WHERE id=$6',
    [title, description || '', content || '', youtube_url || '', pdf_url || '', id]
  );

  return NextResponse.json({ success: true });
}
