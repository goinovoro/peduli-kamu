-- CreateEnum
CREATE TYPE "Role" AS ENUM ('family', 'caregiver', 'admin');

-- CreateEnum
CREATE TYPE "CareTier" AS ENUM ('companion', 'skilled');

-- CreateEnum
CREATE TYPE "StrStatus" AS ENUM ('MENUNGGU_STR', 'STR_AKTIF');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'upcoming', 'past', 'cancelled');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "tier" "CareTier" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caregiver" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "university" TEXT NOT NULL,
    "graduationYear" INTEGER NOT NULL,
    "ratePerHour" INTEGER NOT NULL,
    "strStatus" "StrStatus" NOT NULL DEFAULT 'MENUNGGU_STR',
    "tier" "CareTier" NOT NULL,
    "location" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Caregiver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Caregiver_userId_key" ON "Caregiver"("userId");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caregiver" ADD CONSTRAINT "Caregiver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
