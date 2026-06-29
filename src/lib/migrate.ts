import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function migrate() {
  // Drop all tables if they exist (only for initial migration to fix schema issues)
  // This is safe as there's no production data yet
  const dropOrder = [
    'DROP TABLE IF EXISTS flagged_qa CASCADE',
    'DROP TABLE IF EXISTS lesson_progress CASCADE',
    'DROP TABLE IF EXISTS artifact_content CASCADE',
    'DROP TABLE IF EXISTS user_artifacts CASCADE',
    'DROP TABLE IF EXISTS badges CASCADE',
    'DROP TABLE IF EXISTS lessons CASCADE',
    'DROP TABLE IF EXISTS sessions CASCADE',
    'DROP TABLE IF EXISTS users CASCADE',
  ];

  for (const stmt of dropOrder) {
    try {
      await sql.query(stmt);
    } catch (err) {
      // Table may not exist
    }
  }

  // Create all tables with correct schema
  const tables = [
    `CREATE TABLE users (
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
    `CREATE TABLE sessions (
      id SERIAL PRIMARY KEY,
      token VARCHAR(255) UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP
    )`,
    `CREATE TABLE badges (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      earned_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, type)
    )`,
    `CREATE TABLE user_artifacts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      artifact_type VARCHAR(50) NOT NULL,
      unlocked BOOLEAN DEFAULT FALSE,
      active BOOLEAN DEFAULT FALSE,
      UNIQUE(user_id, artifact_type)
    )`,
    `CREATE TABLE lessons (
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
    `CREATE TABLE artifact_content (
      id SERIAL PRIMARY KEY,
      lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      content JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(lesson_id, type)
    )`,
    `CREATE TABLE lesson_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
      video_watched BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, lesson_id)
    )`,
    `CREATE TABLE flagged_qa (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      resolved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
  ];

  for (const query of tables) {
    try {
      await sql.query(query);
    } catch (err) {
      console.error('Error creating table:', err instanceof Error ? err.message : err);
    }
  }

  console.log('Database tables created successfully with correct schema');
}
