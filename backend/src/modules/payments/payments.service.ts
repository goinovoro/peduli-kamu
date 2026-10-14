import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export function paymentExpiryHours() {
  return Number(process.env.PAYMENT_EXPIRY_HOURS ?? 24);
}

export function qrisImageUrl() {
  return process.env.QRIS_IMAGE_URL ?? null;
}

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  private async ownedContract(patientUserId: string, contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { need: true },
    });
    if (!contract) throw new NotFoundException('Kontrak tidak ditemukan');
    if (contract.patientUserId !== patientUserId) {
      throw new ForbiddenException('Bukan kontrak Anda');
    }
    return contract;
  }

  /**
   * G-02: pasien bayar full via QRIS + upload bukti.
   * Hanya saat kontrak DEAL_MENUNGGU_BAYAR; cegah bukti ganda.
   */
  async payService(patientUserId: string, contractId: string, proofUrl: string) {
    const contract = await this.ownedContract(patientUserId, contractId);
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.contract.findUnique({ where: { id: contractId } });
      if (!current || current.patientUserId !== patientUserId || current.status !== 'DEAL_MENUNGGU_BAYAR') {
        throw new ConflictException('Kontrak tidak lagi menunggu pembayaran');
      }
      const pending = await tx.payment.findFirst({
        where: { contractId, type: 'SERVICE', status: { in: ['MENUNGGU_VERIFIKASI', 'DIBAYAR_DITAHAN'] } },
      });
      if (pending) throw new ConflictException('Sudah ada pembayaran untuk kontrak ini');
      return tx.payment.create({
        data: {
          type: 'SERVICE',
          payerUserId: patientUserId,
          contractId,
          amount: current.totalCost,
          method: 'QRIS_MANUAL',
          proofImageUrl: proofUrl,
          status: 'MENUNGGU_VERIFIKASI',
          hourlyRateSnapshot: current.hourlyRate,
        },
      });
    });
  }

  /** Pembayaran milik saya (sebagai pembayar). */
  mine(userId: string) {
    return this.prisma.payment.findMany({
      where: { payerUserId: userId },
      orderBy: { submittedAt: 'desc' },
    });
  }

  /** N-04: antrian verifikasi pembayaran (admin). */
  queue(type?: string, status?: string) {
    return this.prisma.payment.findMany({
      where: {
        ...(type ? { type: type as any } : {}),
        ...(status ? { status: status as any } : {}),
      },
      include: {
        contract: { select: { id: true, totalCost: true, status: true } },
        payer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  /**
   * G-03/G-04: verifikasi admin.
   * Setuju → DIBAYAR_DITAHAN (escrow) + kontrak & need SIAP_JALAN + notif kedua pihak.
   * Tolak → DITOLAK + alasan (pasien bisa upload ulang).
   */
  async verify(id: string, adminId: string, approve: boolean, note?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { contract: { include: { need: true } } },
    });
    if (!payment) throw new NotFoundException('Pembayaran tidak ditemukan');
    if (payment.status !== 'MENUNGGU_VERIFIKASI') {
      throw new ConflictException('Pembayaran sudah diproses');
    }
    if (!approve) {
      const rejected = await this.prisma.payment.updateMany({
        where: { id, status: 'MENUNGGU_VERIFIKASI' },
        data: { status: 'DITOLAK', rejectReason: note ?? null, verifiedByAdminId: adminId, verifiedAt: new Date() },
      });
      if (rejected.count !== 1) throw new ConflictException('Pembayaran sudah diproses Admin lain');
      await this.notifications.notify(
        payment.payerUserId,
        'PEMBAYARAN_DITOLAK',
        'Bukti pembayaran ditolak',
        note ?? 'Periksa bukti pembayaran lalu unggah ulang sebelum batas waktu pembayaran.',
      );
      return this.prisma.payment.findUnique({ where: { id } });
    }
    if (payment.type !== 'SERVICE' || !payment.contractId || !payment.contract) {
      throw new ConflictException('Pembayaran ini harus diverifikasi melalui antrian deposit');
    }
    if (payment.contract.status !== 'DEAL_MENUNGGU_BAYAR') {
      throw new ConflictException('Kontrak sudah dibatalkan atau tidak lagi menunggu pembayaran');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const changedPayment = await tx.payment.updateMany({
        where: { id, status: 'MENUNGGU_VERIFIKASI' },
        data: { status: 'DIBAYAR_DITAHAN', verifiedByAdminId: adminId, verifiedAt: new Date() },
      });
      if (changedPayment.count !== 1) throw new ConflictException('Pembayaran sudah diproses Admin lain');
      const changedContract = await tx.contract.updateMany({
        where: { id: payment.contractId!, status: 'DEAL_MENUNGGU_BAYAR' },
        data: { status: 'SIAP_JALAN' },
      });
      if (changedContract.count !== 1) throw new ConflictException('Kontrak sudah berubah');
      await tx.serviceNeed.update({
        where: { id: payment.contract!.needId },
        data: { status: 'SIAP_JALAN' },
      });
      return tx.payment.findUniqueOrThrow({ where: { id } });
    });
    const contract = payment.contract;
    await this.notifications.notify(
      contract.patientUserId,
      'PEMBAYARAN_DIBAYAR',
      'Pembayaran terverifikasi',
      'Dana Anda ditahan aman. Layanan siap dimulai sesuai jadwal.',
    );
    const cg = await this.prisma.caregiver.findUnique({ where: { id: contract.caregiverId } });
    if (cg) {
      await this.notifications.notify(
        cg.userId,
        'PEMBAYARAN_PASIEN_LOLOS',
        'Pembayaran pasien lolos verifikasi',
        'Layanan siap dimulai sesuai jadwal kontrak.',
      );
    }
    return updated;
  }

  /**
   * G-03: Deal yang tidak dibayar melewati batas (default 1x24 jam) → batal otomatis,
   * kebutuhan kembali Aktif (DIPUBLIKASIKAN) agar bisa dilamar ulang.
   */
  async processExpiry() {
    const cutoff = new Date(Date.now() - paymentExpiryHours() * 3600 * 1000);
    const stale = await this.prisma.contract.findMany({
      where: {
        status: 'DEAL_MENUNGGU_BAYAR',
        agreedAt: { lt: cutoff },
        payments: { none: { status: { in: ['MENUNGGU_VERIFIKASI', 'DIBAYAR_DITAHAN'] } } },
      },
    });
    for (const c of stale) {
      await this.prisma.contract.update({ where: { id: c.id }, data: { status: 'DIBATALKAN_PASIEN' } });
      await this.prisma.serviceNeed.update({ where: { id: c.needId }, data: { status: 'DIPUBLIKASIKAN' } });
      await this.notifications.notify(
        c.patientUserId,
        'DEAL_KEDALUWARSA',
        'Deal dibatalkan otomatis',
        'Batas waktu pembayaran terlewati. Kebutuhan Anda kembali aktif.',
      );
    }
    return { dibatalkan: stale.length };
  }
}
