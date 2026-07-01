/**
 * En çok satılan ürünü bir OYUNCAK yapar.
 * - "Akıllı Robot Oyuncak" (kategori: Oyuncak) ürününü ekler.
 * - Mevcut liderleri ölçer, oyuncağa yeterince sipariş/kalem ekleyerek
 *   hem ADET hem CİRO bazında #1 yapar.
 *
 * Kullanım:
 *   DB_HOST=... DB_USER=shopuser DB_PASSWORD=*** DB_NAME=shop npm run boost-toy
 */
import { Pool } from 'pg';
import { faker } from '@faker-js/faker';

const TOY_NAME = 'Akıllı Robot Oyuncak';
const TOY_PRICE = 1299.9;
const ORDERS = 250; // oyuncak siparişi adedi

function pick<T>(arr: T[]): T {
  return arr[Math.floor(faker.number.float({ min: 0, max: arr.length - 0.0001 }))];
}
function placeholders(rows: number, cols: number): string {
  const parts: string[] = [];
  let p = 1;
  for (let r = 0; r < rows; r++) {
    const cells: string[] = [];
    for (let c = 0; c < cols; c++) cells.push(`$${p++}`);
    parts.push(`(${cells.join(',')})`);
  }
  return parts.join(',');
}
function buildPool(): Pool {
  const icn = process.env.INSTANCE_CONNECTION_NAME;
  const base = { user: process.env.DB_USER || 'shopuser', password: process.env.DB_PASSWORD, database: process.env.DB_NAME || 'shop' };
  if (icn) return new Pool({ ...base, host: `/cloudsql/${icn}` });
  return new Pool({ ...base, host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 5432) });
}

async function main() {
  const pool = buildPool();
  const c = await pool.connect();
  try {
    // 1) Oyuncak ürününü ekle (varsa yeniden kullan)
    const existing = await c.query('SELECT id FROM products WHERE name=$1 LIMIT 1', [TOY_NAME]);
    let toyId: number;
    if (existing.rows[0]) {
      toyId = existing.rows[0].id;
      console.log(`› Oyuncak zaten var (id=${toyId}), besleniyor.`);
    } else {
      const ins = await c.query('INSERT INTO products (name, category, price) VALUES ($1,$2,$3) RETURNING id', [TOY_NAME, 'Oyuncak', TOY_PRICE]);
      toyId = ins.rows[0].id;
      console.log(`› Oyuncak eklendi: "${TOY_NAME}" (id=${toyId}, ₺${TOY_PRICE}).`);
    }

    // 2) Mevcut lideri ölç (oyuncak hariç)
    const lead = await c.query(
      `SELECT COALESCE(MAX(units),0) maxu, COALESCE(MAX(rev),0) maxr FROM (
         SELECT product_id, SUM(quantity) units, SUM(quantity*unit_price) rev
         FROM order_items WHERE product_id <> $1 GROUP BY product_id
       ) t`,
      [toyId],
    );
    const maxUnits = Number(lead.rows[0].maxu);
    const maxRev = Number(lead.rows[0].maxr);
    console.log(`› Mevcut lider → adet: ${maxUnits}, ciro: ₺${maxRev.toFixed(0)}`);

    // 3) Gerekli adet: hem adet hem ciroda %25 geç
    const needUnits = Math.ceil(Math.max(maxUnits, maxRev / TOY_PRICE) * 1.25);
    const perOrderQty = Math.max(1, Math.ceil(needUnits / ORDERS));
    const totalUnits = perOrderQty * ORDERS;
    console.log(`› Hedef: ${totalUnits} adet (${ORDERS} sipariş × ${perOrderQty}).`);

    // 4) Müşterileri al
    const custRes = await c.query('SELECT id FROM customers ORDER BY random() LIMIT 500');
    const custIds = custRes.rows.map((r) => r.id);

    // 5) Sipariş + kalem ekle (status delivered → ciroya sayılır)
    const total = (perOrderQty * TOY_PRICE).toFixed(2);
    const orderParams: any[] = [];
    for (let i = 0; i < ORDERS; i++) {
      orderParams.push(pick(custIds), faker.date.between({ from: '2025-01-01', to: '2025-12-31' }), 'delivered', total);
    }
    const orderRes = await c.query(
      `INSERT INTO orders (customer_id, order_date, status, total_amount) VALUES ${placeholders(ORDERS, 4)} RETURNING id`,
      orderParams,
    );
    const orderIds = orderRes.rows.map((r) => r.id);

    const itemParams: any[] = [];
    for (const oid of orderIds) itemParams.push(oid, toyId, perOrderQty, TOY_PRICE.toFixed(2));
    await c.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ${placeholders(ORDERS, 4)}`,
      itemParams,
    );

    // 6) Doğrula → top 5
    const top = await c.query(
      `SELECT p.name, p.category, SUM(oi.quantity) units, ROUND(SUM(oi.quantity*oi.unit_price)) revenue
       FROM order_items oi JOIN products p ON p.id = oi.product_id
       GROUP BY p.name, p.category ORDER BY revenue DESC LIMIT 5`,
    );
    console.log('✓ Yeni en çok satan 5 ürün (ciroya göre):');
    top.rows.forEach((r, i) => console.log(`   ${i + 1}. ${r.name} [${r.category}] — ${r.units} adet, ₺${r.revenue}`));
  } finally {
    c.release();
    await pool.end();
  }
}

main().catch((e) => { console.error('boost-toy hatası:', e); process.exit(1); });
