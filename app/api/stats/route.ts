import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: cors });
}

export async function GET() {
  const [k] = await query(`
    SELECT
      (SELECT count(*) FROM customers)                                                AS customers,
      (SELECT count(*) FROM orders)                                                   AS orders,
      (SELECT COALESCE(sum(total_amount),0) FROM orders WHERE status <> 'cancelled')  AS revenue,
      (SELECT COALESCE(avg(total_amount),0) FROM orders WHERE status <> 'cancelled')  AS avg_order
  `);
  return NextResponse.json(k, { headers: cors });
}
