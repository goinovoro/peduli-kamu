import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ConsentsService {
  constructor(private prisma: PrismaService) {}

  /** Catat persetujuan ketentuan (B-05/O-01). Idempotent via upsert. */
  agree(userId: string, kind: string, version = 'v1') {
    return this.prisma.consent.upsert({
      where: { userId_kind_version: { userId, kind, version } },
      update: {},
      create: { userId, kind, version },
    });
  }

  mine(userId: string) {
    return this.prisma.consent.findMany({ where: { userId }, orderBy: { agreedAt: 'desc' } });
  }
}
