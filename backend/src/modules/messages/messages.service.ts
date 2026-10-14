import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  private async partyInterest(userId: string, role: string, interestId: string) {
    const interest = await this.prisma.interest.findUnique({
      where: { id: interestId },
      include: { need: true, caregiver: true },
    });
    if (!interest) throw new NotFoundException('Minat tidak ditemukan');
    const isPatient = interest.need.patientUserId === userId;
    const isCaregiver = interest.caregiver.userId === userId;
    if (!isPatient && !isCaregiver) throw new ForbiddenException('Bukan percakapan Anda');
    if (role === 'admin') throw new ForbiddenException('Admin tidak ikut chat');
    return interest;
  }

  /**
   * F-01: chat hanya terbuka setelah minat DITERIMA.
   * Pengirim harus salah satu pihak (pasien pemilik need / mitra pelamar).
   */
  async send(userId: string, role: string, interestId: string, body: string) {
    const interest = await this.partyInterest(userId, role, interestId);
    if (interest.status !== 'DITERIMA') {
      throw new ForbiddenException('Chat terbuka setelah minat diterima Pasien');
    }
    return this.prisma.message.create({
      data: { interestId, senderUserId: userId, body },
    });
  }

  async thread(userId: string, role: string, interestId: string) {
    await this.partyInterest(userId, role, interestId);
    return this.prisma.message.findMany({
      where: { interestId },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }
}
