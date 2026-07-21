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
    let url = (process.env.SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
    let key = (process.env.SUPABASE_SERVICE_KEY || '').trim().replace(/^["']|["']$/g, '');

    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL dan SUPABASE_SERVICE_KEY harus diisi di .env untuk storage Supabase.'
      );
    }

    // Pastikan URL memiliki skema http:// atau https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    // Bersihkan URL dari path rest/v1/ atau trailing slash
    url = url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

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
