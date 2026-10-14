// Idempotency-Key untuk request mutasi (POST/PUT/PATCH/DELETE).
//
// Key dibuat dari "sidik jari" request (method + URL + isi body). Request identik
// yang dikirim ulang selama belum sukses memakai key yang sama, sehingga:
//  - klik ganda / submit ganda tidak membuat data dobel (backend replay/409),
//  - retry setelah gagal jaringan aman (backend bisa mengenali request yang sudah diproses).
// Key dilepas setelah response sukses, sehingga aksi berikutnya (sengaja) memakai key baru.

export const IDEMPOTENCY_HEADER = 'Idempotency-Key';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const TTL_MS = 10 * 60 * 1000;

interface PendingEntry {
  key: string;
  at: number;
}

const pending = new Map<string, PendingEntry>();

export function isMutation(method: string): boolean {
  return MUTATING_METHODS.has(method.toUpperCase());
}

/** JSON dengan urutan key stabil. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const parts = Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`);
  return `{${parts.join(',')}}`;
}

/** FormData: file diwakili metadata-nya (nama, ukuran, tipe), bukan isi biner. */
function serializeBody(body: unknown): unknown {
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return [...body.entries()].map(([k, v]) => [
      k,
      typeof File !== 'undefined' && v instanceof File
        ? { name: v.name, size: v.size, type: v.type, modified: v.lastModified }
        : v,
    ]);
  }
  return body ?? null;
}

function newKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // Fallback untuk konteks non-secure (mis. akses via IP LAN tanpa HTTPS).
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function prune(now: number) {
  for (const [fp, entry] of pending) {
    if (now - entry.at > TTL_MS) pending.delete(fp);
  }
}

/** Ambil key untuk request ini; request identik yang belum sukses memakai key yang sama. */
export function idempotencyKeyFor(method: string, url: string, body: unknown): string {
  const now = Date.now();
  prune(now);
  const fingerprint = `${method.toUpperCase()} ${url} ${stableStringify(serializeBody(body))}`;
  const hit = pending.get(fingerprint);
  if (hit) return hit.key;
  const key = newKey();
  pending.set(fingerprint, { key, at: now });
  return key;
}

/** Lepas key setelah request sukses. */
export function releaseIdempotencyKey(key: string) {
  for (const [fp, entry] of pending) {
    if (entry.key === key) pending.delete(fp);
  }
}
