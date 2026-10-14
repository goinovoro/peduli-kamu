# Peduli Kamu — Feature Checklist + Kriteria Lulus Testing

Sumber kebenaran: `docs/FLOWUSER-PASIEN.md`, `docs/FLOWMITRA-PERAWAT.md`, `docs/FLOWADMIN.md`, `docs/FLOWTambahan.md`, `docs/flowpembayaran-mitra-pasien.md`.

## Cara pakai

1. Setiap fitur **wajib lulus semua kriteria testing** sebelum checklist dicentang.
2. Cara centang: ubah `- [ ]` menjadi `- [x]` + tulis tanggal & penguji, contoh: `- [x] F-01 ... (lulus 2026-09-24, QA: Budi)`.
3. Jika ada kriteria gagal → jangan centang, buat bug + ulangi testing fitur itu dari awal.
4. Urutan build yang disarankan: A → B → C → D → E → F → G → H → I → J → K → L → M → N → O → P.
5. Aturan uang yang mengikat (dari `flowpembayaran-mitra-pasien.md`):
   - Pasien batal sepihak setelah Deal → **tanpa refund + dana full ke Mitra sebagai gaji** (`#6.1`).
   - Mitra wanprestasi → **akun dibekukan s.d. bulan deposit berikutnya + deposit hangus + refund pasien = missingHours x hourlyRate** (`#6.2`).
   - Deposit 2 bulan tanpa klien → **hangus, saldo periode berikut = 0, akun terkunci** (`#5.2`).

**Legenda status:** `- [ ]` belum lulus · `- [x]` lulus testing

---

## A. Auth, Akun & Profil Dasar

- [ ] **A-01 Registrasi Pasien** — Ref: `FLOWUSER-PASIEN.md #2`
  - Lulus jika: bisa daftar dengan nama + telepon + email + password + foto; email duplikat ditolak; password di-hash; status awal `Belum Lengkap`; login langsung bisa setelah daftar.
- [ ] **A-02 Registrasi Mitra** — Ref: `FLOWMITRA-PERAWAT.md #2`
  - Lulus jika: field sama dengan A-01; akun baru belum bisa lihat kebutuhan sebelum verifikasi + deposit; ada penanda role `MITRA`.
- [ ] **A-03 Login / Logout (Pasien, Mitra, Admin)** — Ref: `FLOWADMIN.md #3`
  - Lulus jika: login email+password benar berhasil; salah ditolak dengan pesan aman; logout menghapus sesi; akses halaman terproteksi tanpa login dialihkan ke login.
- [ ] **A-04 Lengkapi Profil Pasien** — Ref: `FLOWUSER-PASIEN.md #3`
  - Lulus jika: bisa simpan nama, foto, telepon, email, alamat, kota, wilayah, kontak darurat; data tampil di dashboard; validasi telepon & wajib isi diterapkan.
- [ ] **A-05 Status Akun (Pasien)** — Ref: `FLOWUSER-PASIEN.md #2`, `FLOWADMIN.md #17`
  - Lulus jika: status `Belum Lengkap / Aktif / Tidak Aktif / Ditangguhkan` berjalan; akun non-Aktif tidak bisa buat kebutuhan / bayar.
- [ ] **A-06 Single User + Role (fondasi ERD)** — Ref: `FLOWADMIN.md #23`
  - Lulus jika: satu tabel `User` dengan role `PASIEN / MITRA / ADMIN`; tidak ada duplikasi akun per role; admin dibuat via seed/internal, bukan registrasi publik.

## B. Profil Profesional, Dokumen & Verifikasi Mitra

- [ ] **B-01 Profil Profesional Mitra** — Ref: `FLOWMITRA-PERAWAT.md #3`, `FLOWTambahan.md #19-20`
  - Lulus jika: bisa simpan domisili, wilayah layanan, pendidikan, pengalaman, kompetensi, sertifikasi, STR, bio (siapa/pengalaman/keahlian/pendekatan); tampil di preview profil publik.
- [ ] **B-02 Upload Dokumen (KTP/Ijazah/Sertifikat/STR)** — Ref: `FLOWMITRA-PERAWAT.md #4`
  - Lulus jika: upload multi-file tersimpan; tipe/ukuran divalidasi; dokumen hanya bisa dilihat pemilik + Admin; file rusak ditolak.
- [ ] **B-03 Ajukan Verifikasi** — Ref: `FLOWMITRA-PERAWAT.md #5`
  - Lulus jika: tombol ajukan hanya aktif jika profil + dokumen lengkap; status jadi `Menunggu Verifikasi`; pengajuan ganda dicegah.
- [ ] **B-04 Verifikasi Admin (Setuju / Tolak / Perlu Perbaikan)** — Ref: `FLOWMITRA-PERAWAT.md #5-6`, `FLOWADMIN.md #6`, `FLOWTambahan.md #4`
  - Lulus jika: Admin lihat dokumen + data; bisa setujui / tolak + alasan / minta perbaikan + catatan field; status berubah sesuai; Mitra dapat notifikasi + tahu field yang harus diperbaiki.
- [ ] **B-05 Persetujuan Regulasi Mitra** — Ref: `FLOWTambahan.md #3`
  - Lulus jika: Mitra wajib centang Setuju ketentuan, kode etik, pelayanan, komunikasi, privasi, pembatalan, pembayaran, sengketa + timestamp persetujuan tersimpan; tanpa setuju tidak bisa lanjut aktivasi.

## C. Deposit / Commitment Fee 2 Bulan

- [ ] **C-01 Bayar Deposit via QRIS + Upload Bukti** — Ref: `flowpembayaran-mitra-pasien.md #5.3`
  - Lulus jika: tampil QRIS statis + nominal deposit; Mitra bisa upload bukti; status `MENUNGGU_VERIFIKASI`; tanpa bukti tidak bisa aktif.
- [ ] **C-02 Verifikasi Deposit oleh Admin** — Ref: `flowpembayaran-mitra-pasien.md #5.3`, `FLOWADMIN.md #7`
  - Lulus jika: Admin bisa setujui/tolak + alasan; yang disetujui jadi `AKTIF` + `periodStart/periodEnd` terisi 2 bulan; yang ditolak bisa upload ulang.
- [ ] **C-03 Masa Aktif 2 Bulan** — Ref: `flowpembayaran-mitra-pasien.md #5.1`
  - Lulus jika: akun Aktif bisa lihat kebutuhan + ajukan minat selama 2 bulan; tanggal kedaluwarsa konsisten (acuan `verifiedAt` sesuai keputusan produk).
- [ ] **C-04 Kunci Otomatis Bulan Ke-3** — Ref: `flowpembayaran-mitra-pasien.md #5.1`
  - Lulus jika: lewat expiry tanpa deposit baru → akun terkunci (tidak bisa lihat/apply kebutuhan baru); layanan Deal berjalan tetap bisa diselesaikan; ada banner + ajakan bayar deposit baru.
- [ ] **C-05 Tanpa Klien 2 Bulan → Hangus, Saldo Berikutnya 0** — Ref: `flowpembayaran-mitra-pasien.md #5.2`
  - Lulus jika: 0 Deal Dibayar dalam periode → status `HANGUS_TERTANAM`; tidak bisa ditarik; saldo periode berikut 0 (tidak akumulasi); wajib bayar baru penuh dari nol.
- [ ] **C-06 Ada Klien → Deposit Dikembalikan Awal Bulan 3 (tapi wajib bayar baru)** — Ref: `flowpembayaran-mitra-pasien.md #5.2`
  - Lulus jika: ≥1 Deal Dibayar → deposit lama `DIKEMBALIKAN` via TF manual + bukti; akun tetap terkunci sampai deposit baru dibayar (terjadi 2 transaksi berlawanan arah).
- [ ] **C-07 Definisi "Ada Klien"** — Ref: `flowpembayaran-mitra-pasien.md #5.2`
  - Lulus jika: hanya Deal dengan `Payment Dibayar` yang dihitung; minat tanpa Deal tidak dihitung; ada test untuk kedua kasus.

## D. Kebutuhan Pasien

- [ ] **D-01 Buat Kebutuhan (Draft)** — Ref: `FLOWUSER-PASIEN.md #4`
  - Lulus jika: bisa simpan jenis layanan, untuk siapa, lokasi, tanggal mulai, jadwal, durasi, frekuensi, kondisi, kebutuhan khusus, anggaran, deskripsi; tersimpan sebagai `Draft`.
- [ ] **D-02 Publikasi Kebutuhan (Draft → Dipublikasikan)** — Ref: `FLOWUSER-PASIEN.md #5`
  - Lulus jika: ada preview sebelum kirim; setelah kirim status Dipublikasikan + muncul ke Mitra Aktif; draft tidak muncul ke Mitra.
- [ ] **D-03 Tutup / Batalkan Kebutuhan Sebelum Deal** — Ref: `FLOWUSER-PASIEN.md #19, #27`
  - Lulus jika: kebutuhan Aktif tanpa Deal bisa ditutup dengan konfirmasi; status `Dibatalkan`; tidak ada konsekuensi uang.
- [ ] **D-04 List & Detail Kebutuhan (sisi Mitra Aktif)** — Ref: `FLOWMITRA-PERAWAT.md #8-9`, `FLOWADMIN.md #8`
  - Lulus jika: Mitra Aktif bisa filter (wilayah/jenis/jadwal/durasi/kompetensi/anggaran); detail tampil tanpa data sensitif berlebih; akun terkunci/beku tidak bisa akses.

## E. Minat Mitra

- [ ] **E-01 Ajukan Minat** — Ref: `FLOWMITRA-PERAWAT.md #10`
  - Lulus jika: Mitra Aktif bisa kirim perkenalan + pengalaman relevan + kompetensi + ketersediaan; satu kebutuhan satu minat aktif per Mitra (anti-duplikat).
- [ ] **E-02 List Minat Masuk (sisi Pasien)** — Ref: `FLOWUSER-PASIEN.md #6-7`
  - Lulus jika: Pasien lihat jumlah + profil, pengalaman, pendidikan, sertifikasi, rating, review, wilayah; bisa buka profil sebelum aksi.
- [ ] **E-03 Terima / Tolak / Batalkan Minat** — Ref: `FLOWUSER-PASIEN.md #7-8, #26`, `FLOWMITRA-PERAWAT.md #11-12, #32-33`
  - Lulus jika: status `Menunggu Respon / Diterima / Ditolak / Dibatalkan` berjalan; yang diterima lanjut ke Kontak; yang ditolak tidak memblokir minat lain; kebutuhan tetap Aktif untuk Mitra lain.

## F. Kontak, Negosiasi & Deal

- [ ] **F-01 Kontak via Platform Setelah Minat Diterima** — Ref: `FLOWUSER-PASIEN.md #9`, `FLOWMITRA-PERAWAT.md #13`, `FLOWTambahan.md #6`
  - Lulus jika: chat hanya terbuka setelah minat Diterima; bahas kondisi/jadwal/lokasi/durasi/tugas/biaya; sesuai etika + privasi (tidak ada penyalahgunaan data).
- [ ] **F-02 Negosiasi (jadwal, durasi, frekuensi, lokasi, scope, biaya, mulai, pembatalan)** — Ref: `FLOWUSER-PASIEN.md #10`, `FLOWMITRA-PERAWAT.md #14`
  - Lulus jika: revisi tercatat; kedua pihak bisa setuju/adjust sampai Deal; tidak bisa loncat ke bayar tanpa Deal.
- [ ] **F-03 Deal & Kunci Kontrak** — Ref: `FLOWUSER-PASIEN.md #11`, `FLOWMITRA-PERAWAT.md #15`, `flowpembayaran-mitra-pasien.md #3.1`
  - Lulus jika: kontrak berisi pasien+mitra, jenis, jadwal, durasi/hari, frekuensi, total jam, tanggal mulai/selesai, lokasi (+lat/lng jika dipakai absensi), scope, total biaya (gross), `hourlyRate = totalCost/totalHours`, ketentuan pembatalan `TANPA_REFUND_JIKA_PASIEN_BATAL`; setelah Deal nominal terkunci; status `Deal — Menunggu Pembayaran`.

## G. Pembayaran Pasien (QRIS Manual + Escrow)

- [ ] **G-01 Halaman Bayar QRIS Full** — Ref: `flowpembayaran-mitra-pasien.md #3.2`
  - Lulus jika: tampil total sesuai Deal + QRIS + batas upload (misal 1x24 jam) + copy persetujuan tanpa-refund; nominal tidak bisa diubah; tidak ada opsi DP/cicil.
- [ ] **G-02 Upload Bukti Bayar** — Ref: `flowpembayaran-mitra-pasien.md #3.2`
  - Lulus jika: upload foto/screenshot tersimpan; status `Menunggu Verifikasi`; tanpa upload tidak bisa lanjut.
- [ ] **G-03 Verifikasi Bayar oleh Admin** — Ref: `flowpembayaran-mitra-pasien.md #3.3`
  - Lulus jika: Admin cocokkan nominal+waktu+bukti vs mutasi; bisa Dibayar / Tolak + alasan; yang Dibayar jadi escrow + status `Siap Jalan`; yang ditolak bisa upload ulang; lewat batas → Deal bisa dibatalkan + kebutuhan kembali Aktif.
- [ ] **G-04 Escrow (Dana Ditahan)** — Ref: `flowpembayaran-mitra-pasien.md #3.4`
  - Lulus jika: setelah Dibayar dana tercatat `DIBAYAR_DITAHAN` dan belum ke Mitra; layanan baru boleh mulai sesuai jadwal; tidak ada jalur payout tanpa escrow.

## H. Absensi (Foto + Waktu + Geolocation + Approve Pasien)

- [ ] **H-01 Clock-In di Lokasi** — Ref: `flowpembayaran-mitra-pasien.md #3.6`
  - Lulus jika: wajib foto live (camera-only), waktu pakai server timestamp, GPS lat/lng/akurasi tersimpan; tanpa GPS/foto valid ditolak dengan pesan; status `MENUNGGU_APPROVAL_PASIEN`.
- [ ] **H-02 Clock-Out + Hitung Durasi Sistem** — Ref: `flowpembayaran-mitra-pasien.md #3.6`
  - Lulus jika: pola sama dengan clock-in; durasi = clockOut − clockIn dihitung sistem (bukan input manual); pasangan sesi terhubung.
- [ ] **H-03 Approve / Tolak per Sesi oleh Pasien** — Ref: `flowpembayaran-mitra-pasien.md #3.6`
  - Lulus jika: Pasien lihat foto datang/pulang + jam + durasi + peta + flag radius; bisa Setujui / Tolak + alasan; yang disetujui masuk `workedHours`; yang ditolak tidak dihitung.
- [ ] **H-04 Flag Lokasi & Batas Approve + Override Admin** — Ref: `flowpembayaran-mitra-pasien.md #3.6`
  - Lulus jika: di luar radius → `FLAG_LOKASI` + minta alasan; akurasi jelek diminta ulangi; lewat batas approve (misal 2x24 jam) Admin bisa `DISETUJUI_ADMIN / DITOLAK_ADMIN`.
- [ ] **H-05 Rekap Jam (workedHours)** — Ref: `flowpembayaran-mitra-pasien.md #3.6`
  - Lulus jika: `workedHours = SUM durasi DISETUJUI` dengan pembulatan yang dikunci (saran per 15 menit); rekap tampil ke Mitra, Pasien, Admin dan konsisten di ketiganya.

## I. Layanan Berjalan & Selesai

- [ ] **I-01 Status Layanan (Menunggu Mulai → Berjalan)** — Ref: `FLOWUSER-PASIEN.md #13-14`, `FLOWMITRA-PERAWAT.md #18-19`
  - Lulus jika: layanan tidak bisa mulai sebelum Payment Dibayar; status berubah sesuai jadwal; Pasien bisa pantau perawat/jadwal/durasi/status.
- [ ] **I-02 Selesaikan + Konfirmasi Selesai** — Ref: `flowpembayaran-mitra-pasien.md #3.5`
  - Lulus jika: Mitra Finish menarik jam dari rekap approved; Pasien Konfirmasi → `Selesai` + masuk antrian payout; Pasien tidak aksi dalam X hari → Admin bisa override berdasar absensi/bukti.
- [ ] **I-03 Riwayat Layanan** — Ref: `FLOWUSER-PASIEN.md #15, #17`, `FLOWMITRA-PERAWAT.md #20, #24`
  - Lulus jika: riwayat tersimpan per akun (perawat, jenis, tanggal, durasi, biaya, status bayar); status lengkap `Draft/Aktif/Mencari/Dibahas/Deal/Menunggu Bayar/Berjalan/Selesai/Dibatalkan/Sengketa` tampil benar.

## J. Payout ke Mitra (TF Manual + Potong Admin)

- [ ] **J-01 Syarat Payout dari Absensi Approved** — Ref: `flowpembayaran-mitra-pasien.md #4.1`
  - Lulus jika: payout hanya jika Payment Dibayar + Layanan Selesai + `workedHours` approved memenuhi kontrak + rekening valid + tanpa sengketa terbuka; satu syarat gagal → tidak bisa payout.
- [ ] **J-02 Hitung gross − admin = net & Simpan Audit** — Ref: `flowpembayaran-mitra-pasien.md #4.2`
  - Lulus jika: `adminFeeAmount = gross x persen/100`, `net = gross − fee`; semua angka + persen tersimpan; contoh Rp3jt − 10% = Rp2,7jt benar.
- [ ] **J-03 TF Manual + Bukti TF** — Ref: `flowpembayaran-mitra-pasien.md #4.3`
  - Lulus jika: Admin input TF + upload bukti + tanggal; status `DIPROSES → DIBAYARKAN`; Mitra lihat gross/potongan/net/tanggal/bukti di riwayat pendapatan.
- [ ] **J-04 Payout Gagal / Ditahan** — Ref: `flowpembayaran-mitra-pasien.md #4.4`
  - Lulus jika: rekening salah / bank gangguan → `Gagal` + bisa proses ulang; sengketa terbuka → `Ditahan` sampai putusan.

## K. Pembatalan & Wanprestasi (Aturan Uang Final)

- [ ] **K-01 Pasien Batal Setelah Deal → Tanpa Refund + Full ke Mitra** — Ref: `flowpembayaran-mitra-pasien.md #6.0-6.1`
  - Lulus jika: batal sepihak sisi Pasien setelah Deal → tidak ada refund dalam bentuk apa pun; dana full diteruskan sebagai gaji (`net` setelah admin) + bukti TF; berlaku walau 0 jam; copy persetujuan tampil sebelum bayar; batal sebelum Deal/bayar tetap bebas tanpa uang.
- [ ] **K-02 Mitra Wanprestasi → Beku + Deposit Hangus + Refund Per Jam** — Ref: `flowpembayaran-mitra-pasien.md #6.2`
  - Lulus jika: terbukti (laporan + absensi + chat) → akun `DIBEKUKAN_SAMPAI_PERIODE_BARU`; deposit jadi `HANGUS_PELANGGARAN` (tidak kembali walau ada klien); refund = `missingHours x hourlyRate` via TF + bukti (contoh 5 jam x Rp100rb = Rp500rb); sisa jam valid tetap dibayar/ditahan sesuai putusan; wajib bayar deposit baru penuh setelah masa beku.
- [ ] **K-03 Sengketa Pasca-Payout** — Ref: `flowpembayaran-mitra-pasien.md #6.3`
  - Lulus jika: komplain setelah payout masuk Sengketa; terbukti pemalsuan jam → bisa beku retroaktif + hanguskan deposit + bebankan refund ke payout berikut/tagih manual.

## L. Review, Rating, Reputasi & Personal Branding

- [ ] **L-01 Review Pasien ke Mitra** — Ref: `FLOWUSER-PASIEN.md #16`, `FLOWMITRA-PERAWAT.md #22`
  - Lulus jika: hanya bisa review setelah `Selesai`; nilai ketepatan/profesionalisme/komunikasi/kualitas/kepuasan; satu layanan satu review (anti-duplikat).
- [ ] **L-02 Reputasi & Profil Publik Mitra** — Ref: `FLOWMITRA-PERAWAT.md #23`, `FLOWTambahan.md #22-28`
  - Lulus jika: profil publik tampil foto, nama/gelar, bio, kompetensi, pendidikan, sertifikasi terverifikasi (badge), pengalaman, total selesai, rating/review, wilayah; angka total/rating konsisten dengan data layanan.
- [ ] **L-03 Update Profil Berkelanjutan** — Ref: `FLOWTambahan.md #29`
  - Lulus jika: Mitra bisa tambah pengalaman/sertifikasi/kompetensi/wilayah; perubahan sensitif memicu verifikasi ulang; ada test untuk kedua jalur.

## M. Sengketa & Laporan

- [ ] **M-01 Buat Laporan / Sengketa (Pasien & Mitra)** — Ref: `FLOWUSER-PASIEN.md #20, #28`, `FLOWMITRA-PERAWAT.md #28, #37`
  - Lulus jika: kedua pihak bisa lapor (tidak sesuai, tidak datang, info beda, bayar, perilaku, komunikasi) + lampiran; status awal tercatat.
- [ ] **M-02 Penanganan Admin (Periksa → Tindak Lanjut → Selesai)** — Ref: `FLOWADMIN.md #14, #16`, `FLOWTambahan.md #12`
  - Lulus jika: Admin lihat data pasien+mitra, kesepakatan, percakapan relevan, absensi, pembayaran, bukti; bisa minta info, putuskan, ubah status `Baru/Ditinjau/Butuh Info/Selesai/Ditutup`; pelapor dapat update.

## N. Admin & Operasional

- [ ] **N-01 Dashboard Admin** — Ref: `FLOWADMIN.md #4, #18`
  - Lulus jika: tampil jumlah pasien/mitra, menunggu verifikasi, kebutuhan aktif, minat, berjalan, transaksi, selesai, sengketa, laporan; angka konsisten dengan data (spot-check).
- [ ] **N-02 Kelola User & Status Akun** — Ref: `FLOWADMIN.md #5, #17`
  - Lulus jika: lihat identitas, status, profil, riwayat aktivitas/layanan/transaksi/laporan; bisa aktif/nonaktif/tangguhkan/blokir/buka blokir; akun diblokir tidak bisa login/operasi.
- [ ] **N-03 Monitor Kebutuhan, Deal, Transaksi, Layanan** — Ref: `FLOWADMIN.md #8-12`
  - Lulus jika: Admin bisa telusuri `Pasien → Perawat → Layanan → Pembayaran`; lihat kebutuhan, minat, kontrak, absensi, payment, payout, deposit; bisa nonaktifkan kebutuhan bermasalah + klarifikasi.
- [ ] **N-04 Antrian Uang (Verifikasi Bayar, Payout, Deposit, Refund)** — Ref: `flowpembayaran-mitra-pasien.md`, `FLOWADMIN.md #7, #11`
  - Lulus jika: ada 4 antrian terpisah dengan filter status; setiap aksi wajib catat `verified/paidByAdminId + timestamp + bukti`; tidak ada payout/refund tanpa jejak admin.
- [ ] **N-05 Kelola Review Bermasalah** — Ref: `FLOWADMIN.md #15`
  - Lulus jika: Admin bisa sembunyikan/hapus review melanggar + catat alasan; rating terhitung ulang benar.

## O. Regulasi, Privasi & Keamanan Data

- [ ] **O-01 Persetujuan Ketentuan Platform (Pasien)** — Ref: `FLOWTambahan.md #16`
  - Lulus jika: Pasien wajib setuju ketentuan sebelum buat kebutuhan; timestamp tersimpan; tanpa setuju diblokir.
- [ ] **O-02 Batasan Akses Data Sensitif** — Ref: `FLOWTambahan.md #7`, `FLOWMITRA-PERAWAT.md #9`
  - Lulus jika: Mitra hanya lihat data pasien seperlunya untuk layanan; dokumen medis/identitas tidak bocor ke publik; foto absensi tidak memuat data sensitif tanpa izin; ada test akses negatif.
- [ ] **O-03 Larangan Layanan di Luar Kompetensi** — Ref: `FLOWTambahan.md #5`
  - Lulus jika: ada peringatan/validasi saat minat di luar kompetensi; pelanggaran tercatat untuk evaluasi kepatuhan.
- [ ] **O-04 Evaluasi Kepatuhan & Sanksi Bertahap** — Ref: `FLOWTambahan.md #13-15`
  - Lulus jika: laporan/review/pembatalan/sengketa masuk skor evaluasi; sanksi peringatan → batasi → tangguhkan → hentikan → blokir bisa diterapkan + tercatat.

## P. Notifikasi

- [ ] **P-01 Notifikasi Pasien** — Ref: `FLOWUSER-PASIEN.md #21`, `flowpembayaran-mitra-pasien.md #9`
  - Lulus jika: terima notif registrasi, profil, kebutuhan dibuat, minat masuk, minat diterima, pesan, deal, bayar berhasil/gagal, layanan mulai/selesai, absensi perlu approve, refund; tidak ada event hilang (uji end-to-end satu siklus penuh).
- [ ] **P-02 Notifikasi Mitra** — Ref: `FLOWMITRA-PERAWAT.md #26`, `flowpembayaran-mitra-pasien.md #9`
  - Lulus jika: terima notif registrasi, perbaikan dokumen, verifikasi, deposit berhasil/kedaluwarsa/terkunci/hangus/kembali, kebutuhan baru, minat diterima/ditolak, pesan, deal, bayar pasien lolos, clock-in/out + approve/tolak, payout diproses/dibayar/gagal, review baru.
- [ ] **P-03 Notifikasi / Badge Admin (MVP in-app)** — Ref: `flowpembayaran-mitra-pasien.md #9`
  - Lulus jika: ada badge untuk bukti baru, payout layak bayar, deposit kedaluwarsa, refund/sengketa, absensi flag/lewat batas; untuk MVP cukup in-app, tanpa WA/email otomatis.

---

## Q. Uji End-to-End Wajib (satu siklus penuh)

- [ ] **Q-01 Siklus normal ada klien** — Ref: `flowpembayaran-mitra-pasien.md #10.1`
  - Lulus jika: deposit → Deal Rp3jt → bayar QRIS → escrow → absensi approved → selesai → payout Rp2,7jt (admin 10%) → review → deposit lama kembali awal bulan 3 + wajib deposit baru. Semua checklist A–P terkait ikut lulus.
- [ ] **Q-02 Tanpa klien 2 bulan** — Ref: `flowpembayaran-mitra-pasien.md #10.2`
  - Lulus jika: deposit → 0 Deal → bulan 3 terkunci → `HANGUS_TERTANAM` → saldo 0 → bayar baru dari nol untuk buka.
- [ ] **Q-03 Wanprestasi kurang 5 jam** — Ref: `flowpembayaran-mitra-pasien.md #10.3`
  - Lulus jika: Deal 40 jam Rp4jt → kerja 35 jam kabur → refund Rp500rb ke pasien + bukti → akun beku + deposit hangus → sisa jam valid dibayar/ditahan sesuai putusan.
- [ ] **Q-04 Pasien batal sepihak** — Ref: `flowpembayaran-mitra-pasien.md #10.4`
  - Lulus jika: Deal Rp2jt sudah bayar → pasien batal → tanpa refund → full ke Mitra (misal Rp1,8jt setelah admin 10%) + bukti.

---

## Keputusan produk yang masih terbuka (kunci sebelum coding)

Dari `flowpembayaran-mitra-pasien.md #11`: nominal deposit, `%` admin, 2 bulan = 60 hari vs kalender, definisi klien (Dibayar vs Selesai), refund deposit otomatis vs ajukan, batas upload QRIS + auto-cancel, jadwal payout (langsung vs batch), rekening wajib sejak awal atau saat payout, QRIS statis vs kode unik, radius absensi, pembulatan durasi, camera-only vs galeri darurat, batas approve + override, lokasi wajib koordinat atau teks saja.
