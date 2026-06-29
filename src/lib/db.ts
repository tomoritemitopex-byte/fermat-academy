import { neon, neonConfig } from '@neondatabase/serverless';

// Configure for serverless/edge compatibility
neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL!);

export async function query(text: string, params?: any[]) {
  if (params) {
    return sql.query(text, params);
  }
  return sql.query(text);
}

export default sql;
