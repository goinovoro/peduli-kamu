import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const LOCKED_STATUSES = ['TERKUNCI_PERIODE', 'DIBEKUKAN', 'DIBLOKIR', 'DITANGGUHKAN'];

export function depositAmount() {
  return Number(process.env.DEPOSIT_AMOUNT ?? 200000);
}

export function depositDurationMonths() {
  return Number(process.env.DEPOSIT_DURATION_MONTHS ?? 2);
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

@Injectable()
export class DepositsService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  private async caregiverOf(userId: string) {
    const caregiver = await this.prisma.caregiver.findUnique({ where: { userId } });
    if (!caregiver) throw new NotFoundException('Profil caregiver tidak ditemukan');
    return caregiver;
  }

  /** Status deposit berjalan + apakah akun boleh operasi (C-03/C-04). */
  async current(userId: string) {
    const caregiver = await this.caregiverOf(userId);
    const latest = await this.prisma.deposit.findFirst({
      where: { caregiverId: caregiver.id },
      orderBy: { createdAt: 'desc' },
    });
    const now = new Date();
    const active =
      !!caregiver.depositExpiresAt &&
      caregiver.depositExpiresAt > now &&
      latest?.status === 'AKTIF';
    // Pernah punya deposit tapi masa berlakunya sudah lewat → wajib bayar periode baru.
    const expired = !active && !!caregiver.depositExpiresAt && caregiver.depositExpiresAt <= now;
    return {
      active,
      expired,
      expiresAt: caregiver.depositExpiresAt,
      amount: depositAmount(),
      durationMonths: depositDurationMonths(),
      latest,
    };
  }

  /**
   * C-01: mitra bayar deposit via QRIS + upload bukti.
   * Nominal dikunci dari server (DEPOSIT_AMOUNT), bukan dari client.
   */
  async create(userId: string, proofUrl: string) {
    const caregiver = await this.caregiverOf(userId);
    if (caregiver.verificationStatus !== 'DISETUJUI') {
      throw new ForbiddenException('Verifikasi Mitra harus disetujui sebelum membayar deposit');
    }
    const amount = depositAmount();
    return this.prisma.$transaction(async (tx) => {
      const pending = await tx.deposit.findFirst({
        where: { caregiverId: caregiver.id, status: 'MENUNGGU_VERIFIKASI' },
      });
      if (pending) throw new ConflictException('Sudah ada pembayaran deposit yang menunggu verifikasi');
      const deposit = await tx.deposit.create({
        data: { caregiverId: caregiver.id, amount, proofImageUrl: proofUrl, status: 'MENUNGGU_VERIFIKASI' },
      });
      await tx.payment.create({
        data: {
          type: 'COMMITMENT',
          payerUserId: userId,
          depositId: deposit.id,
          amount,
          method: 'QRIS_MANUAL',
          proofImageUrl: proofUrl,
          status: 'MENUNGGU_VERIFIKASI',
        },
      });
      return deposit;
    });
  }

  mine(userId: string) {
    return this.caregiverOf(userId).then((c) =>
      this.prisma.deposit.findMany({ where: { caregiverId: c.id }, orderBy: { createdAt: 'desc' } }),
    );
  }

  /** N-04: antrian verifikasi deposit untuk Admin. */
  queue(status?: string) {
    return this.prisma.deposit.findMany({
      where: status ? { status: status as any } : {},
      include: { caregiver: { include: { user: { select: { id: true, name: true, email: true } } } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * C-02: verifikasi deposit oleh Admin.
   * Setuju → AKTIF 2 bulan + depositExpiresAt + unlock akun + tandai deposit AKTIF lama jadi DIPERBARUI.
   * Tolak → DITOLAK + alasan di payment.
   */
  async verify(id: string, adminId: string, approve: boolean, note?: string) {
    const deposit = await this.prisma.deposit.findUnique({
      where: { id },
      include: { caregiver: true },
    });
    if (!deposit) throw new NotFoundException('Deposit tidak ditemukan');
    if (deposit.status !== 'MENUNGGU_VERIFIKASI') {
      throw new ConflictException('Deposit sudah diproses');
    }
    if (!approve) {
      const rejected = await this.prisma.$transaction(async (tx) => {
        const paymentUpdate = await tx.payment.updateMany({
          where: { depositId: id, status: 'MENUNGGU_VERIFIKASI' },
          data: { status: 'DITOLAK', rejectReason: note ?? null, verifiedByAdminId: adminId, verifiedAt: new Date() },
        });
        if (paymentUpdate.count !== 1) throw new ConflictException('Pembayaran deposit sudah diproses atau tidak ditemukan');
        const depositUpdate = await tx.deposit.updateMany({
          where: { id, status: 'MENUNGGU_VERIFIKASI' },
          data: { status: 'DITOLAK' },
        });
        if (depositUpdate.count !== 1) throw new ConflictException('Deposit sudah diproses Admin lain');
        return tx.deposit.findUniqueOrThrow({ where: { id } });
      });
      const rejCg = await this.prisma.caregiver.findUnique({ where: { id: deposit.caregiverId } });
      if (rejCg) {
        await this.notifications.notify(
          rejCg.userId,
          'DEPOSIT_DITOLAK',
          'Bukti deposit ditolak',
          note ?? 'Periksa kembali bukti bayar lalu unggah ulang.',
        );
      }
      return rejected;
    }
    if (deposit.caregiver.verificationStatus !== 'DISETUJUI') {
      throw new ConflictException('Verifikasi Mitra tidak lagi aktif; deposit belum dapat diaktifkan');
    }
    const periodStart = new Date();
    const periodEnd = addMonths(periodStart, depositDurationMonths());
    const { updated, caregiver } = await this.prisma.$transaction(async (tx) => {
      const paymentUpdate = await tx.payment.updateMany({
        where: { depositId: id, status: 'MENUNGGU_VERIFIKASI' },
        data: { status: 'DITERUSKAN_PAYOUT', verifiedByAdminId: adminId, verifiedAt: new Date() },
      });
      if (paymentUpdate.count !== 1) throw new ConflictException('Pembayaran deposit sudah diproses atau tidak ditemukan');
      const depositUpdate = await tx.deposit.updateMany({
        where: { id, status: 'MENUNGGU_VERIFIKASI' },
        data: {
          status: 'AKTIF',
          periodStart,
          periodEnd,
          hasClientInPeriod: false,
          verifiedByAdminId: adminId,
        },
      });
      if (depositUpdate.count !== 1) throw new ConflictException('Deposit sudah diproses Admin lain');
      await tx.deposit.updateMany({
        where: { caregiverId: deposit.caregiverId, status: 'AKTIF', id: { not: id } },
        data: { status: 'DIPERBARUI' },
      });
      const currentCaregiver = await tx.caregiver.update({
        where: { id: deposit.caregiverId },
        data: { depositExpiresAt: periodEnd },
        include: { user: true },
      });
      if (currentCaregiver.user.accountStatus === 'TERKUNCI_PERIODE') {
        await tx.user.update({ where: { id: currentCaregiver.userId }, data: { accountStatus: 'AKTIF' } });
      }
      const activatedDeposit = await tx.deposit.findUniqueOrThrow({ where: { id } });
      return { updated: activatedDeposit, caregiver: currentCaregiver };
    });
    if (caregiver) {
      await this.notifications.notify(
        caregiver.userId,
        'DEPOSIT_AKTIF',
        'Deposit aktif 2 bulan',
        'Akun Anda aktif dan bisa melamar kebutuhan.',
      );
    }
    return updated;
  }

  /**
   * C-04/C-05/C-06: proses kedaluwarsa (dipanggil Admin/cron di awal periode).
   * AKTIF yang lewat periodEnd → KEDALUWARSA + hitung hasClientInPeriod;
   * tanpa deposit AKTIF pengganti → akun TERKUNCI_PERIODE.
   * Definisi "ada klien" (MVP): ≥1 Payment SERVICE yang Dibayar dalam periode.
   */
  async processExpiry() {
    const now = new Date();
    const expired = await this.prisma.deposit.findMany({
      where: { status: 'AKTIF', periodEnd: { lt: now } },
    });
    let hangus = 0;
    let menungguRefund = 0;
    let terkunci = 0;
    for (const d of expired) {
      const paidCount = await this.prisma.payment.count({
        where: {
          type: 'SERVICE',
          status: { in: ['DIBAYAR_DITAHAN', 'DITERUSKAN_PAYOUT', 'DIKEMBALIKAN_SEBAGIAN'] },
          submittedAt: { gte: d.periodStart ?? new Date(0), lte: d.periodEnd ?? now },
          contract: { caregiverId: d.caregiverId },
        },
      });
      const hasClient = paidCount > 0;
      await this.prisma.deposit.update({
        where: { id: d.id },
        data: { status: 'KEDALUWARSA', hasClientInPeriod: hasClient },
      });
      if (hasClient) {
        menungguRefund++;
      } else {
        // Tanpa klien → hangus penuh, saldo periode berikut = 0 (payment #5.2).
        await this.prisma.deposit.update({ where: { id: d.id }, data: { status: 'HANGUS_TERTANAM' } });
        hangus++;
      }
      // Kunci akun jika tidak ada deposit AKTIF lain yang masih berlaku.
      const stillActive = await this.prisma.deposit.count({
        where: { caregiverId: d.caregiverId, status: 'AKTIF', periodEnd: { gt: now } },
      });
      if (stillActive === 0) {
        const cg = await this.prisma.caregiver.findUnique({
          where: { id: d.caregiverId },
          include: { user: true },
        });
        if (cg && !['DIBEKUKAN', 'DIBLOKIR', 'DITANGGUHKAN'].includes(cg.user.accountStatus)) {
          await this.prisma.user.update({
            where: { id: cg.user.id },
            data: { accountStatus: 'TERKUNCI_PERIODE' },
          });
          terkunci++;
        }
      }
    }
    return { diproses: expired.length, hangus, menungguRefund, terkunci };
  }

  /**
   * C-06: refund deposit awal bulan 3 (TF manual + bukti) untuk yang ada klien.
   * Tanpa potongan admin (payment #5.2).
   */
  async refund(id: string, proofTfUrl: string) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id } });
    if (!deposit) throw new NotFoundException('Deposit tidak ditemukan');
    if (deposit.status !== 'KEDALUWARSA' || !deposit.hasClientInPeriod) {
      throw new BadRequestException('Deposit ini tidak layak refund (harus KEDALUWARSA + ada klien)');
    }
    return this.prisma.deposit.update({
      where: { id },
      data: { status: 'DIKEMBALIKAN', refundProofUrl: proofTfUrl },
    });
  }

  /**
   * Guard untuk Sprint 3 (needs/interests): mitra wajib deposit aktif.
   * Dipakai juga untuk pengecekan lazy saat request.
   */
  async requireActiveDeposit(userId: string) {
    const caregiver = await this.caregiverOf(userId);
    if (
      !caregiver.depositExpiresAt ||
      caregiver.depositExpiresAt <= new Date() ||
      LOCKED_STATUSES.includes(
        (await this.prisma.user.findUnique({ where: { id: userId } }))?.accountStatus ?? '',
      )
    ) {
      throw new ForbiddenException('Deposit kedaluwarsa. Bayar deposit periode baru untuk lanjut.');
    }
    return caregiver;
  }
}
