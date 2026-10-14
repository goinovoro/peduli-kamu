import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { DepositsService } from '../deposits/deposits.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ACTIVE_CONTRACT_MESSAGE, ACTIVE_CONTRACT_STATUSES } from '../../common/constants/active-contract-statuses';

const CAREGIVER_SUMMARY_SELECT = {
  id: true,
  university: true,
  graduationYear: true,
  ratePerHour: true,
  strStatus: true,
  tier: true,
  location: true,
  serviceArea: true,
  education: true,
  experience: true,
  competencies: true,
  certifications: true,
  bio: true,
  verificationStatus: true,
  ratingAvg: true,
  totalFinished: true,
  user: { select: { id: true, name: true, photoUrl: true } },
} as const;

@Injectable()
export class InterestsService {
  constructor(
    private prisma: PrismaService,
    private deposits: DepositsService,
    private notifications: NotificationsService,
  ) {}

  /**
   * E-01: mitra aktif ajukan minat ke kebutuhan publik.
   * Cegah duplikat (unique need+caregiver) + kunci deposit.
   */
  async apply(userId: string, needId: string, dto: { intro?: string; relevantExp?: string; availability?: string }) {
    const caregiver = await this.deposits.requireActiveDeposit(userId);
    const activeContract = await this.prisma.contract.findFirst({
      where: { caregiverId: caregiver.id, status: { in: ACTIVE_CONTRACT_STATUSES } },
      select: { id: true },
    });
    if (activeContract) throw new ConflictException(ACTIVE_CONTRACT_MESSAGE);
    const need = await this.prisma.serviceNeed.findUnique({ where: { id: needId } });
    if (!need) throw new NotFoundException('Kebutuhan tidak ditemukan');
    if (need.status !== 'DIPUBLIKASIKAN') {
      throw new ConflictException('Kebutuhan tidak sedang dibuka untuk minat');
    }
    const dup = await this.prisma.interest.findUnique({
      where: { needId_caregiverId: { needId, caregiverId: caregiver.id } },
    });
    if (dup) throw new ConflictException('Anda sudah mengajukan minat untuk kebutuhan ini');
    return this.prisma.interest.create({
      data: {
        needId,
        caregiverId: caregiver.id,
        senderUserId: userId,
        intro: dto.intro ?? null,
        relevantExp: dto.relevantExp ?? null,
        availability: dto.availability ?? null,
        status: 'MENUNGGU_RESPON',
      },
    });
  }

  /** Minat yang dikirim mitra. */
  mine(userId: string) {
    return this.prisma.interest.findMany({
      where: { senderUserId: userId },
      include: { need: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Semua minat masuk untuk kebutuhan milik pasien, dalam satu query. */
  incoming(userId: string) {
    return this.prisma.interest.findMany({
      where: { need: { patientUserId: userId } },
      include: { caregiver: { select: CAREGIVER_SUMMARY_SELECT } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** E-02: minat masuk untuk satu kebutuhan milik pasien. */
  async forNeed(userId: string, needId: string) {
    const need = await this.prisma.serviceNeed.findUnique({ where: { id: needId } });
    if (!need) throw new NotFoundException('Kebutuhan tidak ditemukan');
    if (need.patientUserId !== userId) throw new ForbiddenException('Bukan kebutuhan Anda');
    return this.prisma.interest.findMany({
      where: { needId },
      include: {
        caregiver: { select: CAREGIVER_SUMMARY_SELECT },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * E-03: pasien terima/tolak minat. Yang diterima → need DALAM_PEMBAHASAN (Kontak).
   */
  async respond(userId: string, id: string, accept: boolean) {
    const interest = await this.prisma.interest.findUnique({
      where: { id },
      include: { need: true },
    });
    if (!interest) throw new NotFoundException('Minat tidak ditemukan');
    if (interest.need.patientUserId !== userId) throw new ForbiddenException('Bukan kebutuhan Anda');
    if (interest.status !== 'MENUNGGU_RESPON') {
      throw new ConflictException('Minat sudah diproses');
    }
    const updated = await this.prisma.interest.update({
      where: { id },
      data: { status: accept ? 'DITERIMA' : 'DITOLAK' },
    });
    if (accept && interest.need.status === 'DIPUBLIKASIKAN') {
      await this.prisma.serviceNeed.update({ where: { id: interest.needId }, data: { status: 'DALAM_PEMBAHASAN' } });
    }
    const cg = await this.prisma.caregiver.findUnique({ where: { id: interest.caregiverId } });
    if (cg) {
      await this.notifications.notify(
        cg.userId,
        accept ? 'MINAT_DITERIMA' : 'MINAT_DITOLAK',
        accept ? 'Minat Anda diterima Pasien' : 'Minat Anda ditolak Pasien',
        accept ? 'Tahap komunikasi dibuka. Bahas kebutuhan via chat.' : 'Cari kebutuhan lain yang sesuai.',
      );
    }
    return updated;
  }

  /** Mitra batalkan minat sendiri (selama belum Deal). */
  async cancel(userId: string, id: string) {
    const interest = await this.prisma.interest.findUnique({ where: { id } });
    if (!interest) throw new NotFoundException('Minat tidak ditemukan');
    if (interest.senderUserId !== userId) throw new ForbiddenException('Bukan minat Anda');
    if (interest.status !== 'MENUNGGU_RESPON') {
      throw new ConflictException('Minat sudah diproses, tidak bisa dibatalkan');
    }
    return this.prisma.interest.update({ where: { id }, data: { status: 'DIBATALKAN' } });
  }
}
