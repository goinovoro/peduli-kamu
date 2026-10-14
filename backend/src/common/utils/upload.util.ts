import { unlink } from 'fs/promises';
import { join } from 'path';

/** Hapus file upload yatim (misal validasi service gagal setelah multer menyimpan file). */
export async function removeUploadFile(file?: { filename?: string } | null) {
  if (!file?.filename) return;
  for (const dir of ['payments', 'documents', 'attendance']) {
    await unlink(join(process.cwd(), 'uploads', dir, file.filename)).catch(() => undefined);
  }
}
