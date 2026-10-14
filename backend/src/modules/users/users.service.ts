import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const ADMIN_MANAGED_STATUSES = [
  'AKTIF',
  'TIDAK_AKTIF',
  'DITANGGUHKAN',
  'DIBLOKIR',
  'TERKUNCI_PERIODE',
  'DIBEKUKAN',
] as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}
  findAll() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, accountStatus: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** N-02: admin ubah status akun. Tidak boleh ubah akun sendiri. */
  async setStatus(adminId: string, userId: string, status: string) {
    if (adminId === userId) throw new ForbiddenException('Tidak boleh mengubah status akun sendiri');
    if (!(ADMIN_MANAGED_STATUSES as readonly string[]).includes(status)) {
      throw new BadRequestException('Status tidak valid');
    }
    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new NotFoundException('User tidak ditemukan');
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { accountStatus: status as any },
      select: { id: true, email: true, name: true, role: true, accountStatus: true },
    });
    await this.notifications.notify(
      userId,
      'STATUS_AKUN',
      `Status akun: ${status}`,
      'Hubungi Admin jika Anda merasa ini keliru.',
    );
    return updated;
  }
}
