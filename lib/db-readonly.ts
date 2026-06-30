import { Pool, PoolConfig } from 'pg';

// Sadece-okuma kullanıcısı (shop_readonly) ile AYRI havuz.
// AI tarafından üretilen sorgular bu havuzda çalışır → yazma DB tarafında imkânsız.
function buildConfig(): PoolConfig {
  const icn = process.env.INSTANCE_CONNECTION_NAME;
  const base: PoolConfig = {
    user: process.env.DB_RO_USER || 'shop_readonly',
    password: process.env.DB_RO_PASSWORD,
    database: process.env.DB_NAME || 'shop',
    max: 3,
    statement_timeout: 8000, // uzun sorguyu kes
  };
  if (icn) return { ...base, host: `/cloudsql/${icn}` };
  return { ...base, host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 5432) };
}

const g = globalThis as unknown as { _pgRoPool?: Pool };
const roPool = g._pgRoPool ?? new Pool(buildConfig());
if (process.env.NODE_ENV !== 'production') g._pgRoPool = roPool;

export async function queryRO<T = any>(text: string, params?: any[]): Promise<T[]> {
  const res = await roPool.query(text, params);
  return res.rows as T[];
}
