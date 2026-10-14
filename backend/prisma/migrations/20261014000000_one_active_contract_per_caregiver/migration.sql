-- A caregiver can hold only one unfinished contract at a time.
-- Terminal contracts release the caregiver for future work.
CREATE UNIQUE INDEX "Contract_one_active_per_caregiver"
ON "Contract" ("caregiverId")
WHERE "status" IN (
  'DEAL_MENUNGGU_BAYAR',
  'DIBAYAR_DITAHAN',
  'SIAP_JALAN',
  'BERJALAN',
  'MENUNGGU_KONFIRMASI',
  'SENGKETA'
);
