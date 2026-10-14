import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

/**
 * N-01: gambaran operasional platform untuk Admin.
 * Semua angka dihitung live dari tabel (spot-check vs data).
 */
@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async stats() {
    const [
      pasien,
      mitra,
      verifikasiAntrian,
      dokumenAntrian,
      depositAntrian,
      paymentAntrian,
      needAktif,
      minatTunggu,
      berjalan,
      menungguKonfirmasi,
      payoutLayak,
      sengketaTerbuka,
      layananSelesai,
      escrow,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: { in: ['PASIEN', 'family'] } } }),
      this.prisma.user.count({ where: { role: { in: ['MITRA', 'caregiver'] } } }),
      this.prisma.caregiver.count({ where: { verificationStatus: 'DITINJAU' } }),
      this.prisma.caregiverDocument.count({ where: { status: 'MENUNGGU' } }),
      this.prisma.deposit.count({ where: { status: 'MENUNGGU_VERIFIKASI' } }),
      this.prisma.payment.count({ where: { status: 'MENUNGGU_VERIFIKASI' } }),
      this.prisma.serviceNeed.count({
        where: { status: { in: ['DIPUBLIKASIKAN', 'DALAM_PEMBAHASAN'] } },
      }),
      this.prisma.interest.count({ where: { status: 'MENUNGGU_RESPON' } }),
      this.prisma.contract.count({ where: { status: 'BERJALAN' } }),
      this.prisma.contract.count({ where: { status: 'MENUNGGU_KONFIRMASI' } }),
      this.prisma.payout.count({ where: { status: 'LAYAK_BAYAR' } }),
      this.prisma.dispute.count({ where: { status: { in: ['BARU', 'DITINJAU', 'BUTUH_INFO'] } } }),
      this.prisma.contract.count({ where: { status: 'SELESAI' } }),
      this.prisma.payment.aggregate({
        where: { type: 'SERVICE', status: 'DIBAYAR_DITAHAN' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);
    return {
      pengguna: { pasien, mitra },
      antrian: {
        verifikasiMitra: verifikasiAntrian,
        dokumen: dokumenAntrian,
        deposit: depositAntrian,
        pembayaran: paymentAntrian,
        payoutLayak: payoutLayak,
        sengketaTerbuka,
      },
      operasional: {
        needAktif,
        minatMenunggu: minatTunggu,
        layananBerjalan: berjalan,
        menungguKonfirmasi: menungguKonfirmasi,
        layananSelesai,
      },
      escrow: { kontrak: escrow._count, totalDitahan: escrow._sum.amount ?? 0 },
    };
  }

  /** N-03: monitor kebutuhan (filter ?status=). */
  needs(status?: string) {
    return this.prisma.serviceNeed.findMany({
      where: status ? { status: status as any } : {},
      include: {
        patientUser: { select: { id: true, name: true, email: true } },
        _count: { select: { interests: true } },
        contract: { select: { id: true, status: true, totalCost: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /** N-03: monitor kontrak + relasi uang (filter ?status=). */
  contracts(status?: string) {
    return this.prisma.contract.findMany({
      where: status ? { status: status as any } : {},
      include: {
        need: { select: { id: true, serviceType: true, locationText: true } },
        caregiver: { include: { user: { select: { id: true, name: true } } } },
        payments: { select: { id: true, amount: true, status: true } },
        payout: { select: { id: true, netAmount: true, status: true } },
      },
      orderBy: { agreedAt: 'desc' },
      take: 100,
    });
  }

  /** H-04: monitor absensi (filter ?status= / ?flag=Lokasi untuk FLAG_LOKASI). */
  attendances(status?: string, flag?: string) {
    return this.prisma.attendance.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(flag === 'lokasi' ? { insideRadius: false } : {}),
      },
      include: {
        contract: { select: { id: true, serviceType: true, status: true } },
        caregiver: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /** N-05: semua review untuk moderasi (termasuk yang disembunyikan). */
  reviews() {
    return this.prisma.review.findMany({
      include: {
        reviewer: { select: { id: true, name: true } },
        reviewedCaregiver: { include: { user: { select: { id: true, name: true } } } },
        contract: { select: { id: true, serviceType: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
