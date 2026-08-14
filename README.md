# URL Shortener + Analytics

Portofolio app untuk melamar posisi Fullstack Engineer (Node.js/TypeScript/React/Prisma/Redis/Docker).
Stack yang dipakai secara sengaja mencakup semua kualifikasi teknis di lowongan:

- **Backend**: Node.js, TypeScript, Express.js, Prisma ORM, PostgreSQL
- **Caching**: Redis — cache-aside pattern untuk redirect lookup, dengan cache invalidation saat url di-update/dihapus
- **Frontend**: React + TypeScript (Vite)
- **Deployment**: Docker + Docker Compose (Postgres, Redis, backend, frontend jadi satu stack)

## Fitur

- Buat short URL (custom code opsional)
- Redirect cepat lewat cache Redis, fallback ke database kalau cache miss
- Klik dicatat sebagai data analytics (timestamp, IP, user agent)
- Lihat analytics per short URL (total klik + 50 klik terakhir)
- Edit tujuan URL — otomatis invalidasi cache (single-url cache & list cache)
- Hapus short URL — otomatis invalidasi cache

## Cara menjelaskan cache invalidation ke interviewer

Endpoint `PUT /api/urls/:code` dan `DELETE /api/urls/:code` di
`backend/src/controllers/urlController.ts` menghapus key Redis terkait
(`url:<code>` dan `url:list`) setelah update ke database berhasil — supaya
request berikutnya tidak menyajikan data basi dari cache.

## Menjalankan dengan Docker (cara termudah)

```bash
docker-compose up --build
```

- Backend: http://localhost:4000
- Frontend: http://localhost:5173
- Postgres: localhost:5432
- Redis: localhost:6379

Backend otomatis menjalankan `prisma migrate deploy` saat container start.

## Menjalankan secara lokal (tanpa Docker)

Butuh PostgreSQL dan Redis yang sudah jalan (lokal atau via `docker-compose up postgres redis`).

```bash
# Backend
cd backend
cp .env.example .env   # sesuaikan DATABASE_URL / REDIS_URL kalau perlu
npm install
npx prisma migrate dev --name init
npm run dev

# Frontend (terminal baru)
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Struktur Proyek

```
url-shortener/
├── backend/
│   ├── src/
│   │   ├── controllers/urlController.ts   # logic CRUD + caching + invalidation
│   │   ├── routes/urls.ts
│   │   ├── lib/db.ts                      # Prisma client
│   │   ├── lib/redis.ts                   # Redis client + cache key helpers
│   │   └── utils/shortcode.ts
│   ├── prisma/schema.prisma                # model Url, Click
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   └── components/ (CreateForm, UrlList)
│   └── Dockerfile
└── docker-compose.yml
```

## API

| Method | Endpoint                     | Keterangan                          |
|--------|-------------------------------|--------------------------------------|
| POST   | /api/urls                    | Buat short url                       |
| GET    | /api/urls                    | List semua short url (cached)        |
| GET    | /api/urls/:code/analytics    | Detail klik per short url            |
| PUT    | /api/urls/:code              | Update tujuan url, invalidasi cache  |
| DELETE | /api/urls/:code              | Hapus url, invalidasi cache          |
| GET    | /:code                       | Redirect ke url asli (dicache)       |

## Catatan

`npx prisma generate` mengunduh binary engine dari internet saat pertama kali
dijalankan (`npm install` / `docker build`) — pastikan koneksi internet aktif
di lingkungan build.
