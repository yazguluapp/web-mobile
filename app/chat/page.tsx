'use client';

import { useEffect, useRef, useState } from 'react';

type Msg = { id: string; role: 'user' | 'ai'; text: string; sql?: string };

const SUGGESTIONS = [
  'En çok hangi ilde satış olmuş?',
  'En son kayıt olan 3 müşteri kim?',
  'En çok satan 5 ürün nedir?',
  'İptal edilen sipariş sayısı kaç?',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 'intro',
      role: 'ai',
      text: 'Merhaba! Verilere doğal dilde soru sorabilirsin. Örnek soruları deneyebilir veya kendi sorunu yazabilirsin — Gemini sorunu SQL\'e çevirip Cloud SQL\'den yanıtlar.',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [showSql, setShowSql] = useState<Record<string, boolean>>({});
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (q?: string) => {
    const question = (q ?? input).trim();
    if (!question || busy) return;
    setInput('');
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: 'user', text: question }]);
    setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { id: `a${Date.now()}`, role: 'ai', text: data.answer || 'Sonuç bulunamadı.', sql: data.sql },
      ]);
    } catch {
      setMessages((m) => [...m, { id: `e${Date.now()}`, role: 'ai', text: 'Bağlantı hatası.' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">AI Chat</h1>
        <p className="text-gray-400 text-sm mt-1">
          Gemini (Vertex AI) → SQL → Cloud SQL · sadece-okuma, güvenli.
        </p>
      </div>

      {/* mesajlar */}
      <div className="rounded-xl bg-gray-900/50 border border-gray-800 p-4 min-h-[360px] flex flex-col gap-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
              m.role === 'user'
                ? 'self-end bg-turkcell-blue text-white'
                : 'self-start bg-gray-900 border border-gray-800 text-gray-100'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{m.text}</p>
            {m.sql ? (
              <div className="mt-2">
                <button
                  onClick={() => setShowSql((p) => ({ ...p, [m.id]: !p[m.id] }))}
                  className="text-turkcell-yellow text-xs hover:underline"
                >
                  {showSql[m.id] ? '▾ SQL gizle' : '▸ SQL göster'}
                </button>
                {showSql[m.id] ? (
                  <pre className="mt-2 text-[11px] text-cyan-300 bg-black/40 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                    {m.sql}
                  </pre>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
        {busy ? (
          <div className="self-start text-gray-500 text-sm animate-pulse">Düşünüyor…</div>
        ) : null}
        <div ref={endRef} />
      </div>

      {/* öneri çipleri */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            disabled={busy}
            className="text-xs px-3 py-1.5 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 transition"
          >
            {q}
          </button>
        ))}
      </div>

      {/* input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Veriye bir soru sor…"
          disabled={busy}
          className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-turkcell-yellow"
        />
        <button
          type="submit"
          disabled={busy}
          className="bg-turkcell-yellow text-turkcell-navy font-semibold px-6 rounded-lg hover:brightness-110 disabled:opacity-50 transition"
        >
          Gönder
        </button>
      </form>
    </div>
  );
}
