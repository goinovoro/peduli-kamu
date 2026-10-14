import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /** Catat notifikasi in-app (P-01–P-03, MVP tanpa WA/email). Best-effort: tidak boleh menggagalkan transaksi utama. */
  async notify(userId: string, kind: string, title: string, body?: string, linkUrl?: string) {
    try {
      return await this.prisma.notification.create({
        data: { userId, kind, title, body: body ?? null, linkUrl: linkUrl ?? null },
      });
    } catch {
      return null;
    }
  }

  mine(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { read: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }

  async markRead(userId: string, id: string) {
    // Pastikan milik sendiri agar tidak bisa tandai notif orang lain.
    await this.prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    return { ok: true };
  }
}
