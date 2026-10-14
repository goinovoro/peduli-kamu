# Deployment ke Vercel

Frontend dan API dapat dibuat sebagai dua project Vercel terpisah dari repository ini.

## Frontend

1. Import repository ke Vercel dan set **Root Directory** ke `frontend`.
2. Framework preset: **Nuxt.js**. Build: `npm run build`.
3. Set environment variables:
   - `NUXT_PUBLIC_API_BASE=https://<domain-api>/api/v1`
   - `NUXT_PUBLIC_SITE_URL=https://<domain-frontend>`

## Backend (NestJS Functions)

1. Buat project Vercel kedua dengan **Root Directory** `backend`.
2. Build script `vercel-build` men-generate Prisma Client lalu membangun NestJS.
3. Isi environment variables dari `backend/.env.example` di Vercel, minimal:
   - `DATABASE_URL` (URL PostgreSQL pooled untuk runtime)
   - `DIRECT_URL` (koneksi langsung untuk migrasi Prisma)
   - `JWT_SECRET` (secret kuat dan unik)
   - `FRONTEND_URL=https://<domain-frontend>`
- `COOKIE_SECURE=true`
4. Jalankan migrasi database sebelum menerima trafik: `npx prisma migrate deploy` dari folder `backend`.
5. Gunakan URL project API dengan prefix `/api/v1` sebagai `NUXT_PUBLIC_API_BASE` frontend.
6. Untuk autentikasi berbasis cookie, gunakan domain frontend dan API dalam satu domain induk (mis. `app.example.com` dan `api.example.com`).

## Penyimpanan file

Backend saat ini menyimpan dokumen, bukti pembayaran, dan foto absensi ke folder lokal `backend/uploads`. Filesystem function Vercel bersifat sementara, sehingga file upload tidak dapat diandalkan lintas invocation. Sebelum mengaktifkan upload pada deployment produksi, pindahkan penyimpanan file ke object storage persisten dan sesuaikan endpoint file.

File `.env`, `node_modules`, hasil build, dan `backend/uploads` sudah diabaikan oleh Git. File template `.env.example` tetap dapat di-push.
