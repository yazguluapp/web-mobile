import { Pool, PoolConfig } from 'pg';

// Cloud Run'da Cloud SQL'e unix socket ile bağlanırız (/cloudsql/<conn>).
// Lokal geliştirmede TCP (DB_HOST/DB_PORT) kullanırız.
function buildConfig(): PoolConfig {
  const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME;
  const base: PoolConfig = {
    user: process.env.DB_USER || 'shopuser',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'shop',
    max: 5,
  };

  if (instanceConnectionName) {
    return { ...base, host: `/cloudsql/${instanceConnectionName}` };
  }
  return {
    ...base,
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
  };
}

// Next.js dev modunda hot-reload bağlantı sızıntısını önlemek için global singleton.
const globalForPg = globalThis as unknown as { _pgPool?: Pool };
const pool = globalForPg._pgPool ?? new Pool(buildConfig());
if (process.env.NODE_ENV !== 'production') globalForPg._pgPool = pool;

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}

export default pool;
