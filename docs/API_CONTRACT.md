# Kontrak API PeduliKamu

**Sumber kebenaran utama: Swagger UI** — jalankan backend lalu buka:

- UI: `http://localhost:4000/api/docs`
- JSON: `http://localhost:4000/api/docs-json`

Dokumen ini hanya ringkasan aturan main; detail field/status/response ada di Swagger
(20 tag, 80+ endpoint, dibuat otomatis dari decorator `@Api*` di tiap controller).

## Base URL & Auth

- Base URL: `http://localhost:4000/api/v1` (production menyesuaikan; Swagger memakai server relatif `/api/v1` agar "Try it out" benar).
- Auth: cookie HttpOnly `pedulikamu_token` (diset saat register/login), fallback header `Authorization: Bearer <token>`.
- Guard: `JwtAuthGuard` (login) + `RolesGuard` (`PASIEN/MITRA/admin`, nilai lama `family/caregiver` tetap diterima).
- Akun `DIBLOKIR/DITANGGUHKAN/DIBEKUKAN` ditolak login (403).

## Kelompok Endpoint (tag Swagger)

| Tag | Prefix | Inti |
|---|---|---|
| files | `/files` | akses terautentikasi untuk dokumen, bukti pembayaran, dan foto absensi sesuai kepemilikan/pihak kontrak/admin |
| auth | `/auth` | register (role PASIEN/MITRA), login, logout, me |
| users | `/users` | list + ubah status akun (admin; tidak boleh akun sendiri) |
| consents | `/consents` | catat/lihat persetujuan ketentuan (idempotent) |
| caregivers | `/caregivers` | search publik, profil saya, ajukan verifikasi, antrian + putusan (admin) |
| documents | `/documents` | upload KTP/Ijazah/Sertifikat/STR (multipart), milik saya, antrian + review (admin) |
| deposits | `/deposits` | config nominal, bayar + bukti (nominal dikunci server), milik saya/status, antrian + verifikasi + refund + process-expiry (admin) |
| needs | `/needs` | buat (Draft), milik saya, publik (mitra deposit aktif), detail, ubah, publish, close |
| interests | `/interests` | lamar (anti-duplikat), terkirim, masuk per need, terima/tolak, batalkan |
| messages | `/messages` | kirim + thread (hanya setelah DITERIMA, hanya pihak terkait) |
| contracts | `/contracts` | buat Deal (totalCost = jam × tarif, dikunci server), milik saya, detail, start, finish, confirm, confirm-override, cancel-by-patient, misconduct (admin) |
| payments | `/payments` | config QRIS, bayar + bukti, milik saya, antrian + verifikasi, process-expiry (admin) |
| attendance | `/attendance` | clock-in/out (foto + GPS), list, rekap (floor 15 mnt), review pasien, override (admin) |
| payouts | `/payouts` | milik saya, antrian, detail, pay + bukti TF, hold, fail (admin) |
| reviews | `/reviews` | beri nilai (1× per layanan selesai), publik per mitra, moderasi (admin) |
| disputes | `/disputes` | lapor, milik saya, antrian, detail, tangani BARU→DITINJAU→BUTUH_INFO→SELESAI/DITUTUP (admin) |
| notifications | `/notifications` | milik saya, unread-count, tandai baca |
| admin | `/admin/stats` | pengguna, antrian, operasional, escrow (admin) |
| patients (legacy) | `/patients` | CRUD pasien lama (digantikan needs) |
| bookings (legacy) | `/bookings` | booking langsung lama (digantikan needs→contracts) |

## Aturan Uang (mengikat, dari `flowpembayaran-mitra-pasien.md`)

1. Pasien batal sepihak setelah Deal dibayar → **tanpa refund, full ke mitra** (`POST /contracts/:id/cancel-by-patient` → payout `PASIEN_BATAL`).
2. Mitra wanprestasi → **beku + deposit hangus + refund = jam-kurang × tarif** (`POST /contracts/:id/misconduct` + `workedHours`).
3. Deposit 2 bulan tanpa klien → **hangus, saldo 0, akun terkunci** (`POST /deposits/process-expiry`).
4. Upload file: JPG/PNG/PDF ≤ 5MB (absensi: JPG/PNG); file yatim otomatis dibersihkan saat validasi gagal. File privat dibaca via `/files/:folder/:filename`, bukan URL statis.
5. Kode status penting: `409` duplikat/transisi ilegal, `403` peran tertolak/deposit mati, `404` bukan milik Anda.

## Menambah Endpoint Baru

1. Tambah `@ApiTags` di controller, `@ApiOperation` + `@ApiResponse` di tiap route.
2. Tambah `@ApiProperty` di DTO (wajib agar contoh body muncul; field tanpa decorator ikut terbuang `whitelist`).
3. Upload: `@ApiConsumes('multipart/form-data')` + `@ApiBody({ schema: { ..., required: [...] } })` — `required` di dalam `schema`.
4. `npm run build` + cek `GET /api/docs-json` memuat path baru.
