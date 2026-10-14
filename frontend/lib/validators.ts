// Validasi sisi frontend — dijalankan SEBELUM request ke backend.
// Aturan diselaraskan dengan DTO backend (RegisterDto, needs, bookings, dsb)
// agar error 400 bisa dicegah lebih awal dengan pesan Bahasa Indonesia.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function required(value: unknown, field = 'Field'): string | null {
  if (value === null || value === undefined) return `${field} wajib diisi.`;
  if (typeof value === 'string' && !value.trim()) return `${field} wajib diisi.`;
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email?.trim()) return 'Email wajib diisi.';
  if (!EMAIL_RE.test(email.trim())) return 'Format email tidak valid.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Kata sandi wajib diisi.';
  if (password.length < 8) return 'Kata sandi minimal 8 karakter.';
  return null;
}

export function validateName(name: string, field = 'Nama'): string | null {
  if (!name?.trim()) return `${field} wajib diisi.`;
  if (name.trim().length < 3) return `${field} minimal 3 karakter.`;
  return null;
}

export function validatePositiveInt(raw: unknown, field: string): string | null {
  if (raw === '' || raw === null || raw === undefined) return `${field} wajib diisi.`;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return `${field} harus bilangan bulat lebih dari 0.`;
  return null;
}

export function validateAge(raw: unknown): string | null {
  if (raw === '' || raw === null || raw === undefined) return 'Umur wajib diisi.';
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 150) return 'Umur harus antara 0–150 tahun.';
  return null;
}

export function validateGraduationYear(raw: unknown): string | null {
  if (raw === '' || raw === null || raw === undefined) return 'Tahun lulus wajib diisi.';
  const n = Number(raw);
  const now = new Date().getFullYear();
  if (!Number.isInteger(n) || n < 1950 || n > now) return `Tahun lulus harus antara 1950–${now}.`;
  return null;
}

export function validateFutureDateTime(raw: string): string | null {
  if (!raw) return 'Tanggal & waktu wajib diisi.';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return 'Tanggal & waktu tidak valid.';
  if (d.getTime() <= Date.now()) return 'Jadwal harus di masa depan.';
  return null;
}

/** Validasi file upload sesuai batas backend: maks 5MB, tipe JPG/PNG/PDF (absensi: tanpa PDF). */
export function validateUploadFile(
  file: File | null | undefined,
  opts: { allowPdf?: boolean; maxMb?: number; field?: string } = {},
): string | null {
  const { allowPdf = true, maxMb = 5, field = 'File' } = opts;
  if (!file) return `${field} wajib diunggah.`;
  const okTypes = allowPdf ? ['image/jpeg', 'image/png', 'application/pdf'] : ['image/jpeg', 'image/png'];
  if (!okTypes.includes(file.type)) {
    return allowPdf ? `${field} harus JPG, PNG, atau PDF.` : `${field} harus JPG atau PNG (foto live).`;
  }
  if (file.size > maxMb * 1024 * 1024) return `${field} maksimal ${maxMb}MB.`;
  return null;
}

/** Kumpulkan error лен — return null jika semua valid, atau pesan pertama. */
export function firstError(...errors: Array<string | null>): string | null {
  return errors.find((e) => e) ?? null;
}
