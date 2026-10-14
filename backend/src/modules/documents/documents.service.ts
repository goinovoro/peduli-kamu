import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const MITRA_ROLES = ['MITRA', 'caregiver'];

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  private async caregiverOf(userId: string) {
    const caregiver = await this.prisma.caregiver.findUnique({ where: { userId } });
    if (!caregiver) throw new NotFoundException('Profil caregiver tidak ditemukan');
    return caregiver;
  }

  /** B-02: mitra upload dokumen. File sudah divalidasi di controller (tipe + ukuran). */
  async create(userId: string, kind: string, fileUrl: string) {
    const caregiver = await this.caregiverOf(userId);
    return this.prisma.caregiverDocument.create({
      data: { caregiverId: caregiver.id, kind: kind as any, fileUrl, status: 'MENUNGGU' },
    });
  }

  /** Dokumen milik sendiri. */
  async mine(userId: string) {
    const caregiver = await this.caregiverOf(userId);
    return this.prisma.caregiverDocument.findMany({
      where: { caregiverId: caregiver.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** N-04 (antrian): admin lihat dokumen, opsional filter status. */
  listAll(status?: string) {
    return this.prisma.caregiverDocument.findMany({
      where: status ? { status: status as any } : {},
      include: {
        caregiver: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** B-04: admin putuskan dokumen + catatan. */
  async review(id: string, status: string, note?: string) {
    const doc = await this.prisma.caregiverDocument.findUnique({
      where: { id },
      include: { caregiver: true },
    });
    if (!doc) throw new NotFoundException('Dokumen tidak ditemukan');
    const updated = await this.prisma.caregiverDocument.update({
      where: { id },
      data: { status: status as any, note: note ?? null },
    });
    await this.notifications.notify(
      doc.caregiver.userId,
      status === 'DISETUJUI' ? 'DOKUMEN_DISETUJUI' : 'DOKUMEN_PERLU_PERBAIKAN',
      status === 'DISETUJUI' ? 'Dokumen disetujui' : 'Dokumen perlu diperbaiki',
      note ?? undefined,
    );
    return updated;
  }

  static assertMitra(role?: string) {
    if (!role || !MITRA_ROLES.includes(role)) {
      throw new ForbiddenException('Hanya Mitra Perawat yang bisa mengunggah dokumen');
    }
  }
}
