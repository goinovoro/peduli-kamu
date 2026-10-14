import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'password123', 10);

  // ---- Data demo lama (kompatibilitas modul bookings) ----
  const family = await prisma.user.upsert({
    where: { email: 'keluarga@contoh.id' },
    update: {},
    create: { email: 'keluarga@contoh.id', name: 'Keluarga Budi', password, role: 'family' },
  });

  const siti = await prisma.user.upsert({
    where: { email: 'siti@contoh.id' },
    update: {},
    create: { email: 'siti@contoh.id', name: 'Siti Rahma', password, role: 'caregiver' },
  });

  await prisma.caregiver.upsert({
    where: { userId: siti.id },
    update: {},
    create: {
      userId: siti.id,
      university: 'Poltekkes Kemenkes Jakarta I',
      graduationYear: 2023,
      ratePerHour: 75000,
      strStatus: 'STR_AKTIF',
      tier: 'skilled',
      location: 'Jakarta Selatan',
    },
  });

  let patient = await prisma.patient.findFirst({ where: { ownerId: family.id, name: 'Opa Hendra' } });
  if (!patient) {
    patient = await prisma.patient.create({
      data: { name: 'Opa Hendra', age: 75, tier: 'skilled', ownerId: family.id },
    });
  }

  const caregiver = await prisma.caregiver.findFirstOrThrow({ where: { userId: siti.id } });

  const bookingCount = await prisma.booking.count({
    where: { patientId: patient.id, caregiverId: caregiver.id, familyId: family.id },
  });
  if (bookingCount === 0) {
    await prisma.booking.create({
      data: {
        patientId: patient.id,
        caregiverId: caregiver.id,
        familyId: family.id,
        date: new Date('2026-10-01T09:00:00Z'),
        status: 'upcoming',
      },
    });
  }

  // ---- Admin internal (FLOWADMIN.md #3, FEATURE A-03/A-06/N-02) ----
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@pedulikamu.id';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'admin', accountStatus: 'AKTIF' },
    create: {
      email: adminEmail,
      name: 'Admin Peduli Kamu',
      password: adminPassword,
      role: 'admin',
      accountStatus: 'AKTIF',
    },
  });

  // ---- Demo role baru (fondasi Sprint 1 / ERD docs/ERD.md) ----
  const pasien = await prisma.user.upsert({
    where: { email: 'pasien@contoh.id' },
    update: {},
    create: {
      email: 'pasien@contoh.id',
      name: 'Pasien Demo',
      phone: '081200000001',
      password,
      role: 'PASIEN',
      accountStatus: 'AKTIF',
      city: 'Jakarta Selatan',
      region: 'DKI Jakarta',
    },
  });
  await prisma.consent.upsert({
    where: { userId_kind_version: { userId: pasien.id, kind: 'KETENTUAN_PLATFORM', version: 'v1' } },
    update: {},
    create: { userId: pasien.id, kind: 'KETENTUAN_PLATFORM', version: 'v1' },
  });

  const mitra = await prisma.user.upsert({
    where: { email: 'mitra@contoh.id' },
    update: {},
    create: {
      email: 'mitra@contoh.id',
      name: 'Mitra Demo',
      phone: '081200000002',
      password,
      role: 'MITRA',
      accountStatus: 'AKTIF',
    },
  });
  await prisma.caregiver.upsert({
    where: { userId: mitra.id },
    update: {},
    create: {
      userId: mitra.id,
      university: 'Poltekkes Kemenkes Jakarta I',
      graduationYear: 2022,
      ratePerHour: 100000,
      strStatus: 'STR_AKTIF',
      tier: 'skilled',
      location: 'Jakarta Selatan',
      domicile: 'Jakarta Selatan',
      serviceArea: 'Jabodetabek',
      education: 'D3 Keperawatan',
      verificationStatus: 'DISETUJUI',
      bankName: 'BCA',
      bankAccountNo: '0000000000',
      bankAccountName: 'Mitra Demo',
    },
  });
  await prisma.consent.upsert({
    where: { userId_kind_version: { userId: mitra.id, kind: 'KETENTUAN_PLATFORM', version: 'v1' } },
    update: {},
    create: { userId: mitra.id, kind: 'KETENTUAN_PLATFORM', version: 'v1' },
  });

  console.log('Seed selesai:');
  console.log('- keluarga@contoh.id / siti@contoh.id (password123) [role lama]');
  console.log(`- ${adminEmail} (role admin, password dari ADMIN_PASSWORD atau password123)`);
  console.log('- pasien@contoh.id / mitra@contoh.id (password123) [role baru PASIEN/MITRA]');
}

main().finally(() => prisma.$disconnect());
