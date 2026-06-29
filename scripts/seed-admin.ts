import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await sql.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET password_hash = $3, role = $4`,
    ['Admin', 'admin@fermatacademy.com', hash, 'admin']
  );
  console.log('✅ Admin user created/updated');
  const u = await sql.query(`SELECT id, name, email, role FROM users WHERE email = $1`, ['admin@fermatacademy.com']);
  console.log(JSON.stringify(u[0], null, 2));
}

main().catch(console.error);
