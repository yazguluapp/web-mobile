# web-mobile — Turkcell GCP Shop Demo

Next.js (App Router) e-ticaret demo uygulaması. Cloud Run üzerinde çalışır,
Cloud SQL (PostgreSQL) verisini gösterir, BigQuery + Looker Studio ile analiz edilir.

## Mimari

```
git push (main) → GitHub Actions (WIF) → Artifact Registry → Cloud Run (shop-web)
                                                                   │
                                              Cloud SQL (shop-sql, PostgreSQL)
                                                                   │ EXTERNAL_QUERY
                                              BigQuery (shop) → Looker Studio
```

## Yerel geliştirme

```bash
npm install

# Lokal Postgres ya da Cloud SQL Auth Proxy (127.0.0.1:5432) gerekir
export DB_HOST=127.0.0.1 DB_PORT=5432 DB_USER=shopuser DB_PASSWORD=*** DB_NAME=shop
npm run seed     # şema + 1000 müşteri + ürün + sipariş
npm run dev      # http://localhost:3000
```

## Ortam değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `INSTANCE_CONNECTION_NAME` | Cloud Run'da set → unix socket `/cloudsql/...` ile bağlanır |
| `DB_HOST` / `DB_PORT` | Lokal TCP bağlantısı (ICN yoksa) |
| `DB_USER` / `DB_NAME` | Veritabanı kullanıcı / isim |
| `DB_PASSWORD` | Cloud Run'da Secret Manager `shop-db-password` |

## CI/CD

`.github/workflows/deploy.yml` — `main`'e push → otomatik Cloud Run deploy.
GitHub repo **Actions variables** (Settings → Secrets and variables → Actions → Variables):

- `GCP_PROJECT_ID`
- `GCP_WIF_PROVIDER` (Workload Identity provider tam yolu)
- `GCP_SA_EMAIL` (`gh-deployer@<proje>.iam.gserviceaccount.com`)
