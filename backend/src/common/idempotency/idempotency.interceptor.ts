import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import type { Request, Response } from 'express';
import { Observable, catchError, from, map, mergeMap, of, switchMap, throwError } from 'rxjs';
import { PrismaService } from '../../prisma.service';
import { SKIP_IDEMPOTENCY_KEY } from './idempotency.decorator';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const KEY_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;
/** Request IN_PROGRESS lebih tua dari ini dianggap gagal (proses crash) → boleh dicoba ulang. */
const STALE_IN_PROGRESS_MS = 2 * 60 * 1000;
/** Record dihapus setelah 24 jam. */
const RETENTION_MS = 24 * 60 * 60 * 1000;
const IN_PROGRESS_MSG = 'Request dengan Idempotency-Key ini sedang diproses.';

type Begin = { replay: true; body: unknown } | { replay: false; id: string };

/** JSON dengan urutan key stabil, agar hash tidak bergantung urutan field. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const parts = Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`);
  return `{${parts.join(',')}}`;
}

/** Metadata file upload (multer). Isi buffer tidak di-hash agar ringan. */
function fileMeta(req: Request): unknown {
  const anyReq = req as any;
  const files: any[] = [];
  if (anyReq.file) files.push(anyReq.file);
  if (Array.isArray(anyReq.files)) files.push(...anyReq.files);
  else if (anyReq.files) files.push(...(Object.values(anyReq.files).flat() as any[]));
  return files.map((f) => ({ field: f.fieldname, name: f.originalname, size: f.size, mime: f.mimetype }));
}

/**
 * Idempotency untuk semua request mutasi.
 *
 * - Header `Idempotency-Key` wajib (8–128 karakter alfanumerik, `-`, `_`).
 * - Key yang sama + isi request sama → response tersimpan di-replay (tidak dieksekusi ulang).
 * - Key yang sama + isi berbeda → 422.
 * - Key yang sama saat request sebelumnya masih berjalan → 409.
 * - Request yang gagal (exception) dihapus dari penyimpanan, sehingga boleh dicoba ulang.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Idempotency');

  constructor(private prisma: PrismaService, private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: any }>();
    if (!MUTATING_METHODS.has(req.method)) return next.handle();

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_IDEMPOTENCY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return next.handle();

    const key = req.header('Idempotency-Key')?.trim();
    if (!key) {
      return throwError(() => new BadRequestException('Header Idempotency-Key wajib diisi untuk request ini.'));
    }
    if (!KEY_PATTERN.test(key)) {
      return throwError(
        () => new BadRequestException('Idempotency-Key tidak valid (8–128 karakter: huruf, angka, "-" atau "_").'),
      );
    }

    const actor: string = req.user?.sub ?? req.user?.id ?? 'anon';
    const route = `${req.method} ${req.originalUrl.split('?')[0]}`;
    const requestHash = createHash('sha256')
      .update(stableStringify({ body: req.body ?? null, files: fileMeta(req) }))
      .digest('hex');
    const res = context.switchToHttp().getResponse<Response>();

    return from(this.begin(actor, route, key, requestHash)).pipe(
      switchMap((state: Begin) => {
        if (state.replay) {
          res.setHeader('Idempotent-Replayed', 'true');
          return of(state.body);
        }
        const id = state.id;
        return next.handle().pipe(
          // Handler gagal: lepas kunci agar klien boleh mengulang request.
          catchError((err) => from(this.release(id)).pipe(mergeMap(() => throwError(() => err)))),
          // Handler sukses: simpan response. Jika penyimpanan gagal, record tetap
          // IN_PROGRESS agar tidak terjadi eksekusi ganda.
          mergeMap((body) => from(this.complete(id, body)).pipe(map(() => body))),
        );
      }),
    );
  }

  private async begin(actor: string, route: string, key: string, requestHash: string): Promise<Begin> {
    this.cleanupExpired();

    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { actor_route_key: { actor, route, key } },
    });
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new UnprocessableEntityException(
          'Idempotency-Key ini sudah dipakai untuk request dengan isi yang berbeda.',
        );
      }
      if (existing.status === 'COMPLETED') {
        return { replay: true, body: existing.responseBody };
      }
      if (Date.now() - existing.createdAt.getTime() < STALE_IN_PROGRESS_MS) {
        throw new ConflictException(IN_PROGRESS_MSG);
      }
      await this.prisma.idempotencyKey.deleteMany({ where: { id: existing.id, status: 'IN_PROGRESS' } });
    }

    try {
      const created = await this.prisma.idempotencyKey.create({
        data: { actor, route, key, requestHash, status: 'IN_PROGRESS' },
      });
      return { replay: false, id: created.id };
    } catch (e) {
      // Dua request paralel dengan key sama: yang kalah kena unique constraint.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(IN_PROGRESS_MSG);
      }
      throw e;
    }
  }

  private async complete(id: string, body: unknown): Promise<void> {
    // Normalisasi ke JSON persis seperti yang dikirim ke klien.
    const json = body === undefined ? null : JSON.parse(JSON.stringify(body));
    await this.prisma.idempotencyKey.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        responseBody: json ?? Prisma.JsonNull,
        completedAt: new Date(),
      },
    });
  }

  private async release(id: string): Promise<void> {
    await this.prisma.idempotencyKey
      .deleteMany({ where: { id, status: 'IN_PROGRESS' } })
      .catch((e) => this.logger.warn(`Gagal melepas idempotency key ${id}: ${e?.message ?? e}`));
  }

  /** Pembersihan ringan: ~1% request memicu penghapusan record kedaluwarsa. */
  private cleanupExpired(): void {
    if (Math.random() > 0.01) return;
    this.prisma.idempotencyKey
      .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } } })
      .catch((e) => this.logger.warn(`Gagal membersihkan idempotency key: ${e?.message ?? e}`));
  }
}
