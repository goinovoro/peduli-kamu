import { SetMetadata } from '@nestjs/common';

export const SKIP_IDEMPOTENCY_KEY = 'skipIdempotency';

/**
 * Lewati pengecekan Idempotency-Key untuk handler/controller tertentu.
 * Dipakai untuk endpoint yang men-set/menghapus cookie (auth), karena replay
 * dari response tersimpan tidak bisa menjalankan side-effect cookie.
 */
export const SkipIdempotency = () => SetMetadata(SKIP_IDEMPOTENCY_KEY, true);
