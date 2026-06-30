import type { Metadata } from 'next';
import './globals.css';
import Nav from './components/Nav';

export const metadata: Metadata = {
  title: 'Shop Demo — Turkcell GCP Lab',
  description: 'Cloud Run + Cloud SQL + BigQuery e-ticaret demo dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen font-sans">
        <Nav />
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
        <footer className="border-t border-gray-800 py-6 text-center text-gray-500 text-sm">
          Turkcell GCP Eğitim · Cloud Run + Cloud SQL + BigQuery · Demo ortamı
        </footer>
      </body>
    </html>
  );
}
