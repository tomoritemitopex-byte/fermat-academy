import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function migrate() {
  // First, create tables WITHOUT foreign keys (in dependency order)
  const baseTables = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL DEFAULT '',
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL DEFAULT '',
      role VARCHAR(20) NOT NULL DEFAULT 'student',
      xp INTEGER NOT NULL DEFAULT 0,
      streak INTEGER NOT NULL DEFAULT 0,
      last_active_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    )`,
  ];

  const userRefTables = [
    `CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      token VARCHAR(255) UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS badges (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      earned_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, type)
    )`,
    `CREATE TABLE IF NOT EXISTS user_artifacts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      artifact_type VARCHAR(50) NOT NULL,
      unlocked BOOLEAN DEFAULT FALSE,
      active BOOLEAN DEFAULT FALSE,
      UNIQUE(user_id, artifact_type)
    )`,
  ];

  const lessonTables = [
    `CREATE TABLE IF NOT EXISTS lessons (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      youtube_url VARCHAR(500) NOT NULL DEFAULT '',
      pdf_url VARCHAR(500) NOT NULL DEFAULT '',
      admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS artifact_content (
      id SERIAL PRIMARY KEY,
      lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      content JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(lesson_id, type)
    )`,
    `CREATE TABLE IF NOT EXISTS lesson_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
      video_watched BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, lesson_id)
    )`,
    `CREATE TABLE IF NOT EXISTS flagged_qa (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      resolved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
  ];

  // Create all tables
  const allQueries = [...baseTables, ...userRefTables, ...lessonTables];
  for (const query of allQueries) {
    try {
      await sql.query(query);
    } catch (err) {
      console.warn('Warning creating table:', err instanceof Error ? err.message : err);
    }
  }

  // Add missing columns that older table versions might not have
  const alterStatements = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP DEFAULT NOW()`,
    `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(500) NOT NULL DEFAULT ''`,
  ];

  for (const stmt of alterStatements) {
    try {
      await sql.query(stmt);
    } catch (err) {
      // Column may already exist
    }
  }

  console.log('Database tables and columns created/verified');
}
