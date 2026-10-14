import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/** Status payout yang masih bisa dibayar (dirilis) oleh Admin. */
const PAYABLE = ['LAYAK_BAYAR', 'DITAHAN', 'GAGAL'];

@Injectable()
export class PayoutsService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  /** J-04: antrian payout untuk Admin. */
  queue(status?: string) {
    return this.prisma.payout.findMany({
      where: status ? { status: status as any } : {},
      include: {
        contract: { select: { id: true, serviceType: true, status: true, totalCost: true } },
        caregiver: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** J-03: riwayat pendapatan mitra. */
  mine(userId: string) {
    return this.prisma.caregiver
      .findUnique({ where: { userId } })
      .then((cg) =>
        cg
          ? this.prisma.payout.findMany({ where: { caregiverId: cg.id }, orderBy: { createdAt: 'desc' } })
          : [],
      );
  }

  /**
   * J-03: Admin TF manual + bukti → DIBAYARKAN.
   * Bisa dari LAYAK_BAYAR / DITAHAN (rilis) / GAGAL (coba lagi).
   */
  async pay(id: string, adminId: string, proofTfUrl: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id },
      include: { caregiver: true },
    });
    if (!payout) throw new NotFoundException('Payout tidak ditemukan');
    if (!PAYABLE.includes(payout.status)) {
      throw new ConflictException('Payout tidak dalam status bisa-bayar');
    }
    if (!proofTfUrl) throw new BadRequestException('Bukti TF wajib');
    const bankName = payout.bankNameSnap || payout.caregiver.bankName;
    const bankAccountNo = payout.bankAccountNoSnap || payout.caregiver.bankAccountNo;
    const bankAccountName = payout.bankAccountNameSnap || payout.caregiver.bankAccountName;
    if (!bankName || !bankAccountNo || !bankAccountName) {
      throw new BadRequestException('Data rekening Mitra belum lengkap. Minta Mitra melengkapi profil sebelum transfer.');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.payout.updateMany({
        where: { id, status: { in: PAYABLE as any } },
        data: {
          status: 'DIBAYARKAN',
          proofTfUrl,
          paidByAdminId: adminId,
          paidAt: new Date(),
          bankNameSnap: bankName,
          bankAccountNoSnap: bankAccountNo,
          bankAccountNameSnap: bankAccountName,
        },
      });
      if (changed.count !== 1) throw new ConflictException('Payout sudah diproses Admin lain');
      return tx.payout.findUniqueOrThrow({ where: { id } });
    });
    await this.notifications.notify(
      payout.caregiver.userId,
      'PAYOUT_DIBAYARKAN',
      'Payout dibayarkan',
      `Rp${payout.netAmount} ditransfer ke ${payout.bankNameSnap ?? 'rekening'} Anda.`,
    );
    return updated;
  }

  /** J-04: tahan payout (sengketa / verifikasi lanjutan). */
  async hold(id: string, adminId: string, note?: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id } });
    if (!payout) throw new NotFoundException('Payout tidak ditemukan');
    if (payout.status === 'DIBAYARKAN' || payout.status === 'DIBAYARKAN_SEBAGIAN') {
      throw new ConflictException('Payout sudah dibayar');
    }
    const updated = await this.prisma.payout.update({ where: { id }, data: { status: 'DITAHAN' } });
    const cg = await this.prisma.caregiver.findUnique({ where: { id: payout.caregiverId } });
    if (cg) {
      await this.notifications.notify(
        cg.userId,
        'PAYOUT_DITAHAN',
        'Payout ditahan sementara',
        note ?? 'Admin menahan payout untuk pemeriksaan lanjutan.',
      );
    }
    void adminId;
    return updated;
  }

  /** J-04: tandai gagal (rekening salah / bank gangguan) agar bisa diproses ulang. */
  async fail(id: string, adminId: string, note?: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id } });
    if (!payout) throw new NotFoundException('Payout tidak ditemukan');
    if (payout.status === 'DIBAYARKAN' || payout.status === 'DIBAYARKAN_SEBAGIAN') {
      throw new ConflictException('Payout sudah dibayar');
    }
    const updated = await this.prisma.payout.update({ where: { id }, data: { status: 'GAGAL' } });
    const cg = await this.prisma.caregiver.findUnique({ where: { id: payout.caregiverId } });
    if (cg) {
      await this.notifications.notify(
        cg.userId,
        'PAYOUT_GAGAL',
        'Payout gagal diproses',
        note ?? 'Periksa data rekening Anda lalu hubungi Admin.',
      );
    }
    void adminId;
    return updated;
  }

  /** Otorisasi baca: pemilik payout atau admin. */
  async findOne(userId: string, role: string, id: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id },
      include: { contract: true },
    });
    if (!payout) throw new NotFoundException('Payout tidak ditemukan');
    if (role === 'admin') return payout;
    const cg = await this.prisma.caregiver.findUnique({ where: { userId } });
    if (cg && payout.caregiverId === cg.id) return payout;
    throw new ForbiddenException('Bukan payout Anda');
  }
}
