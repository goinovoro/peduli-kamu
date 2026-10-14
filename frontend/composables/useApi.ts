// Wrapper $fetch ke NestJS backend (cookie HttpOnly ikut terkirim saat SSR/CSR).
// + normalisasi pesan error backend agar konsisten ditampilkan via toast/inline.
// + Idempotency-Key otomatis untuk setiap request mutasi (lihat lib/idempotency.ts).

import { IDEMPOTENCY_HEADER, idempotencyKeyFor, isMutation, releaseIdempotencyKey } from '@/lib/idempotency';

export function useApi() {
  const config = useRuntimeConfig();
  return $fetch.create({
    baseURL: config.public.apiBase as string,
    credentials: 'include',
    headers: { Accept: 'application/json' },
    onRequest({ request, options }) {
      const method = (options.method ?? 'GET').toUpperCase();
      if (!isMutation(method)) return;
      const headers = new Headers(options.headers as HeadersInit | undefined);
      // Pemanggil boleh memberi key sendiri; jika tidak, key diturunkan dari request.
      if (!headers.has(IDEMPOTENCY_HEADER)) {
        headers.set(IDEMPOTENCY_HEADER, idempotencyKeyFor(method, String(request), options.body));
      }
      options.headers = headers;
    },
    onResponse({ options, response }) {
      if (!response.ok) return; // gagal: key dipertahankan agar retry tetap aman
      const key = new Headers(options.headers as HeadersInit | undefined).get(IDEMPOTENCY_HEADER);
      if (key) releaseIdempotencyKey(key);
    },
  });
}

/** Ambil pesan error backend: dukung string | string[] (ValidationPipe) | FetchError. */
export function getApiErrorMessage(e: any, fallback = 'Terjadi kesalahan. Silakan coba lagi.'): string {
  const data = e?.data ?? e?.response?._data;
  const msg = data?.message ?? e?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string' && msg.trim()) {
    // Samarkan pesan teknis menjadi Bahasa Indonesia yang ramah (tanpa hilangkan info)
    if (/unauthorized/i.test(msg)) return 'Sesi berakhir. Silakan masuk kembali.';
    return msg;
  }
  return fallback;
}

export function getApiStatus(e: any): number | null {
  return e?.response?.status ?? e?.statusCode ?? null;
}

export function isUnauthorized(e: any): boolean {
  return getApiStatus(e) === 401;
}

export function isForbidden(e: any): boolean {
  return getApiStatus(e) === 403;
}
