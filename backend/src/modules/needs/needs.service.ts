import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { DepositsService } from '../deposits/deposits.service';
import { ACTIVE_CONTRACT_MESSAGE, ACTIVE_CONTRACT_STATUSES } from '../../common/constants/active-contract-statuses';

const PASIEN_ROLES = ['PASIEN', 'family'];
const MITRA_ROLES = ['MITRA', 'caregiver'];

/** Status need yang masih boleh diubah/ditutup pemilik (sebelum Deal — sampai tahap saling setuju). */
const EDITABLE_STATUSES = ['DRAFT', 'DIPUBLIKASIKAN', 'DALAM_PEMBAHASAN'];

function publicNeed(need: any) {
  const {
    patientUserId,
    patientProfileId,
    locationLat,
    locationLng,
    forWhom,
    conditionDesc,
    specialNeeds,
    ...safeNeed
  } = need;
  // Kebutuhan boleh memberi konteks wilayah, bukan alamat rumah / titik GPS.
  safeNeed.locationText = String(need.locationText ?? '').split(/[,;\n–—]/, 1)[0].trim();
  return safeNeed;
}

@Injectable()
export class NeedsService {
  constructor(private prisma: PrismaService, private deposits: DepositsService) {}

  static assertPasien(role?: string) {
    if (!role || !PASIEN_ROLES.includes(role)) {
      throw new ForbiddenException('Hanya Pasien yang bisa membuat kebutuhan');
    }
  }

  /** D-01: buat kebutuhan sebagai Draft. */
  async create(userId: string, dto: Record<string, any>) {
    const [user, consent] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { accountStatus: true } }),
      this.prisma.consent.findFirst({ where: { userId, kind: 'KETENTUAN_PLATFORM' } }),
    ]);
    if (!user || user.accountStatus !== 'AKTIF') {
      throw new ForbiddenException('Akun Pasien belum aktif untuk membuat kebutuhan');
    }
    if (!consent) throw new ForbiddenException('Setujui Ketentuan Platform sebelum membuat kebutuhan');
    return this.prisma.serviceNeed.create({
      data: {
        patientUserId: userId,
        patientProfileId: dto.patientProfileId ?? null,
        serviceType: dto.serviceType,
        forWhom: dto.forWhom ?? null,
        locationText: dto.locationText,
        locationLat: dto.locationLat ?? null,
        locationLng: dto.locationLng ?? null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        schedule: dto.schedule ?? null,
        durationHoursPerDay: dto.durationHoursPerDay ?? null,
        frequency: dto.frequency ?? null,
        totalHours: dto.totalHours,
        conditionDesc: dto.conditionDesc ?? null,
        specialNeeds: dto.specialNeeds ?? null,
        budgetEstimate: dto.budgetEstimate ?? null,
        description: dto.description ?? null,
        status: 'DRAFT',
      },
    });
  }

  /** Kebutuhan milik sendiri. */
  mine(userId: string) {
    return this.prisma.serviceNeed.findMany({
      where: { patientUserId: userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { interests: true } } },
    });
  }

  /** Detail: pemilik, admin, atau mitra (terbatas pada yang publik). */
  async findOne(userId: string, role: string, id: string) {
    const need = await this.prisma.serviceNeed.findUnique({ where: { id } });
    if (!need) throw new NotFoundException('Kebutuhan tidak ditemukan');
    if (role === 'admin') return need;
    if (need.patientUserId === userId) return need;
    if (!MITRA_ROLES.includes(role)) throw new ForbiddenException('Bukan kebutuhan Anda');
    if (need.status !== 'DIPUBLIKASIKAN') throw new ForbiddenException('Kebutuhan tidak publik');
    await this.deposits.requireActiveDeposit(userId);
    return publicNeed(need);
  }

  /** D-04: list publik untuk mitra aktif (filter wilayah/jenis/cari). */
  async published(userId: string, query: { search?: string; serviceType?: string; region?: string }) {
    const caregiver = await this.prisma.caregiver.findUnique({ where: { userId }, select: { id: true } });
    if (caregiver) {
      const activeContract = await this.prisma.contract.findFirst({
        where: { caregiverId: caregiver.id, status: { in: ACTIVE_CONTRACT_STATUSES } },
        select: { id: true },
      });
      if (activeContract) throw new ConflictException(ACTIVE_CONTRACT_MESSAGE);
    }
    await this.deposits.requireActiveDeposit(userId);
    const { search, serviceType, region } = query;
    const needs = await this.prisma.serviceNeed.findMany({
      where: {
        status: 'DIPUBLIKASIKAN',
        ...(serviceType ? { serviceType } : {}),
        ...(region ? { locationText: { contains: region, mode: 'insensitive' } } : {}),
        ...(search
          ? {
              OR: [
                { serviceType: { contains: search, mode: 'insensitive' } },
                { locationText: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        serviceType: true,
        locationText: true,
        startDate: true,
        schedule: true,
        durationHoursPerDay: true,
        frequency: true,
        totalHours: true,
        budgetEstimate: true,
        description: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return needs.map(publicNeed);
  }

  /** Update draft/publikasi milik sendiri (sebelum Deal). */
  async update(userId: string, id: string, dto: Record<string, any>) {
    const need = await this.owned(userId, id);
    if (!EDITABLE_STATUSES.includes(need.status)) {
      throw new ConflictException('Kebutuhan sudah Deal, tidak bisa diubah');
    }
    const allowed = [
      'serviceType', 'forWhom', 'locationText', 'locationLat', 'locationLng', 'schedule',
      'durationHoursPerDay', 'frequency', 'totalHours', 'conditionDesc', 'specialNeeds',
      'budgetEstimate', 'description', 'startDate', 'patientProfileId',
    ];
    const data: Record<string, any> = {};
    for (const k of allowed) if (dto[k] !== undefined) data[k] = dto[k];
    if (data.startDate) data.startDate = new Date(data.startDate);
    return this.prisma.serviceNeed.update({ where: { id }, data });
  }

  /** D-02: Draft → Dipublikasikan. */
  async publish(userId: string, id: string) {
    const need = await this.owned(userId, id);
    if (need.status !== 'DRAFT') throw new ConflictException('Hanya Draft yang bisa dipublikasikan');
    if (!need.serviceType || !need.locationText || !need.totalHours) {
      throw new ConflictException('Lengkapi jenis layanan, lokasi, dan total jam dulu');
    }
    return this.prisma.serviceNeed.update({ where: { id }, data: { status: 'DIPUBLIKASIKAN' } });
  }

  /** D-03: tutup kebutuhan (tanpa Deal = tanpa konsekuensi uang). */
  async close(userId: string, id: string) {
    const need = await this.owned(userId, id);
    if (!EDITABLE_STATUSES.includes(need.status)) {
      throw new ConflictException('Kebutuhan sudah Deal, ikuti aturan pembatalan kontrak');
    }
    return this.prisma.serviceNeed.update({ where: { id }, data: { status: 'DIBATALKAN' } });
  }

  private async owned(userId: string, id: string) {
    const need = await this.prisma.serviceNeed.findUnique({ where: { id } });
    if (!need) throw new NotFoundException('Kebutuhan tidak ditemukan');
    if (need.patientUserId !== userId) throw new ForbiddenException('Bukan kebutuhan Anda');
    return need;
  }
}
