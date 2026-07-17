import { createClient } from '@supabase/supabase-js';
import type { IStorageService } from './storage.service';

/**
 * Supabase Storage Provider
 * Menyimpan file ke Supabase Storage bucket untuk production.
 */
export class SupabaseStorageService implements IStorageService {
  private bucket = process.env.SUPABASE_BUCKET || 'karu-uploads';
  private supabase;

  constructor() {
    let url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL dan SUPABASE_SERVICE_KEY harus diisi di .env untuk storage Supabase.'
      );
    }

    // Bersihkan URL dari path rest/v1/ yang sering tidak sengaja tercopy dari Supabase API Settings
    // karena supabase-js createClient hanya membutuhkan base URL project.
    if (url.endsWith('/rest/v1/')) {
      url = url.replace('/rest/v1/', '');
    } else if (url.endsWith('/rest/v1')) {
      url = url.replace('/rest/v1', '');
    }

    this.supabase = createClient(url, key);
  }

  async upload(file: Buffer, fileName: string, folder: string = 'general'): Promise<string> {
    const fullPath = `${folder}/${fileName}`;

    const ext = fileName.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
    };
    const contentType = mimeMap[ext] || 'image/jpeg';

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(fullPath, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase upload gagal: ${error.message}`);
    }

    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(fullPath);

    return data.publicUrl;
  }


  async delete(filePath: string): Promise<void> {
    // Extract filename dari URL publik
    const fileName = filePath.split('/').pop();
    if (!fileName) return;

    await this.supabase.storage
      .from(this.bucket)
      .remove([fileName]);
  }
}
