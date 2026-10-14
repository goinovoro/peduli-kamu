// Helper format + label status (Bahasa Indonesia) + pemetaan badge.
// Enum mengikuti prisma/schema.prisma backend agar konsisten dengan API.

export function formatRupiah(n: number | string | null | undefined): string {
  const num = Number(n ?? 0);
  if (Number.isNaN(num)) return 'Rp 0';
  return `Rp ${num.toLocaleString('id-ID')}`;
}

export function formatDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return '-';
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return '-';
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';

const STATUS_LABEL: Record<string, string> = {
  // Need
  DRAFT: 'Draft', DIPUBLIKASIKAN: 'Dipublikasikan', DALAM_PEMBAHASAN: 'Dibahas',
  DEAL: 'Deal', MENUNGGU_PEMBAYARAN: 'Menunggu Bayar', SIAP_JALAN: 'Siap Jalan',
  BERJALAN: 'Berjalan', SELESAI: 'Selesai', DIBATALKAN: 'Dibatalkan', SENGKETA: 'Sengketa',
  // Interest (DIBATALKAN memakai label yang sama dengan Need di atas)
  MENUNGGU_RESPON: 'Menunggu Respon', DITERIMA: 'Diterima', DITOLAK: 'Ditolak',
  // Contract
  DEAL_MENUNGGU_BAYAR: 'Menunggu Bayar', DIBAYAR_DITAHAN: 'Dana Ditahan',
  MENUNGGU_KONFIRMASI: 'Menunggu Konfirmasi',
  DIBATALKAN_PASIEN: 'Batal (Pasien)', DIBATALKAN_MITRA: 'Batal (Mitra)',
  // Payment
  MENUNGGU_BAYAR: 'Menunggu Bayar', MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
  DITERUSKAN_PAYOUT: 'Diteruskan Payout', DIKEMBALIKAN_SEBAGIAN: 'Dikembalikan Sebagian',
  DITAHAN_SENGKETA: 'Ditahan Sengketa', GAGAL: 'Gagal',
  // Payout
  BELUM_LAYAK: 'Belum Layak', LAYAK_BAYAR: 'Layak Bayar', DIPROSES: 'Diproses',
  DIBAYARKAN: 'Dibayarkan', DIBAYARKAN_SEBAGIAN: 'Dibayar Sebagian', DITAHAN: 'Ditahan',
  // Deposit
  AKTIF: 'Aktif', KEDALUWARSA: 'Kedaluwarsa', DIPERBARUI: 'Diperbarui',
  HANGUS_TERTANAM: 'Hangus', HANGUS_PELANGGARAN: 'Hangus (Pelanggaran)',
  DIKEMBALIKAN: 'Dikembalikan', MENUNGGU: 'Menunggu', DITINJAU: 'Ditinjau',
  DISETUJUI: 'Disetujui', PERLU_PERBAIKAN: 'Perlu Perbaikan',
  // Attendance
  MENUNGGU_APPROVAL_PASIEN: 'Menunggu Approve', DISETUJUI_ADMIN: 'Disetujui Admin', DITOLAK_ADMIN: 'Ditolak Admin',
  // Account
  BELUM_LENGKAP: 'Belum Lengkap', TIDAK_AKTIF: 'Tidak Aktif', DITANGGUHKAN: 'Ditangguhkan',
  DIBLOKIR: 'Diblokir', TERKUNCI_PERIODE: 'Terkunci Periode', DIBEKUKAN: 'Dibekukan',
  // Dispute
  BARU: 'Baru', BUTUH_INFO: 'Butuh Info', DITUTUP: 'Ditutup',
  // Legacy booking
  pending: 'Menunggu', upcoming: 'Akan Datang', past: 'Selesai', cancelled: 'Dibatalkan',
};

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  DRAFT: 'secondary', DIPUBLIKASIKAN: 'info', DALAM_PEMBAHASAN: 'info',
  DEAL: 'info', MENUNGGU_PEMBAYARAN: 'warning', SIAP_JALAN: 'info',
  BERJALAN: 'info', SELESAI: 'success', DIBATALKAN: 'destructive', SENGKETA: 'warning',
  MENUNGGU_RESPON: 'warning', DITERIMA: 'success', DITOLAK: 'destructive',
  DEAL_MENUNGGU_BAYAR: 'warning', DIBAYAR_DITAHAN: 'info',
  MENUNGGU_KONFIRMASI: 'warning', DIBATALKAN_PASIEN: 'destructive', DIBATALKAN_MITRA: 'destructive',
  MENUNGGU_BAYAR: 'warning', MENUNGGU_VERIFIKASI: 'warning',
  DITERUSKAN_PAYOUT: 'success', DIKEMBALIKAN_SEBAGIAN: 'warning',
  DITAHAN_SENGKETA: 'destructive', GAGAL: 'destructive',
  BELUM_LAYAK: 'secondary', LAYAK_BAYAR: 'info', DIPROSES: 'warning',
  DIBAYARKAN: 'success', DIBAYARKAN_SEBAGIAN: 'success', DITAHAN: 'destructive',
  AKTIF: 'success', KEDALUWARSA: 'warning', DIPERBARUI: 'info',
  HANGUS_TERTANAM: 'destructive', HANGUS_PELANGGARAN: 'destructive',
  DIKEMBALIKAN: 'success', MENUNGGU: 'warning', DITINJAU: 'info',
  DISETUJUI: 'success', PERLU_PERBAIKAN: 'warning',
  MENUNGGU_APPROVAL_PASIEN: 'warning', DISETUJUI_ADMIN: 'success', DITOLAK_ADMIN: 'destructive',
  BELUM_LENGKAP: 'warning', TIDAK_AKTIF: 'secondary', DITANGGUHKAN: 'warning',
  DIBLOKIR: 'destructive', TERKUNCI_PERIODE: 'warning', DIBEKUKAN: 'destructive',
  BARU: 'info', BUTUH_INFO: 'warning', DITUTUP: 'secondary',
  pending: 'warning', upcoming: 'info', past: 'success', cancelled: 'destructive',
};

export function statusLabel(status: string | null | undefined): string {
  if (!status) return '-';
  return STATUS_LABEL[status] ?? status;
}

export function statusVariant(status: string | null | undefined): BadgeVariant {
  if (!status) return 'secondary';
  return STATUS_VARIANT[status] ?? 'secondary';
}

/** Bangun URL privat file backend menjadi URL absolut yang melewati pemeriksaan ACL. */
export function uploadUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  const base = (useRuntimeConfig().public.apiBase as string).replace(/\/$/, '');
  const match = path.match(/^\/?uploads\/(documents|payments|attendance)\/([^/]+)$/);
  if (!match) return undefined;
  return `${base}/files/${match[1]}/${encodeURIComponent(match[2])}`;
}
