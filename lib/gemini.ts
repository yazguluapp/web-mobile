import { GoogleGenAI } from '@google/genai';

// Cloud SQL şeması — Gemini'ye NL→SQL için verilir.
const SCHEMA_DDL = `
customers(id int, full_name text, email text, city text, country text, created_at timestamptz)
products(id int, name text, category text, price numeric)
orders(id int, customer_id int -> customers.id, order_date timestamptz, status text ['delivered','shipped','processing','cancelled'], total_amount numeric)
order_items(id int, order_id int -> orders.id, product_id int -> products.id, quantity int, unit_price numeric)
`.trim();

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

let _ai: GoogleGenAI | null = null;
function ai(): GoogleGenAI {
  if (!_ai) {
    _ai = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    });
  }
  return _ai;
}

// Doğal dil → tek bir read-only SELECT
export async function nl2sql(question: string): Promise<string> {
  const systemInstruction = `Sen bir PostgreSQL uzmanısın. Verilen şemaya göre kullanıcının sorusunu yanıtlayacak TEK BİR read-only SELECT sorgusu üret.
Kurallar:
- Sadece SELECT (veya WITH ... SELECT). Veriyi değiştiren komut YOK.
- Sadece aşağıdaki tablo/kolonları kullan. En fazla 100 satır (LIMIT).
- order_date'e göre "en son" = ORDER BY ... DESC. Ciro = SUM(total_amount), iptaller hariç (status <> 'cancelled') uygun olduğunda.
- Açıklama YOK. Yanıt SADECE JSON: {"sql":"..."}

Şema:
${SCHEMA_DDL}`;

  const resp = await ai().models.generateContent({
    model: MODEL,
    contents: question,
    config: { systemInstruction, responseMimeType: 'application/json', temperature: 0 },
  });

  const txt = (resp.text ?? '').trim();
  let sql = '';
  try {
    sql = JSON.parse(txt).sql;
  } catch {
    const m = txt.match(/"sql"\s*:\s*"([\s\S]*?)"\s*}/);
    if (m) sql = m[1].replace(/\\"/g, '"').replace(/\\n/g, ' ');
  }
  if (!sql) throw new Error('SQL üretilemedi.');
  return sql;
}

// Sorgu sonucunu kısa Türkçe cevaba çevir
export async function summarize(question: string, rows: any[]): Promise<string> {
  if (!rows || rows.length === 0) return 'Bu soruya uygun kayıt bulunamadı.';
  const systemInstruction = `Kullanıcının sorusunu, verilen sorgu sonucuna dayanarak KISA ve net Türkçe yanıtla (1-3 cümle).
Parasal değerleri "₺" ve binlik ayraçla yaz. Tablo dökme, sadece cevabı söyle.`;
  const resp = await ai().models.generateContent({
    model: MODEL,
    contents: `Soru: ${question}\nSonuç (JSON): ${JSON.stringify(rows).slice(0, 4000)}`,
    config: { systemInstruction, temperature: 0.2 },
  });
  return (resp.text ?? '').trim() || 'Sonuç hazır.';
}
