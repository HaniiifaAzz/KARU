/**
 * Storage Service Interface
 * Abstraksi untuk upload file — switch antara lokal dan Supabase via env.
 */
export interface IStorageService {
  /**
   * Upload file dan kembalikan URL publik.
   * @param file - Buffer dari file yang diupload
   * @param fileName - Nama file yang akan disimpan
   * @param folder - Folder atau kategori penyimpanan (default: 'general')
   * @returns URL publik file
   */
  upload(file: Buffer, fileName: string, folder?: string): Promise<string>;

  /**
   * Hapus file berdasarkan path/URL.
   * @param filePath - Path atau URL file yang akan dihapus
   */
  delete(filePath: string): Promise<void>;
}
