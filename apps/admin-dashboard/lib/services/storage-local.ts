import fs from 'fs/promises';
import path from 'path';
import type { IStorageService } from './storage.service';

/**
 * Local Storage Provider
 * Menyimpan file ke /public/uploads/scans/ untuk development lokal.
 */
export class LocalStorageService implements IStorageService {
  private uploadDir = path.join(process.cwd(), 'public', 'uploads', 'scans');

  async upload(file: Buffer, fileName: string): Promise<string> {
    await fs.mkdir(this.uploadDir, { recursive: true });
    const filePath = path.join(this.uploadDir, fileName);
    await fs.writeFile(filePath, file);
    return `/uploads/scans/${fileName}`;
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    await fs.unlink(fullPath).catch(() => {});
  }
}
