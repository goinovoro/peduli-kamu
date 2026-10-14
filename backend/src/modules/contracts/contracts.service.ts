import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AttendanceService } from '../attendance/attendance.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ACTIVE_CONTRACT_MESSAGE, ACTIVE_CONTRACT_STATUSES } from '../../common/constants/active-contract-statuses';

const ATTENDANCE_RADIUS_DEFAULT = 150;

export function adminFeePercent() {
  return Number(process.env.ADMIN_FEE_PERCENT ?? 10);
}

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private attendance: AttendanceService,
    private notifications: NotificationsService,
  ) {}

  /**
   * F-03: buat Deal dari minat yang DITERIMA. Pembuat = pasien pemilik need.
   * Nominal dikunci server: totalCost = totalHours x hourlyRate (tidak percaya hitungan client).
   * Satu need hanya boleh punya satu kontrak (unique needId).
   */
  async create(patientUserId: string, dto: {
    interestId: string;
    totalHours?: number;
    hourlyRate?: number;
    schedule?: string;
    locationText?: string;
    locationLat?: number;
    locationLng?: number;
    attendanceRadiusM?: number;
    scope?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const interest = await this.prisma.interest.findUnique({
      where: { id: dto.interestId },
      include: { need: true, caregiver: true },
    });
    if (!interest) throw new NotFoundException('Minat tidak ditemukan');
    if (interest.need.patientUserId !== patientUserId) {
      throw new ForbiddenException('Bukan kebutuhan Anda');
    }
    if (interest.status !== 'DITERIMA') {
      throw new ConflictException('Deal hanya dari minat yang diterima');
    }
    const totalHours = dto.totalHours ?? interest.need.totalHours;
    const hourlyRate = dto.hourlyRate ?? interest.caregiver.ratePerHour;
    if (!totalHours || totalHours <= 0) throw new ConflictException('Total jam wajib diisi');
    if (!hourlyRate || hourlyRate <= 0) throw new ConflictException('Tarif per jam wajib diisi');
    const totalCost = totalHours * hourlyRate;

    let contract;
    try {
      contract = await this.prisma.$transaction(async (tx) => {
        const activeContract = await tx.contract.findFirst({
          where: { caregiverId: interest.caregiverId, status: { in: ACTIVE_CONTRACT_STATUSES } },
          select: { id: true },
        });
        if (activeContract) throw new ConflictException(ACTIVE_CONTRACT_MESSAGE);

        const existing = await tx.contract.findUnique({ where: { needId: interest.needId } });
        if (existing) throw new ConflictException('Kebutuhan ini sudah memiliki kontrak');

        const created = await tx.contract.create({
          data: {
            needId: interest.needId,
            interestId: interest.id,
            patientUserId,
            caregiverId: interest.caregiverId,
            serviceType: interest.need.serviceType,
            schedule: dto.schedule ?? interest.need.schedule,
            totalHours,
            hourlyRate,
            totalCost,
            locationText: dto.locationText ?? interest.need.locationText,
            locationLat: dto.locationLat ?? interest.need.locationLat,
            locationLng: dto.locationLng ?? interest.need.locationLng,
            attendanceRadiusM: dto.attendanceRadiusM ?? ATTENDANCE_RADIUS_DEFAULT,
            scope: dto.scope ?? interest.need.description,
            startDate: dto.startDate ? new Date(dto.startDate) : interest.need.startDate,
            endDate: dto.endDate ? new Date(dto.endDate) : null,
            cancelPolicy: 'TANPA_REFUND_JIKA_PASIEN_BATAL',
            status: 'DEAL_MENUNGGU_BAYAR',
          },
        });
        await tx.serviceNeed.update({
          where: { id: interest.needId },
          data: { status: 'DEAL' },
        });
        return created;
      });
    } catch (error: any) {
      // Partial unique index is the final guard for concurrent contract creation.
      if (error?.code === 'P2002') {
        throw new ConflictException('Mitra atau kebutuhan sudah memiliki kontrak aktif');
      }
      throw error;
    }
    const dealCg = await this.prisma.caregiver.findUnique({ where: { id: interest.caregiverId } });
    if (dealCg) {
      await this.notifications.notify(
        dealCg.userId,
        'DEAL_BARU',
        'Deal tercapai dengan Pasien',
        `Total Rp${totalCost} (${totalHours} jam). Menunggu pembayaran pasien.`,
      );
    }
    return contract;
  }

  /** Kontrak milik saya (pasien pemilik / mitra pelaksana). */
  mine(userId: string, role: string) {
    const caregiverCond =
      role === 'MITRA' || role === 'caregiver'
        ? this.prisma.caregiver.findUnique({ where: { userId } }).then((c) => c?.id)
        : Promise.resolve(null);
    return caregiverCond.then((caregiverId) =>
      this.prisma.contract.findMany({
        where: {
          OR: [
            { patientUserId: userId },
            ...(caregiverId ? [{ caregiverId } as const] : []),
          ],
        },
        orderBy: { agreedAt: 'desc' },
      }),
    );
  }

  /** Detail: pihak terkait atau admin. */
  async findOne(userId: string, role: string, id: string) {    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        need: true,
        interest: true,
        payments: { orderBy: { submittedAt: 'desc' } },
        payout: true,
        attendances: { orderBy: { serverTime: 'asc' } },
      },
    });
    if (!contract) throw new NotFoundException('Kontrak tidak ditemukan');
    if (role === 'admin') return contract;
    if (contract.patientUserId === userId) return contract;
    const cg = await this.prisma.caregiver.findUnique({ where: { userId } });
    if (cg && contract.caregiverId === cg.id) return contract;
    throw new ForbiddenException('Bukan kontrak Anda');
  }

  private async partyContract(userId: string, role: string, id: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Kontrak tidak ditemukan');
    if (role === 'admin') return contract;
    if (contract.patientUserId === userId) return contract;
    const cg = await this.prisma.caregiver.findUnique({ where: { userId } });
    if (cg && contract.caregiverId === cg.id) return contract;
    throw new ForbiddenException('Bukan kontrak Anda');
  }

  /**
   * I-01: mulai layanan. Syarat: kontrak SIAP_JALAN + payment SERVICE DIBAYAR_DITAHAN.
   * Boleh dipicu pasien atau mitra pelaksana.
   */
  async start(userId: string, role: string, id: string) {
    const contract = await this.partyContract(userId, role, id);
    if (contract.status !== 'SIAP_JALAN') {
      throw new ConflictException('Kontrak belum siap jalan (menunggu pembayaran terverifikasi)');
    }
    const paid = await this.prisma.payment.findFirst({
      where: { contractId: id, type: 'SERVICE', status: 'DIBAYAR_DITAHAN' },
    });
    if (!paid) throw new ConflictException('Pembayaran pasien belum terverifikasi');
    await this.prisma.contract.update({ where: { id }, data: { status: 'BERJALAN' } });
    await this.prisma.serviceNeed.update({ where: { id: contract.needId }, data: { status: 'BERJALAN' } });
    await this.notifications.notify(contract.patientUserId, 'LAYANAN_MULAI', 'Layanan dimulai', 'Pantau kehadiran mitra via absensi.');
    const cg = await this.prisma.caregiver.findUnique({ where: { id: contract.caregiverId } });
    if (cg) {
      await this.notifications.notify(cg.userId, 'LAYANAN_MULAI', 'Layanan dimulai', 'Jangan lupa clock-in setiap sesi.');
    }
    return this.prisma.contract.findUnique({ where: { id } });
  }

  /**
   * I-02: mitra minta selesai. Syarat: BERJALAN + rekap approved > 0 menit.
   * Jam aktual ditarik dari rekap, bukan klaim manual.
   */
  async finish(userId: string, id: string) {
    const contract = await this.partyContract(userId, 'MITRA', id);
    const cg = await this.prisma.caregiver.findUnique({ where: { userId } });
    if (!cg || contract.caregiverId !== cg.id) {
      throw new ForbiddenException('Hanya Mitra pelaksana yang bisa menyelesaikan');
    }
    if (contract.status !== 'BERJALAN') throw new ConflictException('Layanan tidak sedang berjalan');
    const recap = await this.attendance.recap(id);
    if (recap.workedMinutes <= 0) {
      throw new ConflictException('Belum ada sesi absensi yang di-approve');
    }
    if (recap.workedMinutes < contract.totalHours * 60) {
      throw new ConflictException(
        `Rekap baru ${Math.floor(recap.workedMinutes / 60)} jam dari ${contract.totalHours} jam kontrak. Selesaikan jam yang disepakati atau ajukan sengketa sebelum konfirmasi.`,
      );
    }
    await this.prisma.contract.update({ where: { id }, data: { status: 'MENUNGGU_KONFIRMASI' } });
    await this.notifications.notify(
      contract.patientUserId,
      'LAYANAN_SELESAI_MITRA',
      'Mitra menyelesaikan layanan',
      `Rekap ${recap.workedMinutes} menit dari ${recap.approvedSessions} sesi. Buka untuk konfirmasi.`,
    );
    return this.prisma.contract.findUnique({ where: { id } });
  }

  /**
   * I-02: pasien konfirmasi selesai → SELESAI + buat Payout LAYAK_BAYAR
   * (gross − admin% = net, snapshot jam + rekening). Idempotent-guarded (409 ganda).
   */
  async confirm(patientUserId: string, id: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Kontrak tidak ditemukan');
    if (contract.patientUserId !== patientUserId) {
      throw new ForbiddenException('Hanya Pasien pemilik yang bisa konfirmasi');
    }
    return this.settle(contract.id, null);
  }

  /** I-02: override admin saat pasien tidak konfirmasi dalam X hari. */
  async confirmOverride(adminId: string, id: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Kontrak tidak ditemukan');
    return this.settle(contract.id, adminId);
  }

  private async settle(contractId: string, adminId: string | null) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Kontrak tidak ditemukan');
    if (contract.status !== 'MENUNGGU_KONFIRMASI') {
      if (contract.status === 'SELESAI') throw new ConflictException('Kontrak sudah selesai');
      throw new ConflictException('Mitra belum meminta penyelesaian');
    }
    const recap = await this.attendance.recap(contractId);
    if (recap.workedMinutes < contract.totalHours * 60) {
      throw new ConflictException('Jam absensi approved belum memenuhi jam kontrak');
    }
    const feePct = adminFeePercent();
    const gross = contract.totalCost;
    const fee = Math.round((gross * feePct) / 100);
    const { payout, cg } = await this.prisma.$transaction(async (tx) => {
      const current = await tx.contract.findUnique({ where: { id: contractId } });
      if (!current || current.status !== 'MENUNGGU_KONFIRMASI') {
        throw new ConflictException('Kontrak sudah berubah dan tidak bisa diselesaikan');
      }
      const existing = await tx.payout.findUnique({ where: { contractId } });
      if (existing) throw new ConflictException('Payout sudah dibuat');
      const escrow = await tx.payment.findFirst({
        where: { contractId, type: 'SERVICE', status: 'DIBAYAR_DITAHAN' },
      });
      if (!escrow) throw new ConflictException('Dana escrow tidak tersedia untuk payout');
      const caregiver = await tx.caregiver.findUnique({ where: { id: contract.caregiverId } });
      const createdPayout = await tx.payout.create({
        data: {
          contractId,
          caregiverId: contract.caregiverId,
          grossAmount: gross,
          adminFeePercent: feePct,
          adminFeeAmount: fee,
          netAmount: gross - fee,
          bankNameSnap: caregiver?.bankName ?? null,
          bankAccountNoSnap: caregiver?.bankAccountNo ?? null,
          bankAccountNameSnap: caregiver?.bankAccountName ?? null,
          status: 'LAYAK_BAYAR',
          reason: 'SELESAI_NORMAL',
          workedMinutes: recap.workedMinutes,
          approvedSessions: recap.approvedSessions,
        },
      });
      await tx.contract.update({ where: { id: contractId }, data: { status: 'SELESAI' } });
      await tx.serviceNeed.update({ where: { id: contract.needId }, data: { status: 'SELESAI' } });
      const escrowUpdate = await tx.payment.updateMany({
        where: { id: escrow.id, status: 'DIBAYAR_DITAHAN' },
        data: { status: 'DITERUSKAN_PAYOUT' },
      });
      if (escrowUpdate.count !== 1) throw new ConflictException('Dana escrow sudah berubah');
      if (caregiver) {
        await tx.caregiver.update({ where: { id: caregiver.id }, data: { totalFinished: { increment: 1 } } });
      }
      return { payout: createdPayout, cg: caregiver };
    });
    if (cg) {
      await this.notifications.notify(
        cg.userId,
        'LAYAK_PAYOUT',
        'Layanan selesai, payout layak bayar',
        `Net Rp${payout.netAmount} (gross Rp${gross} − admin ${feePct}%). Menunggu TF Admin.`,
      );
    }
    await this.notifications.notify(
      contract.patientUserId,
      'LAYANAN_SELESAI',
      'Layanan selesai',
      'Terima kasih. Beri review untuk Mitra Anda.',
    );
    return { contractId, payout, adminOverride: adminId !== null };
  }

  /**
   * K-01: pasien batal sepihak SETELAH Deal dibayar → tanpa refund,
   * dana full diteruskan ke Mitra sebagai gaji (net setelah admin).
   * Syarat: ada Payment SERVICE DIBAYAR_DITAHAN + kontrak belum SELESAI.
   */
  async cancelByPatient(patientUserId: string, id: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Kontrak tidak ditemukan');
    if (contract.patientUserId !== patientUserId) {
      throw new ForbiddenException('Hanya Pasien pemilik yang bisa membatalkan');
    }
    if (contract.status === 'SELESAI') {
      throw new ConflictException('Layanan sudah selesai, komplain via Sengketa');
    }
    if (['DIBATALKAN_PASIEN', 'DIBATALKAN_MITRA'].includes(contract.status)) {
      throw new ConflictException('Kontrak sudah dibatalkan');
    }
    if (!['DEAL_MENUNGGU_BAYAR', 'DIBAYAR_DITAHAN', 'SIAP_JALAN', 'BERJALAN', 'MENUNGGU_KONFIRMASI'].includes(contract.status)) {
      throw new ConflictException('Kontrak tidak bisa dibatalkan pada status ini');
    }
    const cg = await this.prisma.caregiver.findUnique({ where: { id: contract.caregiverId } });
    const payout = await this.prisma.$transaction(async (tx) => {
      const current = await tx.contract.findUnique({ where: { id } });
      if (!current || !['DEAL_MENUNGGU_BAYAR', 'DIBAYAR_DITAHAN', 'SIAP_JALAN', 'BERJALAN', 'MENUNGGU_KONFIRMASI'].includes(current.status)) {
        throw new ConflictException('Kontrak sudah berubah atau dibatalkan');
      }
      const payments = await tx.payment.findMany({
        where: { contractId: id, type: 'SERVICE' },
        orderBy: { submittedAt: 'desc' },
      });
      if (payments.some((p) => p.status === 'MENUNGGU_VERIFIKASI')) {
        throw new ConflictException('Bukti pembayaran sedang diverifikasi. Tunggu keputusan Admin sebelum membatalkan.');
      }
      const paid = payments.find((p) => p.status === 'DIBAYAR_DITAHAN');
      if (current.status !== 'DEAL_MENUNGGU_BAYAR' && !paid) {
        throw new ConflictException('Dana escrow tidak tersedia untuk kontrak ini');
      }
      if (paid) {
        const existing = await tx.payout.findUnique({ where: { contractId: id } });
        if (existing) throw new ConflictException('Payout sudah dibuat untuk kontrak ini');
        const feePct = adminFeePercent();
        const gross = contract.totalCost;
        const fee = Math.round((gross * feePct) / 100);
        const paymentUpdate = await tx.payment.updateMany({
          where: { id: paid.id, status: 'DIBAYAR_DITAHAN' },
          data: { status: 'DITERUSKAN_PAYOUT' },
        });
        if (paymentUpdate.count !== 1) throw new ConflictException('Dana escrow sudah berubah');
        const created = await tx.payout.create({
          data: {
            contractId: id,
            caregiverId: contract.caregiverId,
            grossAmount: gross,
            adminFeePercent: feePct,
            adminFeeAmount: fee,
            netAmount: gross - fee,
            bankNameSnap: cg?.bankName ?? null,
            bankAccountNoSnap: cg?.bankAccountNo ?? null,
            bankAccountNameSnap: cg?.bankAccountName ?? null,
            status: 'LAYAK_BAYAR',
            reason: 'PASIEN_BATAL',
          },
        });
        await tx.contract.update({ where: { id }, data: { status: 'DIBATALKAN_PASIEN' } });
        await tx.serviceNeed.update({ where: { id: contract.needId }, data: { status: 'DIBATALKAN' } });
        return created;
      }
      // Sebelum escrow terverifikasi, pembatalan tidak menimbulkan payout/refund.
      await tx.payment.updateMany({
        where: { contractId: id, type: 'SERVICE', status: 'DITOLAK' },
        data: { rejectReason: 'Kontrak dibatalkan Pasien sebelum pembayaran terverifikasi' },
      });
      await tx.contract.update({ where: { id }, data: { status: 'DIBATALKAN_PASIEN' } });
      await tx.serviceNeed.update({ where: { id: contract.needId }, data: { status: 'DIBATALKAN' } });
      return null;
    });
    if (cg) {
      if (payout) {
        await this.notifications.notify(
          cg.userId,
          'PASIEN_BATAL_GAJI',
          'Pasien membatalkan, gaji tetap diteruskan',
          `Net Rp${payout.netAmount} masuk antrian payout. Menunggu TF Admin.`,
        );
      }
    }
    await this.notifications.notify(
      contract.patientUserId,
      payout ? 'PEMBATALAN_TANPA_REFUND' : 'KONTRAK_DIBATALKAN',
      payout ? 'Pembatalan tanpa refund' : 'Kontrak dibatalkan',
      payout ? 'Sesuai kontrak, dana diteruskan ke Mitra sebagai gaji.' : 'Pembatalan sebelum pembayaran terverifikasi tidak menimbulkan konsekuensi uang.',
    );
    return { contractId: id, payout };
  }

  /**
   * K-02: mitra wanprestasi (terbukti) → akun DIBEKUKAN s.d. bulan deposit
   * berikutnya + deposit hangus + refund pasien = missingHours x hourlyRate.
   * Sisa jam valid menjadi payout DITAHAN (Admin rilis via payouts/pay).
   */
  async misconduct(adminId: string, id: string, workedHours: number, description?: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Kontrak tidak ditemukan');
    if (!['SIAP_JALAN', 'BERJALAN', 'MENUNGGU_KONFIRMASI'].includes(contract.status)) {
      throw new ConflictException('Kontrak tidak dalam masa layanan');
    }
    if (!Number.isInteger(workedHours) || workedHours < 0 || workedHours > contract.totalHours) {
      throw new ConflictException('workedHours harus 0..totalHours kontrak');
    }
    const recap = await this.attendance.recap(id);
    const approvedWorkedHours = Math.min(contract.totalHours, Math.floor(recap.workedMinutes / 60));
    if (workedHours !== approvedWorkedHours) {
      throw new ConflictException(
        `Jam kerja harus sesuai rekap absensi yang disetujui (${approvedWorkedHours} jam), bukan input manual.`,
      );
    }
    const paid = await this.prisma.payment.findFirst({
      where: { contractId: id, type: 'SERVICE', status: 'DIBAYAR_DITAHAN' },
    });
    if (!paid) throw new ConflictException('Tidak ada dana escrow untuk kontrak ini');
    const existing = await this.prisma.payout.findUnique({ where: { contractId: id } });
    if (existing) throw new ConflictException('Payout sudah dibuat untuk kontrak ini');

    const missingHours = contract.totalHours - workedHours;
    const refundAmount = missingHours * contract.hourlyRate;
    // Sisa jam valid → payout DITAHAN (bukan otomatis cair).
    const feePct = adminFeePercent();
    const grossWorked = workedHours * contract.hourlyRate;
    const fee = Math.round((grossWorked * feePct) / 100);
    const { payout, cg } = await this.prisma.$transaction(async (tx) => {
      const current = await tx.contract.findUnique({ where: { id } });
      if (!current || !['SIAP_JALAN', 'BERJALAN', 'MENUNGGU_KONFIRMASI'].includes(current.status)) {
        throw new ConflictException('Kontrak sudah berubah dan tidak dapat diputus sebagai wanprestasi');
      }
      const currentEscrow = await tx.payment.findFirst({
        where: { id: paid.id, status: 'DIBAYAR_DITAHAN' },
      });
      if (!currentEscrow) throw new ConflictException('Dana escrow sudah berubah');
      const existing = await tx.payout.findUnique({ where: { contractId: id } });
      if (existing) throw new ConflictException('Payout sudah dibuat untuk kontrak ini');
      const caregiver = await tx.caregiver.findUnique({ where: { id: contract.caregiverId } });
      const paymentUpdate = await tx.payment.updateMany({
        where: { id: paid.id, status: 'DIBAYAR_DITAHAN' },
        data: {
          status: 'DIKEMBALIKAN_SEBAGIAN',
          refundAmount,
          workedHours,
          missingHours,
          hourlyRateSnapshot: contract.hourlyRate,
          refundedByAdminId: adminId,
        },
      });
      if (paymentUpdate.count !== 1) throw new ConflictException('Dana escrow sudah berubah');
      const createdPayout = grossWorked > 0
        ? await tx.payout.create({
            data: {
              contractId: id,
              caregiverId: contract.caregiverId,
              grossAmount: grossWorked,
              adminFeePercent: feePct,
              adminFeeAmount: fee,
              netAmount: grossWorked - fee,
              bankNameSnap: caregiver?.bankName ?? null,
              bankAccountNoSnap: caregiver?.bankAccountNo ?? null,
              bankAccountNameSnap: caregiver?.bankAccountName ?? null,
              status: 'DITAHAN',
              reason: 'SELESAI_NORMAL',
              workedMinutes: recap.workedMinutes,
              approvedSessions: recap.approvedSessions,
            },
          })
        : null;
      if (caregiver) {
        await tx.user.update({ where: { id: caregiver.userId }, data: { accountStatus: 'DIBEKUKAN' } });
        const activeDeposit = await tx.deposit.findFirst({
          where: { caregiverId: caregiver.id, status: { in: ['AKTIF', 'KEDALUWARSA'] } },
          orderBy: { createdAt: 'desc' },
        });
        if (activeDeposit && !['HANGUS_PELANGGARAN', 'HANGUS_TERTANAM'].includes(activeDeposit.status)) {
          await tx.deposit.update({
            where: { id: activeDeposit.id },
            data: {
              status: 'HANGUS_PELANGGARAN',
              freezeReason: description ?? 'Wanprestasi layanan',
              frozenUntil: activeDeposit.periodEnd,
            },
          });
        }
      }
      await tx.contract.update({ where: { id }, data: { status: 'DIBATALKAN_MITRA' } });
      await tx.serviceNeed.update({ where: { id: contract.needId }, data: { status: 'SENGKETA' } });
      return { payout: createdPayout, cg: caregiver };
    });

    // Bekukan akun + hanguskan deposit periode berjalan.
    if (cg) {
      await this.notifications.notify(
        cg.userId,
        'AKUN_DIBEKUKAN',
        'Akun dibekukan karena wanprestasi',
        'Deposit hangus. Hubungi Admin untuk periode berikutnya.',
      );
    }
    await this.notifications.notify(
      contract.patientUserId,
      'REFUND_WANPRESTASI',
      `Refund Rp${refundAmount} diproses`,
      `Kekurangan ${missingHours} jam x Rp${contract.hourlyRate}. Admin akan transfer manual.`,
    );
    return { contractId: id, refundAmount, missingHours, workedHours, payout };
  }
}
