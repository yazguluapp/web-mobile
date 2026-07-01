import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PPT Sunum — GCP Presales Workshop | Turkcell',
  description: 'GCP Presales Workshop sunumu — görüntüle ve indir.',
};

const PDF = '/gcp-presales-workshop.pdf';

export default function SunumPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-turkcell-yellow text-xs font-semibold uppercase tracking-wider">Sunum</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">GCP Presales Workshop</h1>
          <p className="text-gray-400 text-sm mt-2 max-w-2xl">
            Turkcell GCP eğitim/presales sunumu. Aşağıdan görüntüleyebilir veya PDF olarak indirebilirsin.
          </p>
          <p className="text-gray-500 text-xs mt-2">PDF · ~4 MB</p>
        </div>
        <div className="flex gap-2">
          <a
            href={PDF}
            download="GCP_Presales_Workshop.pdf"
            className="inline-block bg-turkcell-yellow text-turkcell-navy font-semibold px-6 py-3 rounded-lg hover:brightness-110 transition"
          >
            ⬇ PDF&apos;i indir
          </a>
          <a
            href={PDF}
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-gray-800 text-gray-200 font-medium px-5 py-3 rounded-lg hover:bg-gray-700 transition"
          >
            Yeni sekmede aç
          </a>
        </div>
      </div>

      {/* Satır içi önizleme */}
      <div className="rounded-xl overflow-hidden border border-gray-800 bg-black/30">
        <iframe
          src={`${PDF}#view=FitH`}
          title="GCP Presales Workshop Sunumu"
          className="w-full h-[80vh]"
        />
      </div>

      <p className="text-gray-500 text-xs text-center">
        Önizleme açılmazsa yukarıdaki <strong className="text-gray-300">PDF&apos;i indir</strong> butonunu kullan.
      </p>
    </div>
  );
}
