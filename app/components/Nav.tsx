import Link from 'next/link';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/customers', label: 'Müşteriler' },
  { href: '/orders', label: 'Siparişler' },
  { href: '/chat', label: 'AI Chat' },
];

export default function Nav() {
  return (
    <header className="border-b border-gray-800 bg-black/20">
      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-block w-3 h-3 rounded-full bg-turkcell-yellow" />
          <span className="font-semibold text-lg">Turkcell GCP Class· Shop Demo</span>
        </div>
        <nav className="flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
