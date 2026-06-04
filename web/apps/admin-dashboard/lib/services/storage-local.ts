import fs from 'fs/promises';
import path from 'path';
import type { IStorageService } from './storage.service';

/**
 * Local Storage Provider
 * Menyimpan file ke /public/uploads/scans/ untuk development lokal.
 */
export class LocalStorageService implements IStorageService {
  private baseDir = path.join(process.cwd(), 'public', 'uploads');

  async upload(file: Buffer, fileName: string, folder: string = 'general'): Promise<string> {
    const targetDir = path.join(this.baseDir, folder);
    await fs.mkdir(targetDir, { recursive: true });
    
    const filePath = path.join(targetDir, fileName);
    await fs.writeFile(filePath, file);
    
    return `/uploads/${folder}/${fileName}`;
  }


  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    await fs.unlink(fullPath).catch(() => {});
  }
}
