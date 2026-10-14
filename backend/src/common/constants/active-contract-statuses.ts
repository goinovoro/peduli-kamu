import { ContractStatus } from '@prisma/client';

/** Status kontrak yang masih mengunci mitra dari mengambil pekerjaan lain. */
export const ACTIVE_CONTRACT_STATUSES: ContractStatus[] = [
  'DEAL_MENUNGGU_BAYAR',
  'DIBAYAR_DITAHAN',
  'SIAP_JALAN',
  'BERJALAN',
  'MENUNGGU_KONFIRMASI',
  'SENGKETA',
];

export const ACTIVE_CONTRACT_MESSAGE =
  'Anda masih memiliki pekerjaan aktif. Selesaikan atau batalkan kontrak tersebut sebelum mencari pekerjaan lain.';
