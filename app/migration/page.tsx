import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VM Migration — GCP | Turkcell Shop Demo',
  description: 'AWS, VMware, Azure ve Hyper-V\'den Google Cloud\'a VM taşıma yöntemleri, karar matrisi ve gerçek senaryolar.',
};

/* ---------- küçük yardımcı bileşenler ---------- */

function Section({ id, title, kicker, children }: { id: string; title: string; kicker?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-5">
      <div className="border-b border-gray-800 pb-3">
        {kicker ? <p className="text-turkcell-yellow text-xs font-semibold uppercase tracking-wider">{kicker}</p> : null}
        <h2 className="text-xl md:text-2xl font-bold mt-1">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Badge({ children, color = 'gray' }: { children: React.ReactNode; color?: 'gray' | 'yellow' | 'blue' | 'orange' | 'green' }) {
  const map: Record<string, string> = {
    gray: 'bg-gray-800 text-gray-300',
    yellow: 'bg-turkcell-yellow/20 text-turkcell-yellow',
    blue: 'bg-blue-500/20 text-blue-300',
    orange: 'bg-orange-500/20 text-orange-300',
    green: 'bg-green-500/20 text-green-300',
  };
  return <span className={`inline-block text-xs px-2.5 py-1 rounded-full ${map[color]}`}>{children}</span>;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="text-[12px] leading-relaxed text-cyan-300 bg-black/40 border border-gray-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono">
      {children}
    </pre>
  );
}

/* ---------- veri ---------- */

const STRATEGIES = [
  { r: 'Rehost', d: 'Olduğu gibi taşı (lift & shift)', gcp: 'Migrate to VMs, disk import', hot: true },
  { r: 'Replatform', d: 'Küçük iyileştirmeyle taşı', gcp: 'MIG, Cloud SQL' },
  { r: 'Refactor', d: 'Bulut-native\'e dönüştür', gcp: 'GKE, Cloud Run' },
  { r: 'Repurchase', d: 'SaaS\'a geç', gcp: '—' },
  { r: 'Retire', d: 'Kapat', gcp: '—' },
  { r: 'Retain', d: 'Şimdilik bırak (hybrid)', gcp: 'Interconnect/VPN' },
];

const M2VM_STEPS = [
  { n: 1, t: 'Source ekle', d: 'Kaynak ortamı bağla (vCenter / AWS / Azure)' },
  { n: 2, t: 'Migration oluştur', d: 'VM\'leri seç, hedef proje/zone/makine tipi' },
  { n: 3, t: 'Replication', d: 'Diskler sürekli kopyalanır (kaynak çalışır)' },
  { n: 4, t: 'Test-clone', d: 'Hedefte deneme kopyası → uygulama testi' },
  { n: 5, t: 'Cut-over', d: 'Kaynağı durdur → son senkron → CE instance' },
  { n: 6, t: 'Temizlik', d: 'Migration kaynaklarını ve eski ortamı kaldır' },
];

const SOURCES = [
  {
    name: 'AWS EC2', color: 'orange' as const,
    rec: 'M2VM AWS source (connector VM + IAM rolleri)',
    alt: 'Manuel: AMI → VMDK export → S3 → GCS → images import',
    note: 'Çok VM ve süreklilik için M2VM.',
  },
  {
    name: 'VMware (on-prem)', color: 'gray' as const,
    rec: 'M2VM agentless (vCenter bağlantısı, VPN/Interconnect)',
    alt: 'Tüm yığını olduğu gibi: Google Cloud VMware Engine (GCVE) + HCX',
    note: 'Ajan kurmadan; en yaygın senaryo.',
  },
  {
    name: 'Azure', color: 'blue' as const,
    rec: 'M2VM Azure source (connector + izinler)',
    alt: 'Manuel: VHD export → GCS → images import',
    note: 'Süreç AWS ile aynı.',
  },
  {
    name: 'Hyper-V (on-prem)', color: 'green' as const,
    rec: 'Sanal disk import: VHD/VHDX → GCS → gcloud compute images import',
    alt: 'M2VM doğrudan Hyper-V kaynağı DEĞİL',
    note: 'BYOL lisans notunu unutma.',
  },
];

const SERVICES = [
  ['Migrate to Virtual Machines', 'VM taşıma (ana araç, ücretsiz)'],
  ['Sanal disk import', 'VMDK/VHD/VHDX/RAW → CE imajı'],
  ['Migrate to Containers', 'VM → GKE/konteyner (modernizasyon)'],
  ['Database Migration Service', 'MySQL/PostgreSQL/SQL Server → Cloud SQL'],
  ['Storage Transfer / Appliance', 'Büyük veri (online/offline)'],
  ['Cloud VMware Engine (GCVE)', 'Tüm VMware yığınını taşı'],
  ['Bare Metal Solution', 'Oracle vb. özel donanım'],
];

const SCENARIOS = [
  {
    tag: 'VMware · ~50 VM', color: 'gray' as const,
    title: 'On-prem VMware, ~50 VM, minimum downtime',
    durum: 'Müşterinin veri merkezinde vSphere üzerinde ~50 üretim VM\'i var; kesinti penceresi çok dar.',
    yaklasim: 'M2VM agentless ile vCenter\'a bağlan, VM\'leri dalgalar (waves) halinde taşı. Sürekli replikasyon açıkken uygulamalar çalışmaya devam eder; her dalga için test-clone ile doğrula, sonra kısa cut-over.',
    servisler: ['Migrate to Virtual Machines', 'Cloud VPN / Interconnect', 'Compute Engine', 'VPC', 'MIG (opsiyonel)'],
    adimlar: [
      'On-prem → GCP ağ (Cloud VPN veya Interconnect)',
      'vSphere source ekle, VM\'leri keşfet',
      'Kritik olmayan dalgayla başla → replication',
      'Test-clone\'da uygulama testi',
      'Cut-over (kısa downtime) → sonraki dalga',
    ],
    downtime: 'Cut-over anında dakikalar (son senkron + boot).',
  },
  {
    tag: 'AWS · 10 EC2 + MySQL', color: 'orange' as const,
    title: 'AWS\'de 10 EC2 (Linux web) + MySQL, tek platforma toplama',
    durum: 'Web katmanı 10 EC2\'de, veritabanı EC2 üzerinde self-managed MySQL. Müşteri operasyonu tek bulutta toplamak ve DB\'yi yönetimden çıkarmak istiyor.',
    yaklasim: 'Web VM\'lerini M2VM AWS source ile Compute Engine\'e taşı. MySQL\'i VM olarak taşımak yerine Database Migration Service ile Cloud SQL\'e migrate et (managed, replatform).',
    servisler: ['Migrate to Virtual Machines', 'Database Migration Service', 'Cloud SQL', 'Cloud VPN', 'Compute Engine'],
    adimlar: [
      'AWS source + connector (IAM) kur',
      'Web EC2\'leri replication → test-clone → cut-over',
      'DMS ile MySQL → Cloud SQL (sürekli replikasyon)',
      'Uygulama bağlantı stringlerini Cloud SQL\'e çevir',
      'DB cut-over → doğrulama → AWS decommission',
    ],
    downtime: 'Web için cut-over dakikaları; DB için DMS ile minimum.',
  },
  {
    tag: 'Hyper-V · birkaç VM', color: 'green' as const,
    title: 'On-prem Hyper-V, birkaç Windows VM, tek seferlik taşıma',
    durum: 'Küçük bir Hyper-V ortamında 3-4 Windows Server VM\'i; süreklilik değil, tek seferlik taşıma yeterli.',
    yaklasim: 'Hyper-V M2VM kaynağı olmadığı için sanal disk import. Her VM\'in VHD/VHDX diskini al, GCS\'e yükle, imaja çevir, instance oluştur.',
    servisler: ['Cloud Storage', 'Cloud Build (import motoru)', 'Compute Engine'],
    adimlar: [
      'VM\'i kapat, VHD/VHDX diskini al (gerekirse VHDX→VHD)',
      'gsutil ile GCS\'e yükle',
      'gcloud compute images import ... --os=windows-2022',
      'İmajdan Compute Engine instance oluştur',
      'Windows lisans (BYOL) ve sürücüleri doğrula',
    ],
    downtime: 'Tam kesinti (offline kopya) — küçük ortam için kabul edilebilir.',
  },
];

const SOURCES_LINKS = [
  ['Migrate to VMs — Dokümanlar', 'https://docs.cloud.google.com/migrate/virtual-machines/docs/5.0'],
  ['Ürün sayfası', 'https://cloud.google.com/products/cloud-migration/virtual-machines'],
  ['AWS source oluşturma', 'https://docs.cloud.google.com/migrate/virtual-machines/docs/5.0/migrate/create-an-aws-source'],
  ['VM\'leri taşıma', 'https://docs.cloud.google.com/migrate/virtual-machines/docs/5.0/migrate/migrating-vms'],
  ['Desteklenen OS', 'https://docs.cloud.google.com/migrate/virtual-machines/docs/5.0/discover/supported-os-versions'],
];

const NAV = [
  ['#stratejiler', 'Stratejiler'],
  ['#m2vm', 'M2VM'],
  ['#kaynaklar', 'Kaynaklar'],
  ['#matris', 'Karar Matrisi'],
  ['#senaryolar', 'Senaryolar'],
  ['#servisler', 'Servisler'],
];

/* ---------- sayfa ---------- */

export default function MigrationPage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-black/40 border border-gray-800 p-8">
        <p className="text-turkcell-yellow text-sm font-semibold uppercase tracking-wide">Google Cloud</p>
        <h1 className="text-3xl md:text-4xl font-bold mt-2">GCP&apos;ye VM Migration</h1>
        <p className="text-gray-400 mt-3 max-w-2xl">
          AWS, VMware (on-prem), Azure ve Hyper-V ortamlarındaki sanal makineleri Google Cloud&apos;a taşıma
          yöntemleri, karar matrisi ve gerçek müşteri senaryoları. Odak: <strong className="text-gray-200">rehost (lift &amp; shift)</strong>.
        </p>
        <div className="flex flex-wrap gap-2 mt-5">
          {NAV.map(([href, label]) => (
            <a key={href} href={href} className="text-xs px-3 py-1.5 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 transition">
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* 6R */}
      <Section id="stratejiler" kicker="Önce strateji" title="6R Migration Modeli">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STRATEGIES.map((s) => (
            <div
              key={s.r}
              className={`p-5 rounded-xl border ${s.hot ? 'border-turkcell-yellow/50 bg-turkcell-yellow/5' : 'border-gray-800 bg-gray-900/60'}`}
            >
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{s.r}</h3>
                {s.hot ? <Badge color="yellow">bu doküman</Badge> : null}
              </div>
              <p className="text-gray-400 text-sm mt-1">{s.d}</p>
              <p className="text-gray-500 text-xs mt-2">GCP: {s.gcp}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* M2VM */}
      <Section id="m2vm" kicker="Ana araç" title="Migrate to Virtual Machines (M2VM 5.0)">
        <p className="text-gray-400 text-sm max-w-3xl">
          Google Cloud&apos;un birincil VM taşıma servisi. VM taşıma <strong className="text-gray-200">ücretsizdir</strong>;
          yalnızca kaynak taraftaki egress ve hedefteki Compute Engine kaynakları ücretlendirilir.
        </p>
        <div className="flex flex-wrap gap-2">
          {['Agentless', 'Ücretsiz', 'Sürekli replikasyon', 'CMEK', 'BIOS→UEFI', '200 eşzamanlı migration'].map((f) => (
            <Badge key={f} color="yellow">{f}</Badge>
          ))}
        </div>
        {/* stepper */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {M2VM_STEPS.map((s) => (
            <div key={s.n} className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-turkcell-yellow text-turkcell-navy font-bold flex items-center justify-center">
                {s.n}
              </div>
              <div>
                <p className="font-semibold text-sm">{s.t}</p>
                <p className="text-gray-400 text-xs mt-0.5">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Kaynaklar */}
      <Section id="kaynaklar" kicker="Kaynak bazında" title="Nereden nasıl taşınır?">
        <div className="grid md:grid-cols-2 gap-4">
          {SOURCES.map((s) => (
            <div key={s.name} className="p-5 rounded-xl bg-gray-900/60 border border-gray-800 space-y-2">
              <Badge color={s.color}>{s.name}</Badge>
              <p className="text-sm"><span className="text-turkcell-yellow">Önerilen:</span> {s.rec}</p>
              <p className="text-sm text-gray-400"><span className="text-gray-300">Alternatif:</span> {s.alt}</p>
              <p className="text-xs text-gray-500">{s.note}</p>
            </div>
          ))}
        </div>
        <div className="mt-2">
          <p className="text-sm font-semibold mb-2">Örnek: sanal disk import (Hyper-V / fiziksel / diğer)</p>
          <Code>{`gsutil cp disk.vhd gs://<bucket>/
gcloud compute images import my-imported-vm \\
  --source-file=gs://<bucket>/disk.vhd \\
  --os=windows-2022
# imajdan Compute Engine instance oluştur`}</Code>
        </div>
      </Section>

      {/* Karar matrisi */}
      <Section id="matris" kicker="Hızlı seçim" title="Karar Matrisi">
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-black/30 text-gray-400 text-left">
              <tr>
                <th className="px-4 py-3">Kaynak</th>
                <th className="px-4 py-3">Az sayıda VM</th>
                <th className="px-4 py-3">Çok VM / süreklilik</th>
                <th className="px-4 py-3">Ekstra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {[
                ['AWS EC2', 'Manuel image import', 'M2VM AWS source', '—'],
                ['VMware on-prem', 'Image import (VMDK)', 'M2VM agentless', 'GCVE (HCX)'],
                ['Azure', 'Image import (VHD)', 'M2VM Azure source', '—'],
                ['Hyper-V', 'Sanal disk import', 'İmaj pipeline', '—'],
                ['Fiziksel / diğer', 'Sanal disk import', '—', 'Migrate to Containers'],
              ].map((row) => (
                <tr key={row[0]} className="hover:bg-gray-800/30">
                  <td className="px-4 py-2.5 font-medium">{row[0]}</td>
                  <td className="px-4 py-2.5 text-gray-400">{row[1]}</td>
                  <td className="px-4 py-2.5 text-turkcell-yellow">{row[2]}</td>
                  <td className="px-4 py-2.5 text-gray-400">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Senaryolar */}
      <Section id="senaryolar" kicker="Gerçek dünya" title="Müşteri Senaryoları">
        <div className="space-y-5">
          {SCENARIOS.map((sc) => (
            <div key={sc.title} className="rounded-xl bg-gray-900/60 border border-gray-800 p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge color={sc.color}>{sc.tag}</Badge>
                <h3 className="font-semibold text-lg">{sc.title}</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Durum</p>
                  <p className="text-gray-300">{sc.durum}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Yaklaşım</p>
                  <p className="text-gray-300">{sc.yaklasim}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Gereken GCP servisleri</p>
                <div className="flex flex-wrap gap-2">
                  {sc.servisler.map((s) => <Badge key={s} color="yellow">{s}</Badge>)}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Adımlar</p>
                  <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                    {sc.adimlar.map((a, i) => <li key={i}>{a}</li>)}
                  </ol>
                </div>
                <div className="self-start rounded-lg bg-black/30 border border-gray-800 p-3">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Downtime</p>
                  <p className="text-sm text-gray-300">{sc.downtime}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Servisler */}
      <Section id="servisler" kicker="Araç kutusu" title="İlgili GCP Göç Servisleri">
        <div className="grid sm:grid-cols-2 gap-3">
          {SERVICES.map(([name, desc]) => (
            <div key={name} className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
              <p className="font-semibold text-sm text-turkcell-yellow">{name}</p>
              <p className="text-gray-400 text-sm mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Dikkat + Kaynaklar */}
      <Section id="notlar" kicker="Planlama" title="Dikkat Edilecekler & Kaynaklar">
        <div className="grid md:grid-cols-2 gap-6">
          <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
            <li><strong>OS desteği:</strong> kaynak OS&apos;in desteklendiğini doğrula</li>
            <li><strong>Lisans:</strong> BYOL vs PAYG (özellikle Windows/RHEL)</li>
            <li><strong>Ağ:</strong> Cloud VPN/Interconnect, connector erişimi, firewall</li>
            <li><strong>Cut-over:</strong> IP/DNS değişimi, kısa downtime planı</li>
            <li><strong>Doğrulama:</strong> test-clone ile uygulamayı kanıtla</li>
            <li><strong>Maliyet:</strong> M2VM ücretsiz; egress + CE kaynakları ücretli</li>
            <li><strong>Dalgalar:</strong> bağımlılığa göre wave&apos;ler halinde taşı</li>
          </ul>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Resmi dokümanlar</p>
            {SOURCES_LINKS.map(([label, url]) => (
              <a key={url} href={url} target="_blank" rel="noreferrer"
                 className="block text-sm text-turkcell-blue hover:underline">
                → {label}
              </a>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
