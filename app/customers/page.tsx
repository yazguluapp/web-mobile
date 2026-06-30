import Link from 'next/link';
import { query } from '@/lib/db';
import { formatDate, formatNum } from '@/lib/format';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

type Row = {
  id: number;
  full_name: string;
  email: string;
  city: string;
  country: string;
  created_at: string;
  order_count: string;
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [{ total }] = await query<{ total: string }>(`SELECT count(*) AS total FROM customers`);
  const rows = await query<Row>(
    `SELECT c.id, c.full_name, c.email, c.city, c.country, c.created_at,
            count(o.id) AS order_count
     FROM customers c
     LEFT JOIN orders o ON o.customer_id = c.id
     GROUP BY c.id
     ORDER BY c.id
     LIMIT $1 OFFSET $2`,
    [PAGE_SIZE, offset],
  );
  const totalPages = Math.ceil(Number(total) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Müşteriler</h1>
          <p className="text-gray-400 text-sm mt-1">Toplam {formatNum(total)} müşteri</p>
        </div>
        <span className="text-gray-400 text-sm">Sayfa {page} / {totalPages}</span>
      </div>

      <div className="rounded-xl bg-gray-900/70 border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-gray-400 text-left border-b border-gray-800 bg-black/20">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Ad Soyad</th>
              <th className="px-4 py-3">E-posta</th>
              <th className="px-4 py-3">Şehir</th>
              <th className="px-4 py-3">Kayıt</th>
              <th className="px-4 py-3 text-right">Sipariş</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-2 text-gray-500">{r.id}</td>
                <td className="px-4 py-2">{r.full_name}</td>
                <td className="px-4 py-2 text-gray-400">{r.email}</td>
                <td className="px-4 py-2">{r.city}</td>
                <td className="px-4 py-2 text-gray-400">{formatDate(r.created_at)}</td>
                <td className="px-4 py-2 text-right">{formatNum(r.order_count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between">
        {page > 1 ? (
          <Link href={`/customers?page=${page - 1}`} className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm">
            ← Önceki
          </Link>
        ) : <span />}
        {page < totalPages ? (
          <Link href={`/customers?page=${page + 1}`} className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm">
            Sonraki →
          </Link>
        ) : <span />}
      </div>
    </div>
  );
}
