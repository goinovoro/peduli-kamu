# Peduli Kamu

## Flow Pembayaran — Mitra & Pasien (QRIS Manual + Escrow + Deposit 2 Bulan)

---

# 1. Gambaran Umum

Dokumen ini mengatur alur uang di Peduli Kamu untuk fase awal (tanpa payment gateway).

Prinsip utama:

1. **Pasien bayar full di depan via QRIS perusahaan Peduli Kamu** setelah menyetujui kontrak (Deal) dengan Mitra Perawat.
2. Dana Pasien **ditahan Peduli Kamu (escrow manual)** selama layanan berjalan.
3. **Mitra Perawat menerima gaji/payout via transfer bank manual** setelah menyelesaikan jam kerja sesuai kebutuhan Pasien, **dipoting biaya admin**.
4. **Commitment fee / deposit Mitra berlaku 2 bulan.** Memasuki bulan ke-3 akun Mitra terkunci sampai bayar deposit periode baru.
5. Semua pembayaran (masuk & keluar) **diverifikasi Admin secara manual** via bukti transfer.

Metode yang dipakai:

* Masuk (Pasien → Peduli Kamu): **QRIS statis perusahaan** + upload bukti bayar
* Masuk (Mitra → Peduli Kamu): **QRIS statis perusahaan** untuk commitment fee / deposit + upload bukti bayar
* Keluar (Peduli Kamu → Mitra): **transfer bank manual** ke rekening Mitra + upload bukti TF oleh Admin

---

# 2. Aktor & Tanggung Jawab Uang

## 2.1 Pasien

* Menyetujui kontrak (Deal) yang berisi: jenis layanan, jadwal, durasi, frekuensi, lokasi, ruang lingkup, total biaya, ketentuan pembatalan.
* Wajib membayar **full (100%)** sesuai total biaya di kontrak, via QRIS perusahaan.
* Mengunggah bukti bayar dan menunggu verifikasi Admin.
* Mengonfirmasi layanan selesai agar payout Mitra bisa diproses.
* Berhak atas pengembalian dana (refund manual) sesuai ketentuan pembatalan/sengketa.

## 2.2 Mitra Perawat

* Membayar **commitment fee / deposit** via QRIS agar akun Aktif dan bisa melihat kebutuhan.
* Menyelesaikan jam kerja sesuai kontrak/kebutuhan Pasien.
* Menekan tombol `Selesaikan Layanan` dan menunggu konfirmasi Pasien + verifikasi Admin.
* Menerima payout via transfer bank ke rekening yang terdaftar di profil, setelah dipotong biaya admin.
* Wajib menjaga rekening bank tetap valid (nama bank, nomor rekening, nama pemilik).

## 2.3 Admin Peduli Kamu

* Menampilkan/mengelola QRIS perusahaan (gambar + nama merchant + nominal yang harus dibayar).
* Memverifikasi bukti bayar Pasien dan bukti commitment fee Mitra (Setujui / Tolak dengan alasan).
* Memverifikasi penyelesaian jam kerja sebelum payout.
* Menghitung potongan biaya admin dan melakukan TF manual ke Mitra.
* Mengunggah bukti TF, menangani refund, sengketa, dan deposit hangus/kembali.
* Mengunci/membuka akun Mitra terkait deposit.

---

# 3. Flow Pasien: Setuju Kontrak → Bayar Full → Layanan → Selesai

## 3.1 Menyetujui Kontrak (Deal)

Setelah tahap Kontak/Negosiasi (lihat `FLOWUSER-PASIEN.md`):

1. Pasien dan Mitra menyepakati kontrak di platform.
2. Kontrak berisi minimal:
   * Pasien & Mitra
   * Jenis layanan
   * Jadwal, durasi per hari, frekuensi, total jam, tanggal mulai/selesai
   * Lokasi layanan
   * Ruang lingkup pekerjaan
   * **Total biaya (gross)**
   * Ketentuan pembatalan & refund
3. Status kebutuhan: **Deal — Menunggu Pembayaran**.
4. Sistem mengunci kontrak agar nominal tidak bisa diubah sepihak setelah Deal.

## 3.2 Pembayaran Full via QRIS

1. Sistem menampilkan halaman pembayaran:
   * Total tagihan (sesuai Deal)
   * QRIS perusahaan Peduli Kamu (gambar statis)
   * Batas waktu upload bukti (saran MVP: 1x24 jam)
   * Tombol `Saya Sudah Bayar` + form upload bukti (foto/screenshot)
2. Pasien scan QRIS dari e-wallet / m-banking dan bayar **full, tidak bisa DP/cicil** untuk MVP.
3. Pasien upload bukti bayar.
4. Status pembayaran: **Menunggu Verifikasi**.

```text
DEAL
  ↓
TAMPIL QRIS + NOMINAL FULL
  ↓
PASIEN BAYAR VIA QRIS
  ↓
UPLOAD BUKTI BAYAR
  ↓
MENUNGGU VERIFIKASI ADMIN
```

## 3.3 Verifikasi Admin

1. Admin membuka antrian `Verifikasi Pembayaran Pasien`.
2. Admin mencocokkan nominal + waktu + bukti dengan mutasi QRIS perusahaan.
3. Keputusan:
   * **Dibayar** → dana resmi ditahan (escrow), status kebutuhan → **Siap Jalan / Menunggu Mulai**, Mitra dapat notifikasi.
   * **Ditolak (bukti tidak valid / nominal kurang)** → status → **Gagal / Perlu Bayar Ulang**, Pasien dapat notifikasi + alasan, bisa upload ulang selama kontrak belum dibatalkan.
4. Jika melewati batas waktu tanpa bukti valid → Deal bisa **Dibatalkan Otomatis** (atau oleh Admin), kebutuhan kembali Aktif.

## 3.4 Dana Ditahan (Escrow Manual)

* Setelah `Dibayar`, uang Pasien **belum diteruskan ke Mitra**.
* Dana dicatat sebagai `Payment { type: SERVICE, status: DIBAYAR_DITAHAN }`.
* Layanan baru boleh dimulai sesuai jadwal.
* Dana hanya keluar sebagai payout setelah syarat di Bagian 4 terpenuhi.

## 3.5 Layanan & Konfirmasi Selesai

1. Layanan berjalan sesuai jam kontrak.
2. Mitra melakukan absensi datang & pulang setiap sesi (lihat 3.6).
3. Mitra menekan `Selesaikan Layanan` + jam aktual ditarik dari rekap absensi yang sudah di-approve Pasien.
4. Pasien menekan `Konfirmasi Selesai` (atau komplain/sengketa jika tidak sesuai).
5. Jika Pasien konfirmasi → layanan `Selesai`, masuk antrian payout.
6. Jika Pasien tidak konfirmasi dalam X hari (saran: 2x24 jam) → Admin bisa verifikasi manual berdasarkan absensi + bukti/chat/laporan.

## 3.6 Absensi Mitra: Jam Datang & Jam Keluar (Foto + Waktu + Geolocation)

Tujuan: Pasien tahu Mitra benar datang & pulang sesuai jam, dan datanya jadi dasar `workedHours` untuk payout / refund per jam.

1. **Clock-in (datang) oleh Mitra di lokasi layanan:**
   * Foto selfie / foto kehadiran di lokasi (wajah + konteks lokasi, tanpa memfoto Pasien tanpa izin).
   * Waktu otomatis server (`server timestamp`, bukan waktu HP agar tidak bisa dimanipulasi).
   * Geolocation (latitude, longitude, akurasi) dicatat + dicocokkan dengan lokasi kontrak (radius toleransi, saran MVP: 100–200 m).
   * Status awal: `MENUNGGU_APPROVAL_PASIEN`.
2. **Clock-out (pulang) oleh Mitra:**
   * Foto + waktu server + geolocation yang sama polanya.
   * Durasi sesi = `clockOut - clockIn` (dihitung sistem, bukan input manual).
   * Status awal: `MENUNGGU_APPROVAL_PASIEN`.
3. **Approve oleh Pasien (per sesi / per hari):**
   * Pasien melihat di dashboard: foto datang, foto pulang, waktu datang, waktu pulang, durasi, peta/titik lokasi, radius check (di dalam / di luar radius).
   * Pasien bisa `Setujui` atau `Tolak dengan alasan` (misal: datang telat, foto tidak jelas, lokasi tidak cocok).
   * Yang disetujui → `DISETUJUI`, masuk rekap `workedHours`. Yang ditolak → `DITOLAK`, tidak dihitung + masuk catatan sengketa jika berulang.
   * Batas approve (saran MVP: 2x24 jam). Jika lewat batas tanpa aksi → Admin bisa override (`DISETUJUI_ADMIN / DITOLAK_ADMIN`) berdasarkan bukti.
4. **Aturan anti-curang (MVP):**
   * Wajib foto live (tidak boleh upload galeri) — implementasi detail di frontend (camera-only input).
   * Wajib GPS aktif + akurasi minimal (tolak jika akurasi > 100 m, minta ulangi).
   * Flag jika lokasi di luar radius kontrak (`FLAG_LOKASI`) tapi tetap simpan + minta alasan Mitra + keputusan Pasien/Admin.
   * Dilarang memfoto kondisi medis sensitif Pasien; panduan foto fokus ke Mitra + timestamp + titik lokasi.
5. **Rekap jam:**
   * `workedHours = SUM(durasi sesi DISETUJUI)` (pembulatan ke bawah per 15 menit, saran MVP — kunci sebelum coding).
   * Rekap tampil ke 3 pihak: Mitra (riwayat absensi), Pasien (kehadiran per hari), Admin (audit payout/sengketa).

```text
MITRA CLOCK-IN (foto + waktu server + GPS)
  ↓
MENUNGGU_APPROVAL_PASIEN
  ↓
MITRA CLOCK-OUT (foto + waktu server + GPS)
  ↓
PASIEN LIHAT (foto, jam, durasi, peta, radius)
  ↓
SETUJUI → DISETUJUI (masuk workedHours)
TOLAK + ALASAN → DITOLAK (tidak dihitung)
LEWAT BATAS → ADMIN OVERRIDE
```

---

# 4. Flow Mitra: Selesaikan Jam Kerja → Terima Gaji (Dipoting Admin)

## 4.1 Syarat Payout

Payout Mitra **hanya** diproses jika:

1. Pembayaran Pasien sudah `Dibayar` (lolos verifikasi).
2. Layanan berstatus `Selesai` (Mitra finish + Pasien konfirmasi, atau Admin override).
3. Jam kerja aktual memenuhi jam kontrak, **dibuktikan dari rekap absensi yang sudah di-approve** (`workedHours` dari sesi `DISETUJUI / DISETUJUI_ADMIN`, bukan klaim manual). Jika `workedHours < totalHours` tanpa putusan wanprestasi → payout proporsional atau ditahan sesuai 6.x.
4. Rekening Mitra valid dan terdaftar.
5. Tidak ada sengketa terbuka yang menahan dana (`Ditahan`).

## 4.2 Perhitungan (Manual oleh Admin, Dicatat Sistem)

Rumus MVP:

```text
grossAmount      = total biaya di kontrak (yang dibayar Pasien)
adminFeePercent  = % biaya admin platform (misal 10 — ditentukan manajemen)
adminFeeAmount   = grossAmount * adminFeePercent / 100
netAmount        = grossAmount - adminFeeAmount
```

* `grossAmount`, `adminFeePercent`, `adminFeeAmount`, `netAmount` wajib tersimpan di record `Payout` untuk audit.
* Biaya admin hanya dipotong dari **payout layanan**, bukan dari pengembalian deposit (lihat Bagian 5), kecuali ditentukan lain.

## 4.3 Transfer Manual ke Rekening Mitra

1. Admin membuka antrian `Payout Layak Bayar`.
2. Admin melakukan transfer bank manual sebesar `netAmount` ke rekening Mitra.
3. Admin mengunggah bukti TF + mengisi tanggal/waktu TF.
4. Status payout: **DIPROSES → DIBAYARKAN**.
5. Mitra mendapat notifikasi + bisa melihat riwayat pendapatan:
   * Nilai layanan (gross)
   * Potongan admin
   * Jumlah diterima (net)
   * Tanggal TF + bukti

```text
LAYANAN SELESAI (TERKONFIRMASI)
  ↓
HITUNG gross - adminFee = net
  ↓
ADMIN TF MANUAL KE REKENING MITRA
  ↓
UPLOAD BUKTI TF
  ↓
DIBAYARKAN → RIWAYAT PENDAPATAN MITRA
```

## 4.4 Gagal / Ditahan

* **Gagal:** rekening tidak valid, bank gangguan, nama tidak cocok → status `Gagal`, Admin hubungi Mitra untuk perbaikan data, lalu proses ulang.
* **Ditahan:** ada sengketa/pembatalan/laporan → status `Ditahan` sampai ada putusan Admin (`Lanjut Bayar / Bagi / Refund ke Pasien`).
* **Dikembalikan (ke Pasien):** jika putusan sengketa memenangkan Pasien → dana escrow dikembalikan manual via transfer (bukan ke Mitra), status `Dikembalikan`.

---

# 5. Commitment Fee / Deposit Mitra: 2 Bulan Aktif, Bulan Ke-3 Dikunci

## 5.1 Aturan Dasar

1. Uang komitmen fee / deposit Mitra **berlaku 2 bulan** sejak pembayaran terverifikasi.
   * Contoh: bayar dan terverifikasi 10 Jan → aktif sampai 9 Mar (atau akhir Feb tergantung kebijakan bulan kalender — kunci salah satu sebelum coding).
2. Selama masa aktif 2 bulan, akun Mitra **Aktif** dan bisa melihat kebutuhan + mengajukan minat.
3. Memasuki **bulan ketiga tanpa pembayaran deposit periode baru**, akun Mitra **otomatis terkunci**:
   * Tidak bisa melihat kebutuhan baru
   * Tidak bisa mengajukan minat baru
   * Layanan berjalan yang sudah Deal tetap bisa diselesaikan (agar Pasien tidak dirugikan)
   * Tidak bisa payout sampai akun dibuka kembali (payout yang sudah layak tetap dicatat sebagai hak, tapi TF ditunda sampai akun aktif — atau tetap dibayar sesuai kebijakan; kunci salah satu).
4. Untuk membuka kunci, Mitra harus membayar **deposit periode baru** via QRIS + upload bukti + verifikasi Admin.

```text
DEPOSIT TERVERIFIKASI (T0)
  ↓
AKTIF 2 BULAN (T0 → T0+2 bulan)
  ↓
MASUK BULAN KE-3 BELUM BAYAR?
  → YA: AKUN TERKUNCI (read-only + selesaikan sisa kerja)
  → TIDAK (sudah bayar baru): AKTIF PERIODE BARU
```

## 5.2 Deposit Hangus vs Kembali (Sesuai Kesepakatan Produk)

Aturan yang disepakati pemilik produk:

1. **Jika selama 2 bulan Mitra tidak mendapatkan klien sama sekali:**
   * Uang deposit periode tersebut **tertanam / hangus, tidak bisa ditarik / refund**.
   * Dana menjadi pendapatan platform (commitment fee).
   * **Saldo deposit periode berikutnya = 0 (tidak ada akumulasi / carry-over).** Deposit lama tidak membeku sebagai saldo, melainkan hangus penuh.
   * Akun Mitra **terkunci di bulan ke-3** sampai Mitra membayar deposit baru penuh dari nol via QRIS.
2. **Jika selama 2 bulan Mitra sudah mendapatkan minimal 1 klien (layanan Deal dan Dibayar):**
   * Uang deposit periode tersebut **dikembalikan di awal bulan ketiga**.
   * Pengembalian via transfer bank manual ke rekening Mitra (sama seperti payout, tapi tanpa potongan admin kecuali ditentukan lain).
   * Status deposit lama: `Dikembalikan`.
   * Mitra tetap wajib bayar deposit periode baru untuk tetap Aktif di bulan ke-3 dst. Artinya di awal bulan ke-3 bisa terjadi 2 transaksi berlawanan arah: `refund deposit lama (keluar)` + `bayar deposit baru (masuk)`.
3. Definisi "sudah ada klien" untuk MVP: **minimal 1 kontrak Deal yang pembayarannya sudah `Dibayar`**, bukan sekadar minat. Jika hanya minat tanpa Deal/bayar → dihitung belum ada klien → hangus.

> Catatan implementasi: butuh job/scheduler atau cek saat login/middleware untuk mengunci akun otomatis saat lewat 2 bulan. Untuk MVP boleh pakai pengecekan lazy (cek expiry setiap request) + script Admin untuk proses refund/hangus massal di awal bulan.

## 5.3 Flow Bayar Deposit

Sama seperti bayar layanan, tapi aktor = Mitra:

```text
TERVERIFIKASI / AKUN MAU AKTIF
  ↓
TAMPIL QRIS DEPOSIT + NOMINAL
  ↓
MITRA BAYAR + UPLOAD BUKTI
  ↓
ADMIN VERIFIKASI
  ↓
AKTIF 2 BULAN (expiry dicatat)
```

## 5.4 Status Deposit (Untuk ERD & Admin)

* `MENUNGGU_VERIFIKASI`
* `AKTIF`
* `KEDALUWARSA_MENUNGGU_PEMBARUAN` (masuk bulan 3, akun terkunci)
* `DIPERBARUI` (sudah bayar periode baru)
* `HANGUS_TERTANAM` (2 bulan tanpa klien)
* `HANGUS_PELANGGARAN` (akun dibekukan karena wanprestasi — lihat 6.2, tidak kembali walau ada klien)
* `DIKEMBALIKAN` (awal bulan 3 karena sudah ada klien)
* `GAGAL / DITOLAK` (bukti tidak valid)

---

# 6. Pembatalan & Refund (Manual) — Aturan Final Produk

## 6.0 Prinsip Kunci (Wajib)

1. **Setelah Deal disetujui kedua pihak, pembayaran Pasien bersifat final.**
   **Tidak ada pengembalian uang kepada Pasien jika Pasien yang membatalkan kontrak.**
   Dana Pasien yang sudah `DIBAYAR_DITAHAN` menjadi hak escrow dan diprosesตาม ketentuan wanprestasi di bawah, bukan refund otomatis.
2. Pengecualian satu-satunya untuk refund ke Pasien adalah **jika Mitra wanprestasi / tidak bertanggung jawab** (tidak datang, kabur di tengah jam, menolak kerja tanpa alasan sah, melanggar ruang lingkup berat).
3. Refund ke Pasien dalam kasus wanprestasi Mitra dihitung **proporsional per jam yang belum dikerjakan**:

```text
hourlyRate   = totalCost / totalHours (dari kontrak Deal)
missingHours = totalHours - workedHours (diverifikasi Admin)
refundAmount = missingHours * hourlyRate
```

Contoh: kontrak 40 jam Rp4.000.000 → Rp100.000/jam. Mitra kabur kurang 5 jam → refund Pasien = 5 x Rp100.000 = **Rp500.000** via transfer manual.

## 6.1 Pasien yang Membatalkan Setelah Deal (Penentu: Sisi Pasien)

* Pembatalan dalam pasal ini adalah **pembatalan sepihak yang ditentukan dari sisi Pasien** (bukan kesepakatan bersama, bukan wanprestasi Mitra).
* Status kontrak: **Dibatalkan oleh Pasien — Tanpa Refund**.
* `Payment Pasien` tetap `DIBAYAR_DITAHAN` (tidak jadi `DIKEMBALIKAN`).
* **Dana full diteruskan langsung ke Mitra sebagai gaji**, dengan perhitungan normal:
  * `netAmount = grossAmount - adminFeeAmount`, Admin TF manual ke rekening Mitra + upload bukti TF.
  * Status: `Payout → DIBAYARKAN (kasus pasien batal)`.
  * Berlaku walau 0 jam kerja sudah dijalankan — risikonya ditanggung Pasien sebagai konsekuensi pembatalan sepihak setelah Deal.
* Pasien mendapat notifikasi + persetujuan eksplisit di halaman Deal sebelum bayar: *"Dengan menyetujui kontrak dan membayar, Anda memahami pembatalan sepihak dari sisi Anda tidak dapat di-refund dan dana akan diteruskan ke Mitra sebagai gaji."*
* Pembatalan sebelum Deal (masih tahap Minat/Negosiasi, belum bayar) → bebas, tanpa konsekuensi uang.

## 6.2 Mitra Wanprestasi / Tidak Bertanggung Jawab

Jika terbukti Mitra tidak bertanggung jawab terhadap kerjaan (laporan Pasien + pemeriksaan Admin + bukti chat/absensi):

1. **Akun Mitra langsung dibekukan sampai bulan deposit berikutnya.**
   * Tidak bisa lihat kebutuhan, tidak bisa ajukan minat, tidak bisa terima Deal baru.
   * Layanan berjalan lain ikut ditahan/dialihkan sesuai putusan Admin.
   * Pembekuan berlaku hingga periode deposit berikutnya dimulai (bukan sekadar bayar denda langsung buka).
2. **Uang deposit periode berjalan otomatis hangus (HANGUS_PELANGGARAN).**
   * Tidak bisa ditarik, tidak dikembalikan di awal bulan ke-3 walau sebelumnya ada klien.
   * Mitra wajib bayar deposit baru penuh untuk mengaktifkan akun di periode berikutnya setelah masa beku selesai.
3. **Uang Pasien dikembalikan proporsional jam yang dirugikan** (lihat rumus 6.0):
   * Admin verifikasi `workedHours` **dari rekap absensi yang di-approve** (foto + waktu server + GPS) + bukti pendukung (chat, laporan).
   * Admin TF manual `refundAmount` ke Pasien + upload bukti refund.
   * Sisa dana jam yang sudah dikerjakan dengan benar → tetap jadi hak Mitra dikurangi admin (atau ditahan jika pelanggaran berat — putusan Admin).
   * Status: `Payment → DIKEMBALIKAN_SEBAGIAN`, `Payout → DITAHAN_SEBAGIAN / DIBAYARKAN_SEBAGIAN`, `Deposit → HANGUS_PELANGGARAN`, `Akun → DIBEKUKAN_SAMPAI_PERIODE_BARU`.

```text
LAPORAN PASIEN (mitra kabur / tidak kerja)
  ↓
ADMIN PEMERIKSAAN (bukti jam + chat + absensi)
  ↓
TERBUKTI WANPRESTASI?
  → YA: BEKUKAN AKUN s.d. BULAN DEPOSIT BERIKUTNYA
       + DEPOSIT HANGUS
       + REFUND PASIEN = missingHours x hourlyRate (TF manual)
  → TIDAK: LANJUT SESUAI JADWAL / MEDIASI
```

## 6.3 Setelah Selesai & Payout

* Tidak ada refund otomatis. Komplain masuk jalur Sengketa.
* Jika sengketa pasca-payout terbukti wanprestasi tersembunyi (misal pemalsuan jam), akun tetap bisa dibekukan retroaktif dan deposit dihanguskan, refund dibebankan ke Mitra pada payout berikutnya atau ditagih manual (kebijakan penagihan dikunci sebelum coding).

---

# 7. Status Uang (Ringkas untuk ERD)

## Payment Pasien (SERVICE)

`MENUNGGU_BAYAR → MENUNGGU_VERIFIKASI → DIBAYAR_DITAHAN → DITERUSKAN_PAYOUT / DIKEMBALIKAN_SEBAGIAN (wanprestasi mitra, per jam) / DITAHAN_SENGKETA / GAGAL`

Catatan: **tidak ada status `DIKEMBALIKAN_FULL_KARENA_PASIEN_BATAL`** — pasien batal setelah Deal = tanpa refund (lihat 6.1).

## Payout Mitra (SERVICE)

`BELUM_LAYAK → LAYAK_BAYAR → DIPROSES → DIBAYARKAN / DIBAYARKAN_SEBAGIAN / GAGAL / DITAHAN`

## Deposit Mitra (COMMITMENT)

`MENUNGGU_VERIFIKASI → AKTIF → KEDALUWARSA → DIPERBARUI / HANGUS_TERTANAM / HANGUS_PELANGGARAN / DIKEMBALIKAN / DITOLAK`

## Akun Mitra

`AKTIF → TERKUNCI_PERIODE (bulan 3 belum bayar) / DIBEKUKAN_SAMPAI_PERIODE_BARU (wanprestasi, lihat 6.2)`

---

# 8. Data Minimal yang Harus Disimpan (Bocoran ERD)

* `Payment { id, type: SERVICE/COMMITMENT, payerUserId, relatedBookingId?, relatedNeedId?, amount, method: QRIS_MANUAL, proofImageUrl, status, submittedAt, verifiedByAdminId?, verifiedAt?, rejectReason?, refundAmount?, refundProofUrl?, workedHours?, missingHours?, hourlyRate? }`
* `Payout { id, bookingId, caregiverId, grossAmount, adminFeePercent, adminFeeAmount, netAmount, bankName, bankAccountNo, bankAccountName, status, proofTfUrl?, paidByAdminId?, paidAt? }`
* `Deposit { id, caregiverId, amount, periodStart, periodEnd, status, proofImageUrl, verifiedByAdminId?, refundProofUrl?, hasClientInPeriod: boolean, freezeReason?, frozenUntil? }`
* `Contract/Deal { id, needId, caregiverId, patientId/familyId, totalHours, hourlyRate, schedule, totalCost, serviceLocationLat?, serviceLocationLng?, attendanceRadiusM?, cancelPolicy: TANPA_REFUND_JIKA_PASIEN_BATAL, status, agreedAt }`
* `Attendance { id, bookingId/contractId, caregiverId, type: CLOCK_IN/CLOCK_OUT, photoUrl, serverTime, lat, lng, accuracyM, insideRadius: boolean, status: MENUNGGU_APPROVAL_PASIEN/DISETUJUI/DITOLAK/DISETUJUI_ADMIN/DITOLAK_ADMIN, patientApprovedBy?, patientApprovedAt?, rejectReason?, adminOverrideBy?, sessionPairId? }`
* Config: `QRIS_IMAGE_URL`, `ADMIN_FEE_PERCENT`, `DEPOSIT_AMOUNT`, `DEPOSIT_DURATION_MONTHS=2`, `PAYMENT_EXPIRY_HOURS=24`, definisi bulan kalender vs 60 hari.

---

# 9. Notifikasi Uang (MVP Manual)

* Pasien: Deal dibuat, Waktunya bayar, Bukti diterima, Pembayaran Dibayar/Ditolak, Layanan siap mulai, **Absensi baru perlu di-approve (datang/pulang + foto + peta)**, Layanan selesai, Refund diproses.
* Mitra: Perlu bayar deposit, Deposit Aktif/Kedaluwarsa/Terkunci, Ada Deal baru, Pembayaran Pasien berhasil, Layanan siap mulai, **Clock-in/out berhasil, Absensi disetujui/ditolak Pasien**, Layak payout, Payout Dibayarkan/Gagal, Deposit Hangus/Dikembalikan.
* Admin: Ada bukti baru masuk, Ada payout layak bayar, Ada deposit kedaluwarsa, Ada refund/sengketa uang, **Absensi di-flag lokasi / ditolak berulang / lewat batas approve**.

Untuk MVP notifikasi boleh in-app + badge dashboard dulu, tanpa WA/email otomatis.

---

# 10. Contoh Timeline Nyata

## 10.1 Kasus normal ada klien

* 10 Jan: Mitra A bayar deposit 1 → terverifikasi → Aktif s.d. 9 Mar.
* 20 Jan: Deal dengan Pasien X Rp3.000.000 → Pasien bayar QRIS full → Admin verifikasi → escrow.
* 25–30 Jan: layanan 5 hari x 8 jam selesai, Pasien konfirmasi.
* 31 Jan: Admin hitung Rp3.000.000 - 10% = Rp2.700.000 → TF ke Mitra A → `DIBAYARKAN`.
* Awal Mar: karena Mitra A sudah ada klien di periode → deposit 1 `DIKEMBALIKAN` via TF, tapi Mitra A wajib bayar deposit 2 agar tidak terkunci di bulan ke-3.

## 10.2 Kasus tanpa klien

* 10 Jan: Mitra B bayar deposit 1 → Aktif s.d. 9 Mar, tapi tidak dapat Deal/bayar sama sekali.
* 10 Mar: akun Mitra B **terkunci**, deposit 1 → `HANGUS_TERTANAM`, tidak bisa ditarik.
* Mitra B harus bayar deposit 2 untuk membuka akun kembali.

## 10.3 Kasus Mitra wanprestasi (kabur kurang 5 jam)

* 10 Jan: Mitra C bayar deposit 1 (misal Rp200.000) → terverifikasi → Aktif s.d. 9 Mar.
* 5 Feb: Deal dengan Pasien Y: total 40 jam, total Rp4.000.000 → `hourlyRate` = Rp100.000/jam. Pasien bayar QRIS full → Admin verifikasi → escrow `DIBAYAR_DITAHAN`.
* 10–14 Feb: Mitra C kerja 35 jam, lalu tidak datang tanpa kabar untuk sisa 5 jam. Pasien lapor + lampirkan chat/absensi.
* 15 Feb: Admin pemeriksaan → terbukti wanprestasi:
  * `workedHours` = 35, `missingHours` = 5, `refundAmount` = 5 x Rp100.000 = **Rp500.000**.
  * Admin TF manual Rp500.000 ke Pasien + upload bukti refund → `Payment → DIKEMBALIKAN_SEBAGIAN`.
  * Sisa 35 jam yang valid (Rp3.500.000) tetap jadi hak Mitra kotor dikurangi admin (misal 10% → net Rp3.150.000), **atau** ditahan penuh jika pelanggaran berat — putusan Admin dicatat. Saran MVP: yang sudah dikerjakan benar tetap dibayar, agar Pasien tidak dirugikan dua kali dan Mitra tidak dirampas penuh tanpa putusan berat.
  * Akun Mitra C → `DIBEKUKAN_SAMPAI_PERIODE_BARU` (tidak bisa ambil job baru sampai periode deposit berikutnya).
  * Deposit 1 Mitra C → `HANGUS_PELANGGARAN` (hangus otomatis, tidak kembali di awal bulan 3 walau sebelumnya ada klien).
* Periode berikutnya: Mitra C wajib bayar deposit 2 penuh setelah masa beku selesai untuk membuka akun kembali.

## 10.4 Kasus Pasien batal sepihak setelah Deal

* 20 Feb: Deal Pasien Z dengan Mitra D Rp2.000.000 (20 jam) → Pasien sudah bayar QRIS → `DIBAYAR_DITAHAN`.
* 22 Feb (belum mulai jalan): Pasien Z batal sepihak dari sisi Pasien karena alasan pribadi.
* Putusan: **tanpa refund** (lihat 6.1). `Payment` tetap `DIBAYAR_DITAHAN`, tidak jadi `DIKEMBALIKAN`.
* Tindak lanjut dana: **full diteruskan ke Mitra D sebagai gaji** — misal admin 10% → Admin TF Rp1.800.000 ke Mitra D + upload bukti → `Payout → DIBAYARKAN (kasus pasien batal)`.
* Pasien Z mendapat notifikasi penolakan refund + salinan ketentuan Deal yang sudah disetujui.

---

# 11. Keputusan yang Masih Perlu Dikunci Sebelum Coding

1. Nominal: `DEPOSIT_AMOUNT` berapa? `ADMIN_FEE_PERCENT` berapa? Apakah deposit tiap daerah/tier sama?
2. Bulan 2 bulan = 60 hari atau bulan kalender? Tanggal kedaluwarsa dihitung dari `verifiedAt` atau awal bulan berikutnya?
3. Definisi "ada klien": cukup `Deal Dibayar`, atau harus `Layanan Selesai`?
4. Refund deposit di awal bulan 3: otomatis ditransfer Admin, atau Mitra harus klik `Ajukan Pengembalian`?
5. Batas upload bukti QRIS: 1x24 jam? Apa yang terjadi jika lewat (auto-cancel Deal)?
6. Payout: H+berapa setelah selesai? Batch harian/mingguan atau langsung?
7. Rekening Mitra wajib diisi sejak registrasi atau boleh saat mau payout pertama?
8. QRIS satu gambar statis untuk semua nominal, atau perlu kode unik per transaksi untuk rekonsiliasi?
9. Absensi: radius toleransi berapa meter? Pembulatan durasi per berapa menit? Foto live wajib camera-only atau boleh galeri darurat? Batas approve Pasien berapa jam sebelum Admin override? Bagaimana menangani GPS palsu / HP tanpa GPS (mode darurat + foto + alasan)?
10. Lokasi layanan wajib koordinat sejak Deal, atau boleh alamat teks saja dulu (absensi tanpa cek radius)?

---

# 12. Hubungan dengan Dokumen Flow Lain

* Pasien: melengkapi `FLOWUSER-PASIEN.md #11 Deal → #12 Pembayaran → #13 Layanan Dimulai`.
* Mitra: melengkapi `FLOWMITRA-PERAWAT.md #7 Aktivasi Commitment Fee → #16 Menunggu Pembayaran → #21 Pembayaran kepada Mitra`.
* Admin: melengkapi `FLOWADMIN.md #7 Commitment Fee → #11 Pengelolaan Pembayaran → #12 Pemantauan Layanan`.
* Regulasi: melengkapi `FLOWTambahan.md #9 Regulasi Pembayaran` — semua pembayaran via mekanisme Peduli Kamu, tercatat, transparan, jadi dasar sengketa.

Objek uang dari dokumen ini:

**Kontrak → Bayar Full (QRIS, tanpa refund jika Pasien batal) → Escrow → Selesai Jam Kerja → Potong Admin → TF Mitra**, dengan **Deposit 2 bulan → Kunci bulan 3 → Hangus jika tanpa klien / Kembali di awal bulan 3 jika ada klien**, dan **Mitra wanprestasi → Akun dibekukan s.d. bulan deposit berikutnya + Deposit hangus + Refund Pasien = missingHours x hourlyRate.**
