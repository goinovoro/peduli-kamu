-- AlterEnum
ALTER TYPE "ContractStatus" ADD VALUE 'MENUNGGU_KONFIRMASI';

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "approvedSessions" INTEGER,
ADD COLUMN     "workedMinutes" INTEGER;
