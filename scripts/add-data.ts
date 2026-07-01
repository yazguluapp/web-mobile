/**
 * Cloud SQL'e MEVCUT VERİYİ SİLMEDEN yeni müşteri + sipariş ekler (append).
 * Şema/DROP yok; sadece insert. E-postalar zaman damgalı → çakışmaz.
 *
 * Kullanım:
 *   DB_HOST=127.0.0.1 DB_USER=shopuser DB_PASSWORD=*** DB_NAME=shop npm run add -- 500
 *   (varsayılan 500)
 */
import { Pool } from 'pg';
import { faker } from '@faker-js/faker';

const COUNT = Number(process.argv[2] || process.env.ADD_COUNT || 500);
const ORDERS_PER_CUSTOMER_AVG = 3;

const TR_CITIES = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya',
  'Gaziantep', 'Kayseri', 'Mersin', 'Eskişehir', 'Diyarbakır', 'Samsun',
  'Denizli', 'Trabzon', 'Sakarya', 'Malatya', 'Erzurum', 'Van', 'Kocaeli',
];
const STATUSES = ['delivered', 'shipped', 'processing', 'cancelled'];

// Türkçe ad/soyad — gerçekçi Türk müşteriler
const TR_FIRST = [
  'Ahmet', 'Mehmet', 'Mustafa', 'Ali', 'Hüseyin', 'Hasan', 'İbrahim', 'Emre', 'Burak', 'Cem',
  'Serkan', 'Onur', 'Barış', 'Kaan', 'Deniz', 'Uğur', 'Volkan', 'Tolga', 'Murat', 'Okan',
  'Ayşe', 'Fatma', 'Emine', 'Zeynep', 'Elif', 'Merve', 'Büşra', 'Selin', 'Ece', 'Gizem',
  'Melis', 'Derya', 'Sıla', 'Esra', 'Pınar', 'Ceren', 'Aslı', 'Dilara', 'Nur', 'Yasemin',
];
const TR_LAST = [
  'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir',
  'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek',
  'Polat', 'Korkmaz', 'Çakır', 'Erdoğan', 'Güneş', 'Aktaş', 'Bulut', 'Taş', 'Yalçın', 'Acar',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(faker.number.float({ min: 0, max: arr.length - 0.0001 }))];
}

// Türkçe karakterleri ASCII'ye indir (e-posta için)
function asciify(s: string): string {
  const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', İ: 'i' };
  return s.toLowerCase().replace(/[çğıöşüİ]/g, (c) => map[c] || c).replace(/[^a-z]/g, '');
}

function buildPool(): Pool {
  const icn = process.env.INSTANCE_CONNECTION_NAME;
  const base = {
    user: process.env.DB_USER || 'shopuser',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'shop',
  };
  if (icn) return new Pool({ ...base, host: `/cloudsql/${icn}` });
  return new Pool({ ...base, host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 5432) });
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

async function main() {
  const stamp = Date.now(); // benzersiz e-posta öneki
  const pool = buildPool();
  const client = await pool.connect();
  try {
    // mevcut ürünleri al (yeni ürün eklemiyoruz)
    const prodRes = await client.query('SELECT id, price FROM products');
    const products = prodRes.rows as { id: number; price: string }[];
    if (products.length === 0) throw new Error('Önce seed çalıştırılmalı (products boş).');

    console.log(`› ${COUNT} müşteri ekleniyor (append)...`);
    const customerIds: number[] = [];
    const BATCH = 200;
    for (let start = 0; start < COUNT; start += BATCH) {
      const n = Math.min(BATCH, COUNT - start);
      const params: any[] = [];
      for (let i = 0; i < n; i++) {
        const idx = start + i;
        const first = pick(TR_FIRST);
        const last = pick(TR_LAST);
        params.push(
          `${first} ${last}`,
          `${asciify(first)}.${asciify(last)}.${stamp}_${idx}@example.com`,
          pick(TR_CITIES),
          'Türkiye',
          faker.date.between({ from: '2024-01-01', to: '2025-12-31' }),
        );
      }
      const res = await client.query(
        `INSERT INTO customers (full_name, email, city, country, created_at) VALUES ${placeholders(n, 5)} RETURNING id`,
        params,
      );
      for (const row of res.rows) customerIds.push(row.id);
    }

    const orderTotal = COUNT * ORDERS_PER_CUSTOMER_AVG;
    console.log(`› ~${orderTotal} sipariş + kalemler ekleniyor...`);
    for (let start = 0; start < orderTotal; start += BATCH) {
      const n = Math.min(BATCH, orderTotal - start);
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
      `SELECT (SELECT count(*) FROM customers) customers, (SELECT count(*) FROM orders) orders, (SELECT count(*) FROM order_items) order_items`,
    );
    console.log(`✓ ${COUNT} müşteri eklendi. Yeni toplam:`, counts.rows[0]);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error('add-data hatası:', e);
  process.exit(1);
});
