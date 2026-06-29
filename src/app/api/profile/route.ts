import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getSessionUser } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { artifact_type, action } = await req.json();

    if (action === 'toggle') {
      const rows = await sql.query(
        'SELECT EXISTS(SELECT 1 FROM user_artifacts WHERE user_id=$1 AND artifact_type=$2)',
        [user.id, artifact_type]
      );
      const exists = (rows[0] as any).exists;

      if (exists) {
        await sql.query(
          'UPDATE user_artifacts SET active = NOT active WHERE user_id = $1 AND artifact_type = $2',
          [user.id, artifact_type]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Profile toggle error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
