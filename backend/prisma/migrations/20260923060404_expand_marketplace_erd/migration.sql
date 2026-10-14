-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('BELUM_LENGKAP', 'AKTIF', 'TIDAK_AKTIF', 'DITANGGUHKAN', 'DIBLOKIR', 'TERKUNCI_PERIODE', 'DIBEKUKAN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('MENUNGGU', 'DITINJAU', 'DISETUJUI', 'DITOLAK', 'PERLU_PERBAIKAN');

-- CreateEnum
CREATE TYPE "NeedStatus" AS ENUM ('DRAFT', 'DIPUBLIKASIKAN', 'DALAM_PEMBAHASAN', 'DEAL', 'MENUNGGU_PEMBAYARAN', 'SIAP_JALAN', 'BERJALAN', 'SELESAI', 'DIBATALKAN', 'SENGKETA');

-- CreateEnum
CREATE TYPE "InterestStatus" AS ENUM ('MENUNGGU_RESPON', 'DITERIMA', 'DITOLAK', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DEAL_MENUNGGU_BAYAR', 'DIBAYAR_DITAHAN', 'SIAP_JALAN', 'BERJALAN', 'SELESAI', 'DIBATALKAN_PASIEN', 'DIBATALKAN_MITRA', 'SENGKETA');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('SERVICE', 'COMMITMENT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('MENUNGGU_BAYAR', 'MENUNGGU_VERIFIKASI', 'DIBAYAR_DITAHAN', 'DITERUSKAN_PAYOUT', 'DIKEMBALIKAN_SEBAGIAN', 'DITAHAN_SENGKETA', 'GAGAL', 'DITOLAK');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('BELUM_LAYAK', 'LAYAK_BAYAR', 'DIPROSES', 'DIBAYARKAN', 'DIBAYARKAN_SEBAGIAN', 'GAGAL', 'DITAHAN');

-- CreateEnum
CREATE TYPE "PayoutReason" AS ENUM ('SELESAI_NORMAL', 'PASIEN_BATAL');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('MENUNGGU_VERIFIKASI', 'AKTIF', 'KEDALUWARSA', 'DIPERBARUI', 'HANGUS_TERTANAM', 'HANGUS_PELANGGARAN', 'DIKEMBALIKAN', 'DITOLAK');

-- CreateEnum
CREATE TYPE "AttendanceType" AS ENUM ('CLOCK_IN', 'CLOCK_OUT');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('MENUNGGU_APPROVAL_PASIEN', 'DISETUJUI', 'DITOLAK', 'DISETUJUI_ADMIN', 'DITOLAK_ADMIN');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('KTP', 'IJAZAH', 'SERTIFIKAT', 'STR', 'LAINNYA');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('MENUNGGU', 'DISETUJUI', 'DITOLAK', 'PERLU_PERBAIKAN');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('BARU', 'DITINJAU', 'BUTUH_INFO', 'SELESAI', 'DITUTUP');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'PASIEN';
ALTER TYPE "Role" ADD VALUE 'MITRA';

-- AlterTable
ALTER TABLE "Caregiver" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNo" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "certifications" TEXT,
ADD COLUMN     "competencies" TEXT,
ADD COLUMN     "depositExpiresAt" TIMESTAMP(3),
ADD COLUMN     "domicile" TEXT,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "experience" TEXT,
ADD COLUMN     "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "serviceArea" TEXT,
ADD COLUMN     "strNo" TEXT,
ADD COLUMN     "totalFinished" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verificationNote" TEXT,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'MENUNGGU';

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "conditionNotes" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountStatus" "AccountStatus" NOT NULL DEFAULT 'AKTIF',
ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "region" TEXT;

-- CreateTable
CREATE TABLE "ServiceNeed" (
    "id" TEXT NOT NULL,
    "patientUserId" TEXT NOT NULL,
    "patientProfileId" TEXT,
    "serviceType" TEXT NOT NULL,
    "forWhom" TEXT,
    "locationText" TEXT NOT NULL,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "schedule" TEXT,
    "durationHoursPerDay" INTEGER,
    "frequency" TEXT,
    "totalHours" INTEGER,
    "conditionDesc" TEXT,
    "specialNeeds" TEXT,
    "budgetEstimate" INTEGER,
    "description" TEXT,
    "status" "NeedStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceNeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL,
    "needId" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "intro" TEXT,
    "relevantExp" TEXT,
    "availability" TEXT,
    "status" "InterestStatus" NOT NULL DEFAULT 'MENUNGGU_RESPON',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "needId" TEXT NOT NULL,
    "interestId" TEXT,
    "patientUserId" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "schedule" TEXT,
    "totalHours" INTEGER NOT NULL,
    "hourlyRate" INTEGER NOT NULL,
    "totalCost" INTEGER NOT NULL,
    "locationText" TEXT NOT NULL,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "attendanceRadiusM" INTEGER DEFAULT 150,
    "scope" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "cancelPolicy" TEXT NOT NULL DEFAULT 'TANPA_REFUND_JIKA_PASIEN_BATAL',
    "status" "ContractStatus" NOT NULL DEFAULT 'DEAL_MENUNGGU_BAYAR',
    "agreedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "type" "PaymentType" NOT NULL,
    "payerUserId" TEXT NOT NULL,
    "contractId" TEXT,
    "depositId" TEXT,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'QRIS_MANUAL',
    "proofImageUrl" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'MENUNGGU_BAYAR',
    "refundAmount" INTEGER,
    "refundProofUrl" TEXT,
    "workedHours" INTEGER,
    "missingHours" INTEGER,
    "hourlyRateSnapshot" INTEGER,
    "verifiedByAdminId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "refundedByAdminId" TEXT,
    "rejectReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "grossAmount" INTEGER NOT NULL,
    "adminFeePercent" INTEGER NOT NULL,
    "adminFeeAmount" INTEGER NOT NULL,
    "netAmount" INTEGER NOT NULL,
    "bankNameSnap" TEXT,
    "bankAccountNoSnap" TEXT,
    "bankAccountNameSnap" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'BELUM_LAYAK',
    "reason" "PayoutReason" NOT NULL DEFAULT 'SELESAI_NORMAL',
    "proofTfUrl" TEXT,
    "paidByAdminId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deposit" (
    "id" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "status" "DepositStatus" NOT NULL DEFAULT 'MENUNGGU_VERIFIKASI',
    "proofImageUrl" TEXT,
    "hasClientInPeriod" BOOLEAN NOT NULL DEFAULT false,
    "verifiedByAdminId" TEXT,
    "refundProofUrl" TEXT,
    "freezeReason" TEXT,
    "frozenUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "type" "AttendanceType" NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "serverTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "accuracyM" INTEGER,
    "insideRadius" BOOLEAN NOT NULL DEFAULT true,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'MENUNGGU_APPROVAL_PASIEN',
    "sessionPairId" TEXT,
    "rejectReason" TEXT,
    "patientApprovedBy" TEXT,
    "patientApprovedAt" TIMESTAMP(3),
    "adminOverrideBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaregiverDocument" (
    "id" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "kind" "DocumentKind" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'MENUNGGU',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaregiverDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "contractId" TEXT,
    "interestId" TEXT,
    "senderUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "reviewerUserId" TEXT NOT NULL,
    "reviewedCaregiverId" TEXT NOT NULL,
    "punctuality" INTEGER NOT NULL,
    "professionalism" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "quality" INTEGER NOT NULL,
    "overall" INTEGER NOT NULL,
    "comment" TEXT,
    "hiddenByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "reportedUserId" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceUrls" TEXT,
    "status" "DisputeStatus" NOT NULL DEFAULT 'BARU',
    "decision" TEXT,
    "handledByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "linkUrl" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1',
    "agreedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Interest_needId_caregiverId_key" ON "Interest"("needId", "caregiverId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_needId_key" ON "Contract"("needId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_interestId_key" ON "Contract"("interestId");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_contractId_key" ON "Payout"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_contractId_reviewerUserId_key" ON "Review"("contractId", "reviewerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Consent_userId_kind_version_key" ON "Consent"("userId", "kind", "version");

-- AddForeignKey
ALTER TABLE "ServiceNeed" ADD CONSTRAINT "ServiceNeed_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_needId_fkey" FOREIGN KEY ("needId") REFERENCES "ServiceNeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_needId_fkey" FOREIGN KEY ("needId") REFERENCES "ServiceNeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payerUserId_fkey" FOREIGN KEY ("payerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "Deposit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_verifiedByAdminId_fkey" FOREIGN KEY ("verifiedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_refundedByAdminId_fkey" FOREIGN KEY ("refundedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_paidByAdminId_fkey" FOREIGN KEY ("paidByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_verifiedByAdminId_fkey" FOREIGN KEY ("verifiedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_patientApprovedBy_fkey" FOREIGN KEY ("patientApprovedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_adminOverrideBy_fkey" FOREIGN KEY ("adminOverrideBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaregiverDocument" ADD CONSTRAINT "CaregiverDocument_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewedCaregiverId_fkey" FOREIGN KEY ("reviewedCaregiverId") REFERENCES "Caregiver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_handledByAdminId_fkey" FOREIGN KEY ("handledByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
