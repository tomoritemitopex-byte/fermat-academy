import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function migrate() {
  // Create ALL tables WITHOUT foreign key constraints first
  const tables = [
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
    `CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      token VARCHAR(255) UNIQUE NOT NULL,
      user_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS badges (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      type VARCHAR(50) NOT NULL,
      earned_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, type)
    )`,
    `CREATE TABLE IF NOT EXISTS user_artifacts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      artifact_type VARCHAR(50) NOT NULL,
      unlocked BOOLEAN DEFAULT FALSE,
      active BOOLEAN DEFAULT FALSE,
      UNIQUE(user_id, artifact_type)
    )`,
    `CREATE TABLE IF NOT EXISTS lessons (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      youtube_url VARCHAR(500) NOT NULL DEFAULT '',
      pdf_url VARCHAR(500) NOT NULL DEFAULT '',
      admin_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS artifact_content (
      id SERIAL PRIMARY KEY,
      lesson_id INTEGER,
      type VARCHAR(50) NOT NULL,
      content JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(lesson_id, type)
    )`,
    `CREATE TABLE IF NOT EXISTS lesson_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      lesson_id INTEGER,
      video_watched BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, lesson_id)
    )`,
    `CREATE TABLE IF NOT EXISTS flagged_qa (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      lesson_id INTEGER,
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
      console.warn('Warning creating table:', err instanceof Error ? err.message : err);
    }
  }

  // Add FK constraints (will skip if already exist)
  const constraints = [
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_user_id_fkey') THEN
        ALTER TABLE sessions ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END $$`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'badges_user_id_fkey') THEN
        ALTER TABLE badges ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END $$`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_artifacts_user_id_fkey') THEN
        ALTER TABLE user_artifacts ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END $$`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lessons_admin_id_fkey') THEN
        ALTER TABLE lessons ADD FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;
      END IF;
    END $$`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'artifact_content_lesson_id_fkey') THEN
        ALTER TABLE artifact_content ADD FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
      END IF;
    END $$`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lesson_progress_user_id_fkey') THEN
        ALTER TABLE lesson_progress ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END $$`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lesson_progress_lesson_id_fkey') THEN
        ALTER TABLE lesson_progress ADD FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
      END IF;
    END $$`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'flagged_qa_user_id_fkey') THEN
        ALTER TABLE flagged_qa ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
      END IF;
    END $$`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'flagged_qa_lesson_id_fkey') THEN
        ALTER TABLE flagged_qa ADD FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
      END IF;
    END $$`,
  ];

  for (const stmt of constraints) {
    try {
      await sql.query(stmt);
    } catch (err) {
      // Constraint may already exist
    }
  }

  // Add missing columns
  const alterStatements = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'student'`,
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

  console.log('Database setup complete');
}
