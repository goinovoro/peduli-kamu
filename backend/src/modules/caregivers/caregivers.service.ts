import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

// Field profil yang wajib terisi sebelum bisa ajukan verifikasi (B-01/B-03).
const REQUIRED_PROFILE_FIELDS = [
  'domicile',
  'serviceArea',
  'education',
  'experience',
  'competencies',
  'bankName',
  'bankAccountNo',
  'bankAccountName',
] as const;
const REQUIRED_VERIFICATION_CONSENTS = [
  'KETENTUAN_PLATFORM',
  'KODE_ETIK',
  'PELAYANAN',
  'KOMUNIKASI',
  'PRIVASI',
  'PEMBATALAN',
  'PEMBAYARAN',
  'SENGKETA',
];

const EDITABLE_PROFILE_FIELDS = [
  ...REQUIRED_PROFILE_FIELDS,
  'university',
  'graduationYear',
  'ratePerHour',
  'tier',
  'location',
  'isAvailable',
  'certifications',
  'strNo',
  'strStatus',
  'bio',
] as const;

const FULL_PROFILE_SELECT = {
  id: true,
  university: true,
  graduationYear: true,
  ratePerHour: true,
  strStatus: true,
  tier: true,
  location: true,
  isAvailable: true,
  domicile: true,
  serviceArea: true,
  education: true,
  experience: true,
  competencies: true,
  certifications: true,
  strNo: true,
  bio: true,
  bankName: true,
  bankAccountNo: true,
  bankAccountName: true,
  verificationStatus: true,
  verificationNote: true,
  depositExpiresAt: true,
  ratingAvg: true,
  totalFinished: true,
  user: { select: { id: true, name: true, email: true, phone: true } },
} as const;

// Data yang memang boleh dilihat tanpa sesi / sebelum ada layanan.
// Jangan pernah menambahkan rekening, email, nomor telepon, atau dokumen di sini.
const PUBLIC_PROFILE_SELECT = {
  id: true,
  university: true,
  graduationYear: true,
  ratePerHour: true,
  strStatus: true,
  tier: true,
  location: true,
  isAvailable: true,
  serviceArea: true,
  education: true,
  experience: true,
  competencies: true,
  certifications: true,
  bio: true,
  verificationStatus: true,
  ratingAvg: true,
  totalFinished: true,
  user: { select: { id: true, name: true, photoUrl: true } },
} as const;

@Injectable()
export class CaregiversService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  search(query: { search?: string; tier?: string; strStatus?: string; skip?: string }) {
    const { search, tier, strStatus } = query;
    const requestedSkip = Number(query.skip ?? 0);
    const skip = Number.isSafeInteger(requestedSkip) ? Math.min(100_000, Math.max(0, requestedSkip)) : 0;
    return this.prisma.caregiver.findMany({
      where: {
        verificationStatus: 'DISETUJUI',
        user: { accountStatus: 'AKTIF' },
        ...(tier && tier !== 'all' ? { tier: tier as any } : {}),
        ...(strStatus && strStatus !== 'all' ? { strStatus: strStatus as any } : {}),
        ...(search
          ? {
              OR: [
                { location: { contains: search, mode: 'insensitive' } },
                { serviceArea: { contains: search, mode: 'insensitive' } },
                { competencies: { contains: search, mode: 'insensitive' } },
                { education: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      select: PUBLIC_PROFILE_SELECT,
      orderBy: [{ ratingAvg: 'desc' }, { totalFinished: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
      skip,
      // Satu item ekstra dipakai UI untuk menentukan apakah halaman berikutnya tersedia.
      take: 25,
    });
  }

  async findOne(id: string) {
    const caregiver = await this.prisma.caregiver.findFirst({
      where: { id, verificationStatus: 'DISETUJUI', user: { accountStatus: 'AKTIF' } },
      select: PUBLIC_PROFILE_SELECT,
    });
    if (!caregiver) throw new NotFoundException('Profil mitra tidak ditemukan');
    return caregiver;
  }

  /** Profil lengkap milik sendiri (B-01). */
  async myProfile(userId: string) {
    const caregiver = await this.prisma.caregiver.findUnique({
      where: { userId },
      select: {
        ...FULL_PROFILE_SELECT,
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!caregiver) throw new NotFoundException('Profil caregiver tidak ditemukan');
    return caregiver;
  }

  /** Update profil profesional + rekening (B-01). Hanya field whitelist. */
  async updateMyProfile(userId: string, dto: Record<string, unknown>) {
    const caregiver = await this.prisma.caregiver.findUnique({ where: { userId } });
    if (!caregiver) throw new NotFoundException('Profil caregiver tidak ditemukan');
    const data: Record<string, unknown> = {};
    for (const key of EDITABLE_PROFILE_FIELDS) {
      if (dto[key] !== undefined) data[key] = dto[key];
    }
    if (data.graduationYear !== undefined) data.graduationYear = Number(data.graduationYear);
    if (data.ratePerHour !== undefined) data.ratePerHour = Number(data.ratePerHour);
    if (data.isAvailable !== undefined) data.isAvailable = Boolean(data.isAvailable);
    return this.prisma.caregiver.update({
      where: { userId },
      data,
      select: FULL_PROFILE_SELECT,
    });
  }

  /**
   * B-03: ajukan verifikasi. Syarat: profil lengkap + ≥1 dokumen (selain DITOLAK).
   * MENUNGGU/PERLU_PERBAIKAN/DITOLAK boleh mengajukan; DITINJAU/DISETUJUI ditolak.
   */
  async submitVerification(userId: string) {
    const caregiver = await this.prisma.caregiver.findUnique({
      where: { userId },
      include: { documents: true },
    });
    if (!caregiver) throw new NotFoundException('Profil caregiver tidak ditemukan');
    if (caregiver.verificationStatus === 'DITINJAU') {
      throw new ConflictException('Pengajuan sedang ditinjau Admin');
    }
    if (caregiver.verificationStatus === 'DISETUJUI') {
      throw new ConflictException('Akun sudah terverifikasi');
    }
    const missing: string[] = REQUIRED_PROFILE_FIELDS.filter((f) => !(caregiver as any)[f]);
    const validDocs = caregiver.documents.filter((d) => d.status !== 'DITOLAK');
    if (validDocs.length === 0) missing.push('dokumen (minimal 1)');
    const savedConsents = await this.prisma.consent.findMany({
      where: { userId, kind: { in: REQUIRED_VERIFICATION_CONSENTS } },
      select: { kind: true },
    });
    const accepted = new Set(savedConsents.map((consent) => consent.kind));
    for (const kind of REQUIRED_VERIFICATION_CONSENTS) {
      if (!accepted.has(kind)) missing.push(`persetujuan ${kind}`);
    }
    if (missing.length > 0) {
      throw new BadRequestException(`Lengkapi dulu: ${missing.join(', ')}`);
    }
    return this.prisma.caregiver.update({
      where: { userId },
      data: { verificationStatus: 'DITINJAU', verificationNote: null },
      select: FULL_PROFILE_SELECT,
    });
  }

  /** Antrian verifikasi untuk Admin (N-04). */
  verificationQueue() {
    return this.prisma.caregiver.findMany({
      where: { verificationStatus: 'DITINJAU' },
      select: {
        ...FULL_PROFILE_SELECT,
        documents: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** B-04: putusan verifikasi oleh Admin. */
  async decideVerification(id: string, status: string, note?: string) {
    const caregiver = await this.prisma.caregiver.findUnique({ where: { id } });
    if (!caregiver) throw new NotFoundException('Caregiver tidak ditemukan');
    const updated = await this.prisma.caregiver.update({
      where: { id },
      data: { verificationStatus: status as any, verificationNote: note ?? null },
      select: FULL_PROFILE_SELECT,
    });
    await this.notifications.notify(
      caregiver.userId,
      status === 'DISETUJUI' ? 'VERIFIKASI_DISETUJUI' : 'VERIFIKASI_DITOLAK',
      status === 'DISETUJUI' ? 'Verifikasi disetujui' : 'Verifikasi perlu perbaikan',
      note ?? 'Lanjut ke pembayaran commitment fee untuk aktivasi.',
    );
    return updated;
  }
}
