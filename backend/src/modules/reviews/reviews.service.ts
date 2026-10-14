import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const SCORE_FIELDS = ['punctuality', 'professionalism', 'communication', 'quality', 'overall'] as const;

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  /** Hitung ulang ratingAvg dari review yang tidak disembunyikan. */
  private async recomputeRating(caregiverId: string) {
    const visible = await this.prisma.review.findMany({
      where: { reviewedCaregiverId: caregiverId, hiddenByAdmin: false },
      select: { overall: true },
    });
    const avg = visible.length === 0 ? 0 : visible.reduce((s, r) => s + r.overall, 0) / visible.length;
    await this.prisma.caregiver.update({ where: { id: caregiverId }, data: { ratingAvg: avg } });
    return avg;
  }

  private scoreOk(v: unknown) {
    return Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 5;
  }

  /**
   * L-01: pasien menilai mitra setelah SELESAI. Satu layanan satu review.
   */
  async create(patientUserId: string, dto: Record<string, any>) {
    const contract = await this.prisma.contract.findUnique({ where: { id: dto.contractId } });
    if (!contract) throw new NotFoundException('Kontrak tidak ditemukan');
    if (contract.patientUserId !== patientUserId) {
      throw new ForbiddenException('Hanya Pasien pemilik yang bisa memberi review');
    }
    if (contract.status !== 'SELESAI') {
      throw new ConflictException('Review hanya setelah layanan selesai');
    }
    for (const f of SCORE_FIELDS) {
      if (!this.scoreOk(dto[f])) throw new ConflictException(`Skor ${f} harus 1..5`);
    }
    const dup = await this.prisma.review.findUnique({
      where: { contractId_reviewerUserId: { contractId: dto.contractId, reviewerUserId: patientUserId } },
    });
    if (dup) throw new ConflictException('Review sudah diberikan untuk layanan ini');
    const review = await this.prisma.review.create({
      data: {
        contractId: dto.contractId,
        reviewerUserId: patientUserId,
        reviewedCaregiverId: contract.caregiverId,
        punctuality: dto.punctuality,
        professionalism: dto.professionalism,
        communication: dto.communication,
        quality: dto.quality,
        overall: dto.overall,
        comment: dto.comment ?? null,
      },
    });
    const ratingAvg = await this.recomputeRating(contract.caregiverId);
    const cg = await this.prisma.caregiver.findUnique({ where: { id: contract.caregiverId } });
    if (cg) {
      await this.notifications.notify(cg.userId, 'REVIEW_BARU', 'Review baru diterima', `Rating keseluruhan: ${dto.overall}/5.`);
    }
    return { ...review, ratingAvg };
  }

  /** L-02: daftar review publik seorang mitra (tanpa yang disembunyikan admin). */
  forCaregiver(caregiverId: string) {
    return this.prisma.review.findMany({
      where: { reviewedCaregiverId: caregiverId, hiddenByAdmin: false },
      include: { reviewer: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** N-05: admin sembunyikan/tampilkan review bermasalah + hitung ulang rating. */
  async moderate(id: string, hide: boolean) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review tidak ditemukan');
    await this.prisma.review.update({ where: { id }, data: { hiddenByAdmin: hide } });
    const ratingAvg = await this.recomputeRating(review.reviewedCaregiverId);
    return { id, hiddenByAdmin: hide, ratingAvg };
  }
}
