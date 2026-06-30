import { query } from '@/lib/db';
import { formatTRY, formatDate, formatNum } from '@/lib/format';

export const dynamic = 'force-dynamic';

type Row = {
  id: number;
  full_name: string;
  city: string;
  order_date: string;
  status: string;
  total_amount: string;
  items: string;
};

const STATUS_LABEL: Record<string, string> = {
  delivered: 'Teslim edildi',
  shipped: 'Kargoda',
  processing: 'Hazırlanıyor',
  cancelled: 'İptal',
};
const STATUS_COLOR: Record<string, string> = {
  delivered: 'bg-green-500/20 text-green-300',
  shipped: 'bg-blue-500/20 text-blue-300',
  processing: 'bg-yellow-500/20 text-yellow-300',
  cancelled: 'bg-red-500/20 text-red-300',
};

export default async function OrdersPage() {
  const rows = await query<Row>(`
    SELECT o.id, c.full_name, c.city, o.order_date, o.status, o.total_amount,
           (SELECT count(*) FROM order_items oi WHERE oi.order_id = o.id) AS items
    FROM orders o JOIN customers c ON c.id = o.customer_id
    ORDER BY o.order_date DESC
    LIMIT 100
  `);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Siparişler</h1>
        <p className="text-gray-400 text-sm mt-1">En son 100 sipariş</p>
      </div>

      <div className="rounded-xl bg-gray-900/70 border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-gray-400 text-left border-b border-gray-800 bg-black/20">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Müşteri</th>
              <th className="px-4 py-3">Şehir</th>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3 text-center">Kalem</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-2 text-gray-500">{r.id}</td>
                <td className="px-4 py-2">{r.full_name}</td>
                <td className="px-4 py-2 text-gray-400">{r.city}</td>
                <td className="px-4 py-2 text-gray-400">{formatDate(r.order_date)}</td>
                <td className="px-4 py-2 text-center text-gray-400">{formatNum(r.items)}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLOR[r.status] ?? ''}`}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">{formatTRY(r.total_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
