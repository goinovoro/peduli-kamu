import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { IsDateString, IsNotEmpty } from 'class-validator';
import { PrismaService } from '../../prisma.service';

export class CreateBookingDto {
  @IsNotEmpty() patientId!: string;
  @IsNotEmpty() caregiverId!: string;
  @IsDateString() date!: string;
}

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  create(familyId: string, dto: CreateBookingDto) {
    return this.prisma.booking.create({
      data: { ...dto, date: new Date(dto.date), familyId, status: 'pending' },
    });
  }

  byFamily(familyId: string) {
    return this.prisma.booking.findMany({
      where: { familyId },
      include: { patient: true, caregiver: { include: { user: true } } },
      orderBy: { date: 'asc' },
    });
  }

  byCaregiverUser(userId: string) {
    return this.prisma.caregiver.findUnique({ where: { userId } }).then((c) => {
      if (!c) return [];
      return this.prisma.booking.findMany({
        where: { caregiverId: c.id },
        include: { patient: true },
        orderBy: { date: 'asc' },
      });
    });
  }

  async setStatus(id: string, userId: string, status: 'upcoming' | 'cancelled' | 'past') {
    const booking = await this.prisma.booking.findUnique({
      include: { caregiver: true },
      where: { id },
    });
    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (booking.caregiver.userId !== userId) throw new ForbiddenException('Bukan booking Anda');
    return this.prisma.booking.update({ where: { id }, data: { status } });
  }
}
