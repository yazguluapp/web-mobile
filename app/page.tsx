import { query } from '@/lib/db';
import { formatTRY, formatNum, formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

type Kpi = { customers: string; orders: string; revenue: string; avg_order: string };
type CityRow = { city: string; cnt: string };
type MonthRow = { month: string; revenue: string };
type RecentOrder = { id: number; full_name: string; status: string; total_amount: string; order_date: string };

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

async function getData() {
  const [kpi] = await query<Kpi>(`
    SELECT
      (SELECT count(*) FROM customers)                                    AS customers,
      (SELECT count(*) FROM orders)                                       AS orders,
      (SELECT COALESCE(sum(total_amount),0) FROM orders WHERE status <> 'cancelled') AS revenue,
      (SELECT COALESCE(avg(total_amount),0) FROM orders WHERE status <> 'cancelled') AS avg_order
  `);
  const cities = await query<CityRow>(
    `SELECT city, count(*) AS cnt FROM customers GROUP BY city ORDER BY cnt DESC LIMIT 8`,
  );
  const months = await query<MonthRow>(`
    SELECT to_char(date_trunc('month', order_date), 'YYYY-MM') AS month,
           sum(total_amount) AS revenue
    FROM orders WHERE status <> 'cancelled'
    GROUP BY 1 ORDER BY 1 DESC LIMIT 12
  `);
  const recent = await query<RecentOrder>(`
    SELECT o.id, c.full_name, o.status, o.total_amount, o.order_date
    FROM orders o JOIN customers c ON c.id = o.customer_id
    ORDER BY o.order_date DESC LIMIT 10
  `);
  return { kpi, cities, months: months.reverse(), recent };
}

export default async function Dashboard() {
  const { kpi, cities, months, recent } = await getData();
  const maxRev = Math.max(...months.map((m) => Number(m.revenue)), 1);
  const maxCity = Math.max(...cities.map((c) => Number(c.cnt)), 1);

  const kpis = [
    { label: 'Toplam Müşteri', value: formatNum(kpi.customers) },
    { label: 'Toplam Sipariş', value: formatNum(kpi.orders) },
    { label: 'Ciro', value: formatTRY(kpi.revenue) },
    { label: 'Ort. Sipariş Tutarı', value: formatTRY(kpi.avg_order) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">E-ticaret Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          Veriler Cloud SQL (PostgreSQL) üzerinden canlı geliyor.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="p-5 rounded-xl bg-gray-900/70 border border-gray-800">
            <div className="text-gray-400 text-xs uppercase tracking-wide">{k.label}</div>
            <div className="text-2xl font-bold mt-2 text-turkcell-yellow">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-gray-900/70 border border-gray-800">
          <h2 className="font-semibold mb-4">Aylık Ciro (son 12 ay)</h2>
          <div className="space-y-2">
            {months.map((m) => (
              <div key={m.month} className="flex items-center gap-3 text-sm">
                <span className="w-16 text-gray-400">{m.month}</span>
                <div className="flex-1 bg-gray-800 rounded h-4 overflow-hidden">
                  <div
                    className="h-full bg-turkcell-yellow"
                    style={{ width: `${(Number(m.revenue) / maxRev) * 100}%` }}
                  />
                </div>
                <span className="w-24 text-right text-gray-300">{formatTRY(m.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl bg-gray-900/70 border border-gray-800">
          <h2 className="font-semibold mb-4">Şehir Bazında Müşteri</h2>
          <div className="space-y-2">
            {cities.map((c) => (
              <div key={c.city} className="flex items-center gap-3 text-sm">
                <span className="w-24 text-gray-400">{c.city}</span>
                <div className="flex-1 bg-gray-800 rounded h-4 overflow-hidden">
                  <div
                    className="h-full bg-turkcell-blue"
                    style={{ width: `${(Number(c.cnt) / maxCity) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right text-gray-300">{formatNum(c.cnt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-gray-900/70 border border-gray-800">
        <h2 className="font-semibold mb-4">Son Siparişler</h2>
        <table className="w-full text-sm">
          <thead className="text-gray-400 text-left border-b border-gray-800">
            <tr>
              <th className="pb-2">#</th>
              <th className="pb-2">Müşteri</th>
              <th className="pb-2">Tarih</th>
              <th className="pb-2">Durum</th>
              <th className="pb-2 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((o) => (
              <tr key={o.id} className="border-b border-gray-800/50">
                <td className="py-2 text-gray-500">{o.id}</td>
                <td className="py-2">{o.full_name}</td>
                <td className="py-2 text-gray-400">{formatDate(o.order_date)}</td>
                <td className="py-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLOR[o.status] ?? ''}`}>
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </td>
                <td className="py-2 text-right">{formatTRY(o.total_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
