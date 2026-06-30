// NL→SQL güvenlik katmanı (kod tarafı). Asıl koruma DB'deki read-only rol;
// bu, ek bir savunma katmanı.
const FORBIDDEN = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|GRANT|REVOKE|TRUNCATE|COPY|MERGE|CALL|EXECUTE)\b/i;

export function sanitizeSelect(raw: string): string {
  let sql = (raw || '').trim();
  // olası kod bloğu işaretlerini temizle
  sql = sql.replace(/^```sql\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
  // sondaki ; kaldır
  sql = sql.replace(/;\s*$/, '').trim();

  if (!sql) throw new Error('Boş sorgu üretildi.');
  if (sql.includes(';')) throw new Error('Birden fazla SQL ifadesi reddedildi.');
  if (!/^(select|with)\b/i.test(sql)) throw new Error('Sadece SELECT sorgularına izin var.');
  if (FORBIDDEN.test(sql)) throw new Error('Veriyi değiştiren anahtar kelime reddedildi.');

  // zorunlu LIMIT
  if (!/\blimit\b/i.test(sql)) sql += ' LIMIT 100';
  return sql;
}
