import { NextResponse } from 'next/server';
import { nl2sql, summarize } from '@/lib/gemini';
import { sanitizeSelect } from '@/lib/sql-guard';
import { queryRO } from '@/lib/db-readonly';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: cors });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const question = typeof body?.question === 'string' ? body.question.trim() : '';
    if (!question) {
      return NextResponse.json({ error: 'Soru gerekli.' }, { status: 400, headers: cors });
    }

    // 1) NL → SQL (Gemini)
    const rawSql = await nl2sql(question);
    // 2) Güvenlik doğrulaması (SELECT-only)
    const sql = sanitizeSelect(rawSql);
    // 3) Read-only kullanıcıyla çalıştır
    const rows = await queryRO(sql);
    // 4) Türkçe özet (Gemini)
    const answer = await summarize(question, rows);

    return NextResponse.json({ answer, sql, rows: rows.slice(0, 50) }, { headers: cors });
  } catch (e: any) {
    // Demo dostu hata: 200 ile nazik mesaj döndür
    return NextResponse.json(
      { answer: 'Üzgünüm, bu soruyu yanıtlayamadım. Farklı ifade etmeyi dener misin?', error: String(e?.message || e) },
      { status: 200, headers: cors },
    );
  }
}
