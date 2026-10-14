import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { existsSync } from 'fs';
import { basename, resolve } from 'path';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma.service';

const PRIVATE_FOLDERS = ['documents', 'payments', 'attendance'] as const;

@ApiTags('files')
@ApiCookieAuth()
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private prisma: PrismaService) {}

  @Get(':folder/:filename')
  @ApiOperation({ summary: 'Buka file privat setelah memeriksa hak akses pemilik / pihak kontrak / Admin' })
  async getFile(
    @CurrentUser() user: any,
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res() response: Response,
  ) {
    if (!PRIVATE_FOLDERS.includes(folder as (typeof PRIVATE_FOLDERS)[number]) || basename(filename) !== filename) {
      throw new NotFoundException('File tidak ditemukan');
    }
    const fileUrl = `/uploads/${folder}/${filename}`;
    let allowed = user.role === 'admin';

    if (!allowed && folder === 'documents') {
      const document = await this.prisma.caregiverDocument.findFirst({
        where: { fileUrl },
        select: { caregiver: { select: { userId: true } } },
      });
      allowed = document?.caregiver.userId === (user.sub ?? user.id);
    }

    if (!allowed && folder === 'payments') {
      const [payment, deposit, payout] = await Promise.all([
        this.prisma.payment.findFirst({
          where: { OR: [{ proofImageUrl: fileUrl }, { refundProofUrl: fileUrl }] },
          select: {
            payerUserId: true,
            contract: { select: { patientUserId: true, caregiver: { select: { userId: true } } } },
            deposit: { select: { caregiver: { select: { userId: true } } } },
          },
        }),
        this.prisma.deposit.findFirst({
          where: { OR: [{ proofImageUrl: fileUrl }, { refundProofUrl: fileUrl }] },
          select: { caregiver: { select: { userId: true } } },
        }),
        this.prisma.payout.findFirst({
          where: { proofTfUrl: fileUrl },
          select: { caregiver: { select: { userId: true } } },
        }),
      ]);
      const userId = user.sub ?? user.id;
      allowed =
        payment?.payerUserId === userId ||
        payment?.contract?.patientUserId === userId ||
        payment?.contract?.caregiver.userId === userId ||
        payment?.deposit?.caregiver.userId === userId ||
        deposit?.caregiver.userId === userId ||
        payout?.caregiver.userId === userId;
    }

    if (!allowed && folder === 'attendance') {
      const attendance = await this.prisma.attendance.findFirst({
        where: { photoUrl: fileUrl },
        select: {
          caregiver: { select: { userId: true } },
          contract: { select: { patientUserId: true } },
        },
      });
      const userId = user.sub ?? user.id;
      allowed = attendance?.caregiver.userId === userId || attendance?.contract.patientUserId === userId;
    }

    if (!allowed) throw new ForbiddenException('Anda tidak memiliki akses ke file ini');

    const filePath = resolve(process.cwd(), 'uploads', folder, filename);
    if (!existsSync(filePath)) throw new NotFoundException('File tidak ditemukan');
    response.setHeader('Cache-Control', 'private, no-store');
    return response.sendFile(filePath);
  }
}
