/**
 * Cloud SQL (PostgreSQL) seed script — dummy e-commerce verisi üretir.
 *   - 1000 müşteri
 *   - 60 ürün
 *   - ~3000 sipariş + order_items (toplam tutarlar hesaplanır)
 *
 * Kullanım (lokal veya Cloud SQL Auth Proxy üzerinden):
 *   DB_HOST=127.0.0.1 DB_PORT=5432 DB_USER=shopuser DB_PASSWORD=*** DB_NAME=shop npm run seed
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import { faker } from '@faker-js/faker';

faker.seed(42); // tekrar üretilebilir veri

const CUSTOMER_COUNT = 1000;
const PRODUCT_COUNT = 60;
const ORDER_COUNT = 3000;

const TR_CITIES = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya',
  'Gaziantep', 'Kayseri', 'Mersin', 'Eskişehir', 'Diyarbakır', 'Samsun',
  'Denizli', 'Trabzon', 'Sakarya', 'Malatya', 'Erzurum', 'Van', 'Kocaeli',
];
const CATEGORIES = ['Elektronik', 'Giyim', 'Ev & Yaşam', 'Kitap', 'Spor', 'Kozmetik', 'Oyuncak'];
const STATUSES = ['delivered', 'shipped', 'processing', 'cancelled'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(faker.number.float({ min: 0, max: arr.length - 0.0001 }))];
}

function buildPool(): Pool {
  const icn = process.env.INSTANCE_CONNECTION_NAME;
  if (icn) {
    return new Pool({
      host: `/cloudsql/${icn}`,
      user: process.env.DB_USER || 'shopuser',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'shop',
    });
  }
  return new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'shopuser',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'shop',
  });
}

// Çok satırlı INSERT için ($1,$2,...) parametre placeholder'ları üretir.
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

async function main() {
  const pool = buildPool();
  const client = await pool.connect();
  try {
    console.log('› Şema uygulanıyor...');
    const schema = readFileSync(join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
    await client.query(schema);

    // --- Ürünler ---
    console.log(`› ${PRODUCT_COUNT} ürün ekleniyor...`);
    const productParams: any[] = [];
    for (let i = 0; i < PRODUCT_COUNT; i++) {
      productParams.push(
        faker.commerce.productName(),
        pick(CATEGORIES),
        Number(faker.commerce.price({ min: 20, max: 5000 })),
      );
    }
    const productRes = await client.query(
      `INSERT INTO products (name, category, price) VALUES ${placeholders(PRODUCT_COUNT, 3)} RETURNING id, price`,
      productParams,
    );
    const products = productRes.rows as { id: number; price: string }[];

    // --- Müşteriler (batch) ---
    console.log(`› ${CUSTOMER_COUNT} müşteri ekleniyor...`);
    const customerIds: number[] = [];
    const BATCH = 200;
    for (let start = 0; start < CUSTOMER_COUNT; start += BATCH) {
      const n = Math.min(BATCH, CUSTOMER_COUNT - start);
      const params: any[] = [];
      for (let i = 0; i < n; i++) {
        const idx = start + i;
        const first = faker.person.firstName();
        const last = faker.person.lastName();
        params.push(
          `${first} ${last}`,
          `user${idx}.${faker.internet.userName({ firstName: first, lastName: last }).toLowerCase()}@example.com`,
          pick(TR_CITIES),
          'Türkiye',
          faker.date.between({ from: '2023-01-01', to: '2025-12-31' }),
        );
      }
      const res = await client.query(
        `INSERT INTO customers (full_name, email, city, country, created_at) VALUES ${placeholders(n, 5)} RETURNING id`,
        params,
      );
      for (const row of res.rows) customerIds.push(row.id);
    }

    // --- Siparişler + order_items ---
    console.log(`› ${ORDER_COUNT} sipariş + kalemler ekleniyor...`);
    for (let start = 0; start < ORDER_COUNT; start += BATCH) {
      const n = Math.min(BATCH, ORDER_COUNT - start);

      // Önce order_items'ı hesaplamak için her sipariş için kalem üret
      const orderRows: { customerId: number; date: Date; status: string; items: { productId: number; qty: number; price: number }[]; total: number }[] = [];
      for (let i = 0; i < n; i++) {
        const itemCount = Math.floor(faker.number.float({ min: 1, max: 5.999 }));
        const items: { productId: number; qty: number; price: number }[] = [];
        let total = 0;
        for (let k = 0; k < itemCount; k++) {
          const prod = pick(products);
          const qty = Math.floor(faker.number.float({ min: 1, max: 4.999 }));
          const price = Number(prod.price);
          total += qty * price;
          items.push({ productId: prod.id, qty, price });
        }
        orderRows.push({
          customerId: pick(customerIds),
          date: faker.date.between({ from: '2024-01-01', to: '2025-12-31' }),
          status: pick(STATUSES),
          items,
          total,
        });
      }

      const orderParams: any[] = [];
      for (const o of orderRows) orderParams.push(o.customerId, o.date, o.status, o.total.toFixed(2));
      const orderRes = await client.query(
        `INSERT INTO orders (customer_id, order_date, status, total_amount) VALUES ${placeholders(n, 4)} RETURNING id`,
        orderParams,
      );
      const orderIds = orderRes.rows.map((r) => r.id);

      // order_items
      const itemParams: any[] = [];
      let itemCountTotal = 0;
      for (let i = 0; i < n; i++) {
        for (const it of orderRows[i].items) {
          itemParams.push(orderIds[i], it.productId, it.qty, it.price.toFixed(2));
          itemCountTotal++;
        }
      }
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ${placeholders(itemCountTotal, 4)}`,
        itemParams,
      );
    }

    const counts = await client.query(
      `SELECT
         (SELECT count(*) FROM customers)   AS customers,
         (SELECT count(*) FROM products)    AS products,
         (SELECT count(*) FROM orders)      AS orders,
         (SELECT count(*) FROM order_items) AS order_items`,
    );
    console.log('✓ Seed tamamlandı:', counts.rows[0]);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed hatası:', err);
  process.exit(1);
});
