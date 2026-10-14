import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/** Transisi status yang diizinkan (M-02). SELESAI/DITUTUP terkunci. */
const NEXT: Record<string, string[]> = {
  BARU: ['DITINJAU', 'DITUTUP'],
  DITINJAU: ['BUTUH_INFO', 'SELESAI', 'DITUTUP'],
  BUTUH_INFO: ['DITINJAU', 'SELESAI', 'DITUTUP'],
  SELESAI: [],
  DITUTUP: [],
};

@Injectable()
export class DisputesService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  private async partyContract(userId: string, contractId: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Kontrak tidak ditemukan');
    if (contract.patientUserId === userId) return contract;
    const cg = await this.prisma.caregiver.findUnique({ where: { userId } });
    if (cg && contract.caregiverId === cg.id) return contract;
    throw new ForbiddenException('Bukan kontrak Anda');
  }

  /**
   * M-01: pasien/mitra melapor atas kontraknya (masalah layanan, info beda,
   * bayar, perilaku, komunikasi) + lampiran opsional.
   */
  async create(
    userId: string,
    dto: { contractId: string; reportedUserId?: string; category: string; description: string; evidenceUrls?: string },
  ) {
    await this.partyContract(userId, dto.contractId);
    if (dto.reportedUserId) {
      const target = await this.prisma.user.findUnique({ where: { id: dto.reportedUserId } });
      if (!target) throw new NotFoundException('User yang dilaporkan tidak ditemukan');
    }
    const dispute = await this.prisma.dispute.create({
      data: {
        contractId: dto.contractId,
        reporterUserId: userId,
        reportedUserId: dto.reportedUserId ?? null,
        category: dto.category,
        description: dto.description,
        evidenceUrls: dto.evidenceUrls ?? null,
        status: 'BARU',
      },
    });
    return dispute;
  }

  mine(userId: string) {
    return this.prisma.dispute.findMany({
      where: { reporterUserId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  queue(status?: string) {
    return this.prisma.dispute.findMany({
      where: status ? { status: status as any } : {},
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        contract: { select: { id: true, serviceType: true, status: true, totalCost: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(userId: string, role: string, id: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        contract: true,
      },
    });
    if (!dispute) throw new NotFoundException('Sengketa tidak ditemukan');
    if (role === 'admin') return dispute;
    if (dispute.reporterUserId !== userId && dispute.reportedUserId !== userId) {
      throw new ForbiddenException('Bukan sengketa Anda');
    }
    return dispute;
  }

  /**
   * M-02: admin periksa → tindak lanjut → selesai/tutup.
   * Setiap perubahan status memberi notif ke pelapor.
   */
  async handle(adminId: string, id: string, status: string, decision?: string) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id } });
    if (!dispute) throw new NotFoundException('Sengketa tidak ditemukan');
    const allowed = NEXT[dispute.status] ?? [];
    if (!allowed.includes(status)) {
      throw new ConflictException(`Transisi ${dispute.status} → ${status} tidak diizinkan`);
    }
    const updated = await this.prisma.dispute.update({
      where: { id },
      data: { status: status as any, decision: decision ?? dispute.decision, handledByAdminId: adminId },
    });
    await this.notifications.notify(
      dispute.reporterUserId,
      'SENGKETA_UPDATE',
      `Sengketa: ${status}`,
      decision ?? 'Admin memperbarui laporan Anda.',
    );
    return updated;
  }
}
