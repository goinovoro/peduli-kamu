# Peduli Kamu — ERD + Pemetaan Fitur → Kode

Sumber: 5 docs (`FLOWUSER-PASIEN`, `FLOWMITRA-PERAWAT`, `FLOWADMIN`, `FLOWTambahan`, `flowpembayaran-mitra-pasien`) + `docs/FEATURE_CHECKLIST.md` (ID A–Q).

Prinsip ERD (dari `FLOWADMIN.md #23`): **satu tabel `User`** dengan role `PASIEN / MITRA / ADMIN`. Pasien & Mitra = profil di atas `User` yang sama.

Kondisi kode saat ini (`backend/prisma/schema.prisma`):
Ada: `User, Patient, Caregiver, Booking`. Belum ada: `Need, Interest, Contract, Payment, Payout, Deposit, Attendance, Message, Review, Dispute, Notification, Consent, Document`.

---

## 1. Diagram ERD (Mermaid)

```mermaid
erDiagram
  User ||--o{ PatientProfile : owns
  User ||--o| CaregiverProfile : has
  User ||--o{ ServiceNeed : creates
  User ||--o{ Interest : sends
  User ||--o{ Payment : pays
  User ||--o{ Notification : receives
  User ||--o{ Consent : agrees
  User ||--o{ Dispute : reports
  User ||--o{ Review : writes

  ServiceNeed ||--o{ Interest : receives
  ServiceNeed ||--o| Contract : becomes
  CaregiverProfile ||--o{ Interest : applies
  Interest ||--o| Contract : accepted-as

  Contract ||--o| Payment : escrow-service
  Contract ||--o{ Attendance : tracked-by
  Contract ||--o| Payout : settles-to
  Contract ||--o{ Review : reviewed-in
  Contract ||--o{ Dispute : disputed-in
  Contract ||--o{ Message : discussed-in

  CaregiverProfile ||--o{ Deposit : pays
  CaregiverProfile ||--o{ Payout : earns
  CaregiverProfile ||--o{ CaregiverDocument : uploads
  CaregiverProfile ||--o{ Attendance : clocks

  User {
    string id PK
    string email UK
    string password
    string name
    string phone
    string photoUrl
    enum role "PASIEN | MITRA | ADMIN"
    enum accountStatus "BELUM_LENGKAP | AKTIF | TIDAK_AKTIF | DITANGGUHKAN | DIBLOKIR | TERKUNCI_PERIODE | DIBEKUKAN"
    string address
    string city
    string region
    string emergencyContact
    datetime createdAt
  }
  PatientProfile {
    string id PK
    string userId FK_UK
    string name
    int age
    string careTier
    string conditionNotes
  }
  CaregiverProfile {
    string id PK
    string userId FK_UK
    string domicile
    string serviceArea
    string education
    string experience
    string competencies
    string certifications
    string strNo
    string bio
    string bankName
    string bankAccountNo
    string bankAccountName
    enum verificationStatus "MENUNGGU | DITINJAU | DISETUJUI | DITOLAK | PERLU_PERBAIKAN"
    string verificationNote
    datetime depositExpiresAt
    float ratingAvg
    int totalFinished
  }
  ServiceNeed {
    string id PK
    string patientUserId FK
    string patientProfileId FK
    string serviceType
    string forWhom
    string locationText
    float locationLat
    float locationLng
    date startDate
    string schedule
    int durationHoursPerDay
    string frequency
    int totalHours
    string conditionDesc
    string specialNeeds
    int budgetEstimate
    string description
    enum status "DRAFT | DIPUBLIKASIKAN | DALAM_PEMBAHASAN | DEAL | MENUNGGU_PEMBAYARAN | SIAP_JALAN | BERJALAN | SELESAI | DIBATALKAN | SENGKETA"
    datetime createdAt
  }
  Interest {
    string id PK
    string needId FK
    string caregiverId FK
    string intro
    string relevantExp
    string availability
    enum status "MENUNGGU_RESPON | DITERIMA | DITOLAK | DIBATALKAN"
    datetime createdAt
  }
  Contract {
    string id PK
    string needId FK_UK
    string interestId FK
    string patientUserId FK
    string caregiverId FK
    string serviceType
    string schedule
    int totalHours
    float hourlyRate
    int totalCost
    string locationText
    float locationLat
    float locationLng
    int attendanceRadiusM
    string scope
    date startDate
    date endDate
    string cancelPolicy "TANPA_REFUND_JIKA_PASIEN_BATAL"
    enum status "DEAL_MENUNGGU_BAYAR | DIBAYAR_DITAHAN | SIAP_JALAN | BERJALAN | SELESAI | DIBATALKAN_PASIEN | DIBATALKAN_MITRA | SENGKETA"
    datetime agreedAt
  }
  Payment {
    string id PK
    enum type "SERVICE | COMMITMENT"
    string payerUserId FK
    string contractId FK "nullable, utk SERVICE"
    string depositId FK "nullable, utk COMMITMENT"
    int amount
    string method "QRIS_MANUAL"
    string proofImageUrl
    enum status "MENUNGGU_BAYAR | MENUNGGU_VERIFIKASI | DIBAYAR_DITAHAN | DITERUSKAN_PAYOUT | DIKEMBALIKAN_SEBAGIAN | DITAHAN_SENGKETA | GAGAL | DITOLAK"
    int refundAmount
    string refundProofUrl
    int workedHours
    int missingHours
    int hourlyRateSnapshot
    string verifiedByAdminId FK
    datetime verifiedAt
    string rejectReason
  }
  Payout {
    string id PK
    string contractId FK_UK
    string caregiverId FK
    int grossAmount
    int adminFeePercent
    int adminFeeAmount
    int netAmount
    string bankNameSnap
    string bankAccountNoSnap
    string bankAccountNameSnap
    enum status "BELUM_LAYAK | LAYAK_BAYAR | DIPROSES | DIBAYARKAN | DIBAYARKAN_SEBAGIAN | GAGAL | DITAHAN"
    string reason "SELESAI_NORMAL | PASIEN_BATAL"
    string proofTfUrl
    string paidByAdminId FK
    datetime paidAt
  }
  Deposit {
    string id PK
    string caregiverId FK
    int amount
    datetime periodStart
    datetime periodEnd
    enum status "MENUNGGU_VERIFIKASI | AKTIF | KEDALUWARSA | DIPERBARUI | HANGUS_TERTANAM | HANGUS_PELANGGARAN | DIKEMBALIKAN | DITOLAK"
    string proofImageUrl
    boolean hasClientInPeriod
    string verifiedByAdminId FK
    string refundProofUrl
    string freezeReason
    datetime frozenUntil
  }
  Attendance {
    string id PK
    string contractId FK
    string caregiverId FK
    enum type "CLOCK_IN | CLOCK_OUT"
    string photoUrl
    datetime serverTime
    float lat
    float lng
    int accuracyM
    boolean insideRadius
    enum status "MENUNGGU_APPROVAL_PASIEN | DISETUJUI | DITOLAK | DISETUJUI_ADMIN | DITOLAK_ADMIN"
    string sessionPairId
    string rejectReason
    string patientApprovedBy FK
    datetime patientApprovedAt
    string adminOverrideBy FK
  }
  CaregiverDocument {
    string id PK
    string caregiverId FK
    enum kind "KTP | IJAZAH | SERTIFIKAT | STR | LAINNYA"
    string fileUrl
    enum status "MENUNGGU | DISETUJUI | DITOLAK | PERLU_PERBAIKAN"
    string note
  }
  Message {
    string id PK
    string contractId FK "nullable, null = pra-Deal via Interest"
    string interestId FK "nullable"
    string senderUserId FK
    string body
    datetime createdAt
  }
  Review {
    string id PK
    string contractId FK
    string reviewerUserId FK
    string reviewedCaregiverId FK
    int punctuality
    int professionalism
    int communication
    int quality
    int overall
    string comment
    boolean hiddenByAdmin
  }
  Dispute {
    string id PK
    string contractId FK
    string reporterUserId FK
    string reportedUserId FK
    string category
    string description
    string evidenceUrls
    enum status "BARU | DITINJAU | BUTUH_INFO | SELESAI | DITUTUP"
    string decision
    string handledByAdminId FK
  }
  Notification {
    string id PK
    string userId FK
    string kind
    string title
    string body
    string linkUrl
    boolean read
    datetime createdAt
  }
  Consent {
    string id PK
    string userId FK
    string kind "KETENTUAN_PLATFORM | KODE_ETIK | PEMBATALAN | PEMBAYARAN | SENGKETA | PRIVASI"
    string version
    datetime agreedAt
  }
```

Catatan nama: `Patient` lama → `PatientProfile`, `Caregiver` lama → `CaregiverProfile`, `Booking` lama → digantikan `ServiceNeed + Interest + Contract` (jangan hapus `Booking` sebelum migrasi data + QA parity).

---

## 2. Enum & Status (dikunci dari docs)

| Entitas | Enum | Nilai | Sumber |
|---|---|---|---|
| User.role | Role | PASIEN, MITRA, ADMIN | FLOWADMIN #23 |
| User.accountStatus | AccountStatus | BELUM_LENGKAP, AKTIF, TIDAK_AKTIF, DITANGGUHKAN, DIBLOKIR, TERKUNCI_PERIODE, DIBEKUKAN | FLOWUSER #2 + payment #5/#6 |
| CaregiverProfile.verificationStatus | VerificationStatus | MENUNGGU, DITINJAU, DISETUJUI, DITOLAK, PERLU_PERBAIKAN | FLOWMITRA #5 |
| ServiceNeed.status | NeedStatus | DRAFT, DIPUBLIKASIKAN, DALAM_PEMBAHASAN, DEAL, MENUNGGU_PEMBAYARAN, SIAP_JALAN, BERJALAN, SELESAI, DIBATALKAN, SENGKETA | FLOWUSER #5/#17 |
| Interest.status | InterestStatus | MENUNGGU_RESPON, DITERIMA, DITOLAK, DIBATALKAN | FLOWUSER #7 |
| Contract.status | ContractStatus | DEAL_MENUNGGU_BAYAR, DIBAYAR_DITAHAN, SIAP_JALAN, BERJALAN, SELESAI, DIBATALKAN_PASIEN, DIBATALKAN_MITRA, SENGKETA | payment #3/#6 |
| Payment.status | PaymentStatus | MENUNGGU_BAYAR, MENUNGGU_VERIFIKASI, DIBAYAR_DITAHAN, DITERUSKAN_PAYOUT, DIKEMBALIKAN_SEBAGIAN, DITAHAN_SENGKETA, GAGAL, DITOLAK | payment #7 |
| Payout.status | PayoutStatus | BELUM_LAYAK, LAYAK_BAYAR, DIPROSES, DIBAYARKAN, DIBAYARKAN_SEBAGIAN, GAGAL, DITAHAN | payment #7 |
| Deposit.status | DepositStatus | MENUNGGU_VERIFIKASI, AKTIF, KEDALUWARSA, DIPERBARUI, HANGUS_TERTANAM, HANGUS_PELANGGARAN, DIKEMBALIKAN, DITOLAK | payment #5.4/#7 |
| Attendance.status | AttendanceStatus | MENUNGGU_APPROVAL_PASIEN, DISETUJUI, DITOLAK, DISETUJUI_ADMIN, DITOLAK_ADMIN | payment #3.6 |
| Dispute.status | DisputeStatus | BARU, DITINJAU, BUTUH_INFO, SELESAI, DITUTUP | FLOWADMIN #16 |

---

## 3. Pemetaan ID Fitur → Tabel / Backend / Frontend

### A. Auth & Akun

| ID | Tabel | Backend (NestJS) | Frontend (Nuxt) | Status kode |
|---|---|---|---|---|
| A-01, A-02 | User, PatientProfile, CaregiverProfile, Consent | `modules/auth` (register; hash; role guard) | `pages/auth/index.vue` + form daftar per role | Ada sebagian (auth cookie JWT); profil telepon/foto/status belum lengkap |
| A-03 | User | `modules/auth` (login/logout/me, cookie `pedulikamu_token`) | `composables/useAuth.ts`, `middleware/auth-*.ts` | Ada, perlu tambah role ADMIN |
| A-04 | User | `modules/users` (PATCH /users/me) | `pages/family/dashboard.vue` (profil) | Ada sebagian |
| A-05 | User.accountStatus | `modules/users` + guard global (blokir non-Aktif) | banner status + redirect | Belum |
| A-06 | User | Prisma: rename `family→PASIEN, caregiver→MITRA`, tambah `admin`; seed admin | — | Belum (schema masih `family/caregiver`) |

### B. Verifikasi

| ID | Tabel | Backend | Frontend | Status |
|---|---|---|---|---|
| B-01 | CaregiverProfile | `modules/caregivers` (PATCH profil + bank) | `pages/caregiver/dashboard.vue` (profil) + profil publik | Ada sebagian (university/rate/tier/location); bank/bio/kompetensi belum |
| B-02 | CaregiverDocument | modul baru `modules/documents` (upload, validasi, ACL pemilik+admin) | form upload + daftar dokumen | Belum |
| B-03 | CaregiverProfile | `POST /caregivers/verification/submit` (cek kelengkapan) | tombol Ajukan | Belum |
| B-04 | CaregiverProfile, CaregiverDocument, Notification | `modules/admin` (PUT verify + alasan/field) | antrian verifikasi admin | Belum |
| B-05 | Consent | `POST /consents` (simpan kind+version+time) | checkbox wajib | Belum |

### C. Deposit

| ID | Tabel | Backend | Frontend | Status |
|---|---|---|---|---|
| C-01 | Deposit, Payment(type=COMMITMENT) | `modules/deposits` (POST + upload bukti) | halaman bayar deposit (QRIS) | Belum |
| C-02 | Deposit, Notification | `modules/admin` (verify deposit → isi periodStart/End) | antrian deposit | Belum |
| C-03, C-04 | CaregiverProfile.depositExpiresAt, Deposit | guard `DepositActiveGuard` + job/lazy-check kunci | banner terkunci + CTA bayar | Belum |
| C-05, C-06, C-07 | Deposit (`hasClientInPeriod` = EXISTS Contract+DIBAYAR dalam periode), Payout/transfer refund | `modules/admin` (job awal bulan: hangus vs kembali + TF) | riwayat deposit mitra | Belum |

### D–F. Need → Interest → Deal

| ID | Tabel | Backend | Frontend | Status |
|---|---|---|---|---|
| D-01–D-04 | ServiceNeed | modul baru `modules/needs` (CRUD, DRAFT→PUBLIK, filter wilayah/jenis/jadwal/kompetensi) | `pages/family/dashboard.vue` (buat), list kebutuhan mitra | Belum (baru `patients` CRUD) |
| E-01–E-03 | Interest, Notification | `modules/interests` (apply unik per need+caregiver; terima/tolak/batal) | list minat (pasien) + tombol apply (mitra) | Belum |
| F-01 | Message | `modules/messages` (chat scoped interest/contract) | thread chat | Belum |
| F-02–F-03 | Contract (kunci totalHours, hourlyRate, totalCost, radius, cancelPolicy) | `modules/contracts` (POST Deal dari interest DITERIMA; lock) | halaman Deal + ringkasan kontrak | Belum (baru `bookings` langsung) |

### G–J. Uang + Absensi + Payout

| ID | Tabel | Backend | Frontend | Status |
|---|---|---|---|---|
| G-01–G-04 | Payment(SERVICE), Contract | `modules/payments` (halaman QRIS, upload bukti, expiry 1x24 jam, escrow) + `modules/admin` (verify) | halaman bayar pasien | Belum |
| H-01–H-05 | Attendance, Contract | `modules/attendance` (clock-in/out: foto live, serverTime, GPS, radius check, pair session; approve/tolak; override; rekap workedHours) | tombol clock-in/out (camera-only) + approve + peta (pasien) | Belum |
| I-01–I-03 | Contract, ServiceNeed | `modules/contracts` (state machine SIAP_JALAN→BERJALAN→SELESAI; finish tarik rekap) | pantau layanan + tombol Selesaikan/Konfirmasi + riwayat | Belum |
| J-01–J-04 | Payout, Payment | `modules/payouts` (cek syarat; hitung gross−admin=net; TF manual+bukti) | riwayat pendapatan mitra | Belum |

### K–Q. Lanjutan

| ID | Tabel | Backend | Frontend | Status |
|---|---|---|---|---|
| K-01 | Contract(DIBATALKAN_PASIEN), Payout(reason=PASIEN_BATAL) | `POST /contracts/:id/cancel-by-patient` (tanpa refund, full→payout) | tombol Batal + modal persetujuan | Belum |
| K-02 | Contract, Payment(DIKEMBALIKAN_SEBAGIAN), Deposit(HANGUS_PELANGGARAN), User(DIBEKUKAN) | `POST /contracts/:id/misconduct` (beku + hangus + refund/jam) | alur lapor → putusan | Belum |
| K-03 | Dispute, Payout | sengketa pasca-payout (retroaktif) | halaman sengketa | Belum |
| L-01–L-03 | Review, CaregiverProfile(ratingAvg,totalFinished) | `modules/reviews` (1/layanan; hitung ulang; hiddenByAdmin) | form review + profil publik | Belum |
| M-01–M-02 | Dispute, Notification | `modules/disputes` + `modules/admin` | form lapor + antrian sengketa | Belum |
| N-01–N-05 | semua (read) | `modules/admin` (dashboard agregat; kelola user/status; 4 antrian uang; kelola review) | `pages/admin/**` (baru) | Belum (belum ada halaman admin) |
| O-01–O-04 | Consent, audit | guard persetujuan; ACL data sensitif; evaluasi kepatuhan | checkbox + error akses | Belum |
| P-01–P-03 | Notification | `modules/notifications` (in-app; trigger tiap event G/H/J/C/M) | bell + badge + list | Belum |
| Q-01–Q-04 | semua | seed E2E + script QA per skenario payment #10 | — | Belum |

---

## 4. Gap vs Kode Lama & Rencana Migrasi

**Yang bisa dipakai ulang:** `auth` (JWT cookie), `users`, `caregivers` (search dasar), `patients` (CRUD), pola `$fetch credentials:include`, middleware, SEO/routeRules.

**Yang harus dibangun baru (urutan sprint):**
1. Sprint 1: A-05/A-06/B (User status + role ADMIN + profil/dokumen/verifikasi/consent) + N-02 dasar.
2. Sprint 2: C (deposit) + N-04 antrian deposit + guard kunci.
3. Sprint 3: D+E+F (needs, interests, messages, contracts) + N-03 monitor.
4. Sprint 4: G (payment QRIS+escrow) + N-04 antrian bayar.
5. Sprint 5: H+I (attendance + lifecycle layanan) + P notif terkait.
6. Sprint 6: J+K (payout, batal, wanprestasi) + N-04 antrian payout/refund.
7. Sprint 7: L+M+N-01/N-05+O+P sisa + Q-01–Q-04 E2E.
8. Setelah parity: migrasi `Booking` lama → `Contract` (script + QA), lalu hapus modul `bookings` lama.

**Keputusan produk yang memblokir coding (dari payment #11):** nominal deposit, `%` admin, 2 bulan = 60 hari vs kalender, definisi klien, refund deposit otomatis vs ajukan, batas QRIS + auto-cancel, jadwal payout, rekening wajib awal atau saat payout, QRIS statis vs kode unik, radius absensi, pembulatan durasi, camera-only vs galeri, batas approve + override, lokasi wajib koordinat atau teks.
