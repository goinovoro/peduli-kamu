import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/** Blok pembulatan rekap: 15 menit (payment #3.6). */
const ROUND_BLOCK_MINUTES = 15;
/** Akurasi GPS maksimum yang diterima (meter). */
const MAX_ACCURACY_M = 100;
/** Zona waktu operasional layanan. Batas "satu per hari" memakai tanggal lokal ini. */
const WORK_TZ = 'Asia/Jakarta';
/** Jendela pencarian record hari ini (24 jam + margin). */
const SAME_DAY_LOOKBACK_MS = 36 * 60 * 60 * 1000;

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: WORK_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const timeFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: WORK_TZ,
  hour: '2-digit',
  minute: '2-digit',
});

/** Tanggal kalender (YYYY-MM-DD) di zona kerja untuk sebuah waktu. */
export function workDayKey(date: Date): string {
  return dayFormatter.format(date);
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const APPROVED = ['DISETUJUI', 'DISETUJUI_ADMIN'];

type ClockType = 'CLOCK_IN' | 'CLOCK_OUT';
type ClockInput = { photoUrl: string; lat?: number; lng?: number; accuracyM?: number };

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  private async caregiverContract(userId: string, contractId: string) {
    const caregiver = await this.prisma.caregiver.findUnique({ where: { userId } });
    if (!caregiver) throw new ForbiddenException('Hanya Mitra pelaksana yang bisa absen');
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Kontrak tidak ditemukan');
    if (contract.caregiverId !== caregiver.id) throw new ForbiddenException('Bukan kontrak Anda');
    return { caregiver, contract };
  }

  private async partyContract(userId: string, role: string, contractId: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Kontrak tidak ditemukan');
    if (role === 'admin') return contract;
    if (contract.patientUserId === userId) return contract;
    const cg = await this.prisma.caregiver.findUnique({ where: { userId } });
    if (cg && contract.caregiverId === cg.id) return contract;
    throw new ForbiddenException('Bukan kontrak Anda');
  }

  private checkGps(lat?: number, lng?: number, accuracyM?: number) {
    if (lat === undefined || lng === undefined || Number.isNaN(lat) || Number.isNaN(lng)) {
      throw new BadRequestException('GPS wajib aktif (latitude/longitude tidak ada)');
    }
    if (accuracyM !== undefined && accuracyM > MAX_ACCURACY_M) {
      throw new BadRequestException('Akurasi GPS buruk (>100 m). Pindah ke area terbuka lalu ulangi.');
    }
  }

  /** Clock-in yang belum dipasangkan dengan clock-out. */
  private async openClockIn(db: Prisma.TransactionClient, contractId: string) {
    const ins = await db.attendance.findMany({
      where: { contractId, type: 'CLOCK_IN' },
      orderBy: { serverTime: 'desc' },
    });
    if (ins.length === 0) return null;
    const outs = await db.attendance.findMany({
      where: { contractId, type: 'CLOCK_OUT' },
      select: { sessionPairId: true },
    });
    const paired = new Set(outs.map((o) => o.sessionPairId));
    return ins.find((i) => !paired.has(i.id)) ?? null;
  }

  /**
   * Record clock-in/out kontrak pada hari kalender ini (WIB) — termasuk yang ditolak,
   * agar satu hari tetap hanya punya satu clock-in dan satu clock-out.
   */
  private async findRecordToday(
    db: Prisma.TransactionClient,
    contractId: string,
    type: ClockType,
    now: Date,
  ) {
    const rows = await db.attendance.findMany({
      where: { contractId, type, serverTime: { gte: new Date(now.getTime() - SAME_DAY_LOOKBACK_MS) } },
      orderBy: { serverTime: 'desc' },
    });
    const today = workDayKey(now);
    return rows.find((r) => workDayKey(r.serverTime) === today) ?? null;
  }

  /**
   * Inti H-01/H-02. Seluruh pemeriksaan + pembuatan record berjalan dalam satu
   * transaksi yang dikunci per kontrak (advisory lock), sehingga dua request paralel
   * tidak bisa sama-sama lolos cek "sekali per hari".
   */
  private async recordClock(userId: string, contractId: string, type: ClockType, input: ClockInput) {
    const { contract } = await this.caregiverContract(userId, contractId);
    if (!['SIAP_JALAN', 'BERJALAN'].includes(contract.status)) {
      throw new ConflictException('Layanan belum siap jalan');
    }
    this.checkGps(input.lat, input.lng, input.accuracyM);

    const insideRadius =
      contract.locationLat != null && contract.locationLng != null
        ? haversineM(input.lat!, input.lng!, contract.locationLat, contract.locationLng) <=
          (contract.attendanceRadiusM ?? 150)
        : true;
    const now = new Date();

    const rec = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${contractId}))::text AS locked`;

      const open = await this.openClockIn(tx, contractId);
      if (type === 'CLOCK_IN' && open) {
        throw new ConflictException('Masih ada clock-in yang belum di-clock-out');
      }
      if (type === 'CLOCK_OUT' && !open) {
        throw new ConflictException('Tidak ada clock-in terbuka untuk di-clock-out');
      }

      const sameDay = await this.findRecordToday(tx, contractId, type, now);
      if (sameDay) {
        const at = timeFormatter.format(sameDay.serverTime);
        throw new ConflictException(
          type === 'CLOCK_IN'
            ? `Clock-in hari ini sudah tercatat pukul ${at}. Satu clock-in per hari per tempat kerja.`
            : `Clock-out hari ini sudah tercatat pukul ${at}. Satu clock-out per hari per tempat kerja.`,
        );
      }

      return tx.attendance.create({
        data: {
          contractId,
          caregiverId: contract.caregiverId,
          type,
          photoUrl: input.photoUrl,
          lat: input.lat,
          lng: input.lng,
          accuracyM: input.accuracyM,
          insideRadius,
          status: 'MENUNGGU_APPROVAL_PASIEN',
          sessionPairId: type === 'CLOCK_OUT' ? open!.id : null,
        },
      });
    });

    if (type === 'CLOCK_IN') {
      await this.notifications.notify(
        contract.patientUserId,
        'ABSENSI_BARU',
        'Mitra clock-in, perlu approval',
        insideRadius ? 'Mitra tiba di lokasi. Buka untuk approve.' : 'Mitra clock-in DI LUAR radius lokasi.',
      );
    } else {
      await this.notifications.notify(
        contract.patientUserId,
        'ABSENSI_BARU',
        'Mitra clock-out, perlu approval',
        'Durasi sesi dihitung sistem setelah Anda approve.',
      );
    }
    return rec;
  }

  /** H-01: clock-in di lokasi (foto live + waktu server + GPS). Maks. 1 per hari. */
  clockIn(userId: string, contractId: string, photoUrl: string, lat?: number, lng?: number, accuracyM?: number) {
    return this.recordClock(userId, contractId, 'CLOCK_IN', { photoUrl, lat, lng, accuracyM });
  }

  /** H-02: clock-out, otomatis terpasang ke clock-in terbuka. Maks. 1 per hari. Durasi dihitung sistem. */
  clockOut(userId: string, contractId: string, photoUrl: string, lat?: number, lng?: number, accuracyM?: number) {
    return this.recordClock(userId, contractId, 'CLOCK_OUT', { photoUrl, lat, lng, accuracyM });
  }

  list(userId: string, role: string, contractId: string) {
    return this.partyContract(userId, role, contractId).then(() =>
      this.prisma.attendance.findMany({
        where: { contractId },
        orderBy: { serverTime: 'asc' },
      }),
    );
  }

  /** H-03: pasien setujui/tolak absensi per sesi. */
  async review(userId: string, id: string, approve: boolean, reason?: string) {
    const rec = await this.prisma.attendance.findUnique({
      where: { id },
      include: { contract: true },
    });
    if (!rec) throw new NotFoundException('Absensi tidak ditemukan');
    if (rec.contract.patientUserId !== userId) {
      throw new ForbiddenException('Hanya Pasien pemilik kontrak yang bisa approve');
    }
    if (rec.status !== 'MENUNGGU_APPROVAL_PASIEN') {
      throw new ConflictException('Absensi sudah diproses');
    }
    return this.prisma.attendance.update({
      where: { id },
      data: approve
        ? { status: 'DISETUJUI', patientApprovedBy: userId, patientApprovedAt: new Date() }
        : { status: 'DITOLAK', patientApprovedBy: userId, patientApprovedAt: new Date(), rejectReason: reason ?? null },
    });
  }

  /** H-04: override admin untuk yang lewat batas / sengketa. */
  async override(adminId: string, id: string, approve: boolean) {
    const rec = await this.prisma.attendance.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('Absensi tidak ditemukan');
    return this.prisma.attendance.update({
      where: { id },
      data: { status: approve ? 'DISETUJUI_ADMIN' : 'DITOLAK_ADMIN', adminOverrideBy: adminId },
    });
  }

  /**
   * H-05: rekap jam. Sesi dihitung jika IN dan OUT sama-sama approved
   * (pasien atau admin). Durasi per sesi dibulatkan ke bawah per 15 menit.
   */
  async recap(contractId: string) {
    const all = await this.prisma.attendance.findMany({
      where: { contractId },
      orderBy: { serverTime: 'asc' },
    });
    const ins = new Map(all.filter((a) => a.type === 'CLOCK_IN').map((a) => [a.id, a]));
    const sessions = all
      .filter((a) => a.type === 'CLOCK_OUT' && a.sessionPairId && ins.has(a.sessionPairId!))
      .map((out) => {
        const inp = ins.get(out.sessionPairId!)!;
        const rawMin = Math.max(0, Math.round((out.serverTime.getTime() - inp.serverTime.getTime()) / 60000));
        const approved = APPROVED.includes(inp.status) && APPROVED.includes(out.status);
        return {
          inId: inp.id,
          outId: out.id,
          start: inp.serverTime,
          end: out.serverTime,
          minutesRaw: rawMin,
          minutesCounted: approved ? Math.floor(rawMin / ROUND_BLOCK_MINUTES) * ROUND_BLOCK_MINUTES : 0,
          approved,
          inStatus: inp.status,
          outStatus: out.status,
        };
      });
    return {
      sessions,
      workedMinutes: sessions.reduce((s, x) => s + x.minutesCounted, 0),
      approvedSessions: sessions.filter((s) => s.approved).length,
      pendingCount: all.filter((a) => a.status === 'MENUNGGU_APPROVAL_PASIEN').length,
    };
  }
}
