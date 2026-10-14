// Normalisasi role backend (lama: family/caregiver, baru: PASIEN/MITRA, plus admin).
// Frontend memakai grup: 'pasien' | 'mitra' | 'admin' untuk navigasi & middleware.

export type BackendRole = 'family' | 'caregiver' | 'admin' | 'PASIEN' | 'MITRA';
export type RoleGroup = 'pasien' | 'mitra' | 'admin';

export function toRoleGroup(role: BackendRole | string | null | undefined): RoleGroup | null {
  if (role === 'family' || role === 'PASIEN') return 'pasien';
  if (role === 'caregiver' || role === 'MITRA') return 'mitra';
  if (role === 'admin') return 'admin';
  return null;
}

export function dashboardPath(role: BackendRole | string | null | undefined): string {
  const g = toRoleGroup(role);
  if (g === 'mitra') return '/mitra/dashboard';
  if (g === 'admin') return '/admin';
  return '/family/dashboard';
}

export function roleLabel(role: BackendRole | string | null | undefined): string {
  const g = toRoleGroup(role);
  if (g === 'mitra') return 'Mitra Perawat';
  if (g === 'admin') return 'Admin';
  return 'Keluarga';
}

/** Role backend yang dikirim saat registrasi (format baru). */
export function registerRole(group: 'pasien' | 'mitra'): 'PASIEN' | 'MITRA' {
  return group === 'mitra' ? 'MITRA' : 'PASIEN';
}
